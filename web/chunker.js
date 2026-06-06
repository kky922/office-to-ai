// Block-boundary-respecting chunker. Counts tokens with the len/4 approximation.
// Produces chunks of up to maxTokens with optional token overlap carried forward.

export function approxTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function overlapTail(blocks, overlapTokens) {
  if (overlapTokens <= 0 || blocks.length === 0) return [];
  const tail = [];
  let t = 0;
  for (let i = blocks.length - 1; i >= 0; i--) {
    t += approxTokens(blocks[i].md);
    tail.unshift(blocks[i]);
    if (t >= overlapTokens) break;
  }
  return tail;
}

function renderChunk(blocks) {
  return blocks.map((b) => b.md.trim()).join("\n\n") + "\n";
}

function sourceRange(blocks) {
  const srcs = blocks.map((b) => b?.meta?.source).filter(Boolean);
  if (!srcs.length) return "";
  if (srcs.length === 1) return srcs[0];
  return `${srcs[0]} ~ ${srcs[srcs.length - 1]}`;
}

export function chunkBlocks(blocks, maxTokens = 8000, overlap = 0) {
  const chunks = [];
  let buf = [];
  let tok = 0;
  const flush = () => {
    if (!buf.length) return;
    chunks.push({
      id: chunks.length + 1,
      text: renderChunk(buf),
      tokens: tok,
      range: sourceRange(buf),
    });
    const carry = overlapTail(buf, overlap);
    buf = carry.slice();
    tok = carry.reduce((s, b) => s + approxTokens(b.md), 0);
  };

  for (const b of blocks) {
    const t = approxTokens(b.md);
    // If a single block exceeds maxTokens, emit it alone — never split mid-block.
    if (t > maxTokens) {
      if (buf.length) flush();
      chunks.push({
        id: chunks.length + 1,
        text: renderChunk([b]),
        tokens: t,
        range: b?.meta?.source || "",
      });
      buf = [];
      tok = 0;
      continue;
    }
    if (buf.length && tok + t > maxTokens) flush();
    buf.push(b);
    tok += t;
  }
  if (buf.length) flush();
  // Strip overlap prefix from chunk[0] (no preceding chunk to overlap).
  return chunks;
}

export function renderIndex(filename, chunks) {
  const total = chunks.reduce((s, c) => s + c.tokens, 0);
  const lines = [
    `# ${filename} — 변환 인덱스`,
    "",
    `- 총 청크: ${chunks.length}`,
    `- 총 토큰(근사): ${total}`,
    "",
    "## 사용 방법",
    "",
    "1. 아래 표의 순서대로 `chunk_NN.md` 내용을 복사합니다.",
    "2. 채팅창에 **청크 1부터 순서대로** 붙여넣습니다.",
    "3. 질문은 마지막 청크 뒤에 붙여서 전송합니다.",
    "",
    "## 청크 목차",
    "",
    "| # | 원본 범위 | 토큰(근사) | 파일 |",
    "| --- | --- | --- | --- |",
  ];
  for (const c of chunks) {
    const id = String(c.id).padStart(2, "0");
    lines.push(`| ${c.id} | ${c.range || "-"} | ${c.tokens} | chunk_${id}.md |`);
  }
  lines.push("");
  return lines.join("\n");
}

if (typeof window !== "undefined") {
  window.__chunker = { chunkBlocks, renderIndex, approxTokens };
}
