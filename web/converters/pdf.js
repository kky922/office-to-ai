// PDF converter using Mozilla's pdf.js (global pdfjsLib).
// v1 focuses on text extraction. One block per page, joined with heading markers
// so the chunker can slice on page boundaries.

function itemsToLines(items) {
  // pdf.js text items include positional y/transform info; we use line breaks
  // based on y-coordinate changes to reconstruct rough lines.
  const lines = [];
  let current = [];
  let lastY = null;
  for (const it of items) {
    if (!it.str) continue;
    const y = it.transform ? it.transform[5] : null;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
      lines.push(current.join(""));
      current = [];
    }
    current.push(it.str);
    lastY = y;
  }
  if (current.length) lines.push(current.join(""));
  return lines.map((l) => l.trim()).filter(Boolean);
}

export async function convertPdf(file, _opts) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const blocks = [
    {
      kind: "heading",
      md: `# ${file.name}\n\n> PDF 문서 · 페이지 ${pdf.numPages}개\n`,
      meta: { source: file.name },
    },
  ];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = itemsToLines(content.items);
    const body = lines.join("\n").trim();
    blocks.push({
      kind: "page",
      md: `### 페이지 ${i}\n\n${body || "_(텍스트 없음 / 스캔 이미지일 수 있음)_"}\n`,
      meta: { source: `페이지 ${i}` },
    });
  }
  return { blocks, images: [] };
}

if (typeof window !== "undefined") {
  window.__converters = window.__converters || {};
  window.__converters.pdf = convertPdf;
}
