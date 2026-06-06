import { convertExcel } from "./converters/excel.js";
import { convertWord } from "./converters/word.js";
import { convertPptx } from "./converters/pptx.js";
import { convertPdf } from "./converters/pdf.js";
import { chunkBlocks, renderIndex, approxTokens } from "./chunker.js";

const $ = (sel) => document.querySelector(sel);

const dropzone = $("#dropzone");
const fileInput = $("#file-input");
const results = $("#results");
const progress = $("#progress");
const progressBar = $("#progress-bar");
const progressLabel = $("#progress-label");
const progressPct = $("#progress-pct");

function setProgress(pct, label) {
  progress.classList.remove("hidden");
  progressBar.style.width = `${pct}%`;
  progressPct.textContent = `${Math.round(pct)}%`;
  if (label) progressLabel.textContent = label;
}
function hideProgress() {
  progress.classList.add("hidden");
}

function extOf(name) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function dispatchConvert(file, opts) {
  const ext = extOf(file.name);
  if (ext === "xlsx" || ext === "xlsm") return convertExcel(file, opts);
  if (ext === "docx") return convertWord(file, opts);
  if (ext === "pptx") return convertPptx(file, opts);
  if (ext === "pdf")  return convertPdf(file, opts);
  throw new Error(`지원하지 않는 형식: .${ext}`);
}

function readOptions() {
  return {
    maxTokens: Math.max(500, parseInt($("#opt-max-tokens").value, 10) || 8000),
    overlap: Math.max(0, parseInt($("#opt-overlap").value, 10) || 0),
    imageMode: $("#opt-images").value,
    sheetRows: Math.max(20, parseInt($("#opt-sheet-rows").value, 10) || 200),
  };
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseName(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for file:// or non-secure contexts where clipboard API is blocked.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, filename);
}

function buildZipBundle(baseDir, chunks, indexMd, images) {
  const zip = new JSZip();
  const root = zip.folder(baseDir);
  root.file("index.md", indexMd);
  for (const c of chunks) {
    const id = String(c.id).padStart(2, "0");
    root.file(`chunk_${id}.md`, c.text);
  }
  if (images && images.length) {
    for (const img of images) {
      root.file(img.path, img.blob);
    }
  }
  return zip;
}

function renderFileResult(file, chunks, indexMd, images, opts) {
  const base = baseName(file.name);
  const wrap = document.createElement("section");
  wrap.className = "bg-white rounded-xl p-4 space-y-3 shadow-sm";

  const totalTok = chunks.reduce((s, c) => s + c.tokens, 0);
  wrap.innerHTML = `
    <div class="flex justify-between items-start gap-4">
      <div>
        <h2 class="font-semibold text-lg">${escHtml(file.name)}</h2>
        <p class="text-xs text-slate-500">
          청크 ${chunks.length}개 · 토큰 약 ${totalTok.toLocaleString()} ·
          이미지 ${images.length}개 · 설정: max ${opts.maxTokens} / overlap ${opts.overlap}
        </p>
      </div>
      <div class="flex gap-2">
        <button data-act="copy-all"
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-500">
          전체 복사
        </button>
        <button data-act="download-zip"
          class="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700">
          ZIP 다운로드
        </button>
      </div>
    </div>
    <details class="bg-slate-50 rounded p-3">
      <summary class="cursor-pointer text-sm font-medium">index.md 미리보기</summary>
      <pre class="mt-2 text-xs whitespace-pre-wrap">${escHtml(indexMd)}</pre>
    </details>
    <div class="space-y-2" data-chunks></div>
  `;

  const list = wrap.querySelector("[data-chunks]");
  for (const c of chunks) {
    const id = String(c.id).padStart(2, "0");
    const card = document.createElement("div");
    card.className = "border rounded p-3 bg-slate-50";
    card.innerHTML = `
      <div class="flex justify-between items-center gap-2">
        <div class="text-sm">
          <span class="font-semibold">청크 ${c.id}</span>
          <span class="text-slate-500"> · ${escHtml(c.range || "-")} · ${c.tokens} 토큰</span>
        </div>
        <div class="flex gap-2">
          <button data-act="copy-chunk" data-id="${c.id}"
            class="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500">
            복사
          </button>
          <button data-act="download-chunk" data-id="${c.id}"
            class="px-2.5 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600">
            .md
          </button>
          <button data-act="toggle-preview" data-id="${c.id}"
            class="px-2.5 py-1 text-xs border rounded hover:bg-white">
            미리보기
          </button>
        </div>
      </div>
      <pre data-preview="${c.id}"
        class="hidden mt-2 text-xs whitespace-pre-wrap bg-white border rounded p-2 max-h-64 overflow-auto"
      >${escHtml(c.text)}</pre>
    `;
    list.appendChild(card);
  }

  wrap.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "copy-chunk") {
      const id = parseInt(btn.dataset.id, 10);
      const c = chunks.find((c) => c.id === id);
      await copyToClipboard(c.text);
      flashButton(btn, "복사됨");
    } else if (act === "download-chunk") {
      const id = parseInt(btn.dataset.id, 10);
      const c = chunks.find((c) => c.id === id);
      downloadText(`chunk_${String(id).padStart(2, "0")}.md`, c.text);
    } else if (act === "toggle-preview") {
      const id = btn.dataset.id;
      const pre = wrap.querySelector(`[data-preview="${id}"]`);
      pre.classList.toggle("hidden");
    } else if (act === "copy-all") {
      const all = chunks.map((c) => c.text).join("\n\n---\n\n");
      await copyToClipboard(all);
      flashButton(btn, "복사됨");
    } else if (act === "download-zip") {
      const zip = buildZipBundle(base, chunks, indexMd, images);
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${base}.zip`);
    }
  });

  results.appendChild(wrap);
}

function flashButton(btn, text) {
  const orig = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1200);
}

async function handleFiles(files) {
  const opts = readOptions();
  results.innerHTML = "";
  const list = Array.from(files);
  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    setProgress((i / list.length) * 100, `${file.name} 변환 중…`);
    try {
      const { blocks, images } = await dispatchConvert(file, opts);
      const chunks = chunkBlocks(blocks, opts.maxTokens, opts.overlap);
      const indexMd = renderIndex(file.name, chunks);
      renderFileResult(file, chunks, indexMd, images, opts);
    } catch (err) {
      const card = document.createElement("section");
      card.className = "bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800";
      card.textContent = `${file.name}: ${err.message || err}`;
      results.appendChild(card);
      console.error(err);
    }
    setProgress(((i + 1) / list.length) * 100, `${file.name} 완료`);
  }
  setTimeout(hideProgress, 500);
}

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  if (e.target.files?.length) handleFiles(e.target.files);
});
["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add("border-indigo-500", "bg-indigo-50");
  }),
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-indigo-500", "bg-indigo-50");
  }),
);
dropzone.addEventListener("drop", (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) handleFiles(files);
});

// Expose helpers for debugging in console.
window.__app = { chunkBlocks, renderIndex, approxTokens };
