// Word (.docx) converter using mammoth.js + turndown.
// mammoth produces HTML with inline <img src="data:..."> entries when we keep images.

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  td.keep(["sup", "sub"]);
  return td;
}

function splitByHeading(markdown, filename) {
  // Split the document into blocks on top-level headings so the chunker can
  // respect section boundaries without cutting through a paragraph.
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let buf = [];
  let currentHeading = filename;

  const flush = () => {
    if (!buf.length) return;
    const text = buf.join("\n").trim();
    if (text) {
      blocks.push({
        kind: "paragraph",
        md: text + "\n",
        meta: { source: currentHeading },
      });
    }
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      flush();
      currentHeading = m[2].trim() || currentHeading;
      blocks.push({
        kind: "heading",
        md: line,
        meta: { source: currentHeading },
      });
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

function dataUrlToBlob(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return null;
  const mime = m[1];
  const bytes = atob(m[2]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return { blob: new Blob([arr], { type: mime }), mime };
}

function extToMime(mime) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/webp": "webp",
  };
  return map[mime] || "bin";
}

export async function convertWord(file, opts) {
  const buf = await file.arrayBuffer();
  const images = [];
  let imgCounter = 0;
  const imageMode = opts?.imageMode || "extract";

  const convertImage = mammoth.images.imgElement(async (image) => {
    imgCounter += 1;
    if (imageMode === "omit") {
      return { src: "", alt: "" };
    }
    if (imageMode === "placeholder") {
      return { src: "about:blank", alt: `이미지 ${imgCounter}` };
    }
    const buffer = await image.read("base64");
    const dataUrl = `data:${image.contentType};base64,${buffer}`;
    const parsed = dataUrlToBlob(dataUrl);
    if (!parsed) return { src: "", alt: "" };
    const ext = extToMime(parsed.mime);
    const name = `word_img_${imgCounter}.${ext}`;
    images.push({ path: `images/${name}`, blob: parsed.blob });
    return { src: `images/${name}`, alt: `이미지 ${imgCounter}` };
  });

  const result = await mammoth.convertToHtml(
    { arrayBuffer: buf },
    { convertImage, styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Quote'] => blockquote",
    ]},
  );
  const html = result.value || "";
  const td = makeTurndown();
  const md = td.turndown(html);

  // Placeholder-mode: mammoth emits ![alt](about:blank). Replace with friendlier text.
  let finalMd = md;
  if (imageMode === "placeholder") {
    finalMd = finalMd.replace(/!\[([^\]]*)\]\(about:blank\)/g, "_[이미지: $1]_");
  }
  if (imageMode === "omit") {
    finalMd = finalMd.replace(/!\[[^\]]*\]\(\s*\)/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  }

  const blocks = [
    {
      kind: "heading",
      md: `# ${file.name}\n\n> Word 문서\n`,
      meta: { source: file.name },
    },
    ...splitByHeading(finalMd, file.name),
  ];
  return { blocks, images };
}

if (typeof window !== "undefined") {
  window.__converters = window.__converters || {};
  window.__converters.word = convertWord;
}
