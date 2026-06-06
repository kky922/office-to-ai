// PowerPoint (.pptx) converter. A .pptx is a zip of XML parts;
// we use JSZip to open it and DOMParser to walk slide/note XML.
// Goal: preserve per-slide structure (title / body / notes) and references
// to embedded images without depending on heavy pptx libraries.

const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
const P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function parseXml(str) {
  return new DOMParser().parseFromString(str, "application/xml");
}

function textOfShape(sp) {
  // Each <a:p> is a paragraph; each <a:t> is a text run. Preserve line breaks
  // between paragraphs; collapse runs within a paragraph.
  const paras = sp.getElementsByTagNameNS(A_NS, "p");
  const lines = [];
  for (const p of Array.from(paras)) {
    const ts = p.getElementsByTagNameNS(A_NS, "t");
    const line = Array.from(ts).map((t) => t.textContent || "").join("");
    const lvlAttr = p.getElementsByTagNameNS(A_NS, "pPr")[0]?.getAttribute("lvl");
    const lvl = lvlAttr ? parseInt(lvlAttr, 10) : 0;
    if (line.trim()) {
      lines.push("  ".repeat(Math.max(0, lvl)) + "- " + line);
    } else if (lines.length) {
      // preserve intentional blank line between bullet blocks
      lines.push("");
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isTitle(sp) {
  const phs = sp.getElementsByTagNameNS(P_NS, "ph");
  if (!phs.length) return false;
  const ph = phs[0];
  const type = ph.getAttribute("type") || "";
  if (type === "title" || type === "ctrTitle") return true;
  const idx = ph.getAttribute("idx");
  return type === "" && (idx === null || idx === "0");
}

function extractSlide(doc) {
  const sps = Array.from(doc.getElementsByTagNameNS(P_NS, "sp"));
  let title = "";
  const bodies = [];
  for (const sp of sps) {
    const txt = textOfShape(sp);
    if (!txt) continue;
    if (!title && isTitle(sp)) {
      // Title text — take only the first line, flatten bullet prefix.
      title = txt.replace(/^- /gm, "").split("\n")[0].trim();
    } else {
      bodies.push(txt);
    }
  }
  return { title, bodies };
}

function parseRels(relsXml) {
  // Map relationship Id → target path (relative to the part that owns the rel).
  const map = {};
  if (!relsXml) return map;
  const doc = parseXml(relsXml);
  const rels = doc.getElementsByTagName("Relationship");
  for (const r of Array.from(rels)) {
    map[r.getAttribute("Id")] = {
      target: r.getAttribute("Target") || "",
      type: r.getAttribute("Type") || "",
    };
  }
  return map;
}

function resolvePath(basePartPath, target) {
  // basePartPath like "ppt/slides/slide3.xml", target like "../media/image2.png".
  const baseDir = basePartPath.split("/").slice(0, -1);
  const segs = target.split("/");
  const stack = baseDir.slice();
  for (const s of segs) {
    if (s === "..") stack.pop();
    else if (s === ".") continue;
    else stack.push(s);
  }
  return stack.join("/");
}

async function extractImageForSlide(zip, slidePath, relsMap, slideNum, imageMode, images) {
  const markers = [];
  let imgIdx = 0;
  for (const rel of Object.values(relsMap)) {
    if (!rel.type.endsWith("/image")) continue;
    imgIdx += 1;
    const full = resolvePath(slidePath, rel.target);
    const f = zip.file(full);
    if (!f) continue;
    if (imageMode === "omit") continue;
    if (imageMode === "placeholder") {
      markers.push(`_[이미지: 슬라이드 ${slideNum} #${imgIdx}]_`);
      continue;
    }
    const blob = await f.async("blob");
    const ext = (full.split(".").pop() || "bin").toLowerCase();
    const name = `slide${slideNum}_img${imgIdx}.${ext}`;
    images.push({ path: `images/${name}`, blob });
    markers.push(`![슬라이드 ${slideNum} 이미지 ${imgIdx}](images/${name})`);
  }
  return markers;
}

export async function convertPptx(file, opts) {
  const imageMode = opts?.imageMode || "extract";
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // Collect slide files sorted by numeric suffix.
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
      return na - nb;
    });

  const images = [];
  const blocks = [
    {
      kind: "heading",
      md: `# ${file.name}\n\n> PowerPoint 문서 · 슬라이드 ${slideFiles.length}개\n`,
      meta: { source: file.name },
    },
  ];

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const slideNum = i + 1;
    const slideXml = await zip.file(slidePath).async("string");
    const slideDoc = parseXml(slideXml);
    const { title, bodies } = extractSlide(slideDoc);

    const relsPath = slidePath.replace(
      /ppt\/slides\/slide(\d+)\.xml/,
      "ppt/slides/_rels/slide$1.xml.rels",
    );
    const relsFile = zip.file(relsPath);
    const relsXml = relsFile ? await relsFile.async("string") : null;
    const relsMap = parseRels(relsXml);

    // Notes slide (optional).
    let notes = "";
    for (const rel of Object.values(relsMap)) {
      if (rel.type.endsWith("/notesSlide")) {
        const notesPath = resolvePath(slidePath, rel.target);
        const nf = zip.file(notesPath);
        if (nf) {
          const ndoc = parseXml(await nf.async("string"));
          const ts = ndoc.getElementsByTagNameNS(A_NS, "t");
          notes = Array.from(ts).map((t) => t.textContent || "").join(" ").trim();
        }
      }
    }

    const imageMarkers = await extractImageForSlide(
      zip, slidePath, relsMap, slideNum, imageMode, images,
    );

    const header = `---\n\n### 슬라이드 ${slideNum}${title ? `: ${title}` : ""}`;
    const bodyMd = bodies.join("\n\n");
    const imgMd = imageMarkers.join("\n\n");
    const notesMd = notes ? `> 노트: ${notes}` : "";
    const md = [header, bodyMd, imgMd, notesMd].filter(Boolean).join("\n\n") + "\n";
    blocks.push({
      kind: "slide",
      md,
      meta: { source: `슬라이드 ${slideNum}${title ? `: ${title}` : ""}` },
    });
  }

  return { blocks, images };
}

if (typeof window !== "undefined") {
  window.__converters = window.__converters || {};
  window.__converters.pptx = convertPptx;
}
