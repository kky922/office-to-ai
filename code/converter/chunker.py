"""Block-boundary-respecting chunker with optional token overlap."""

from __future__ import annotations

from dataclasses import dataclass, field

from .readers.common import Block
from .tokens import count_tokens


@dataclass
class Chunk:
    id: int
    text: str
    tokens: int
    range: str
    sources: list[str] = field(default_factory=list)


def _render(blocks: list[Block]) -> str:
    return "\n\n".join(b.md.strip() for b in blocks) + "\n"


def _range(blocks: list[Block]) -> str:
    sources = [b.source for b in blocks if b.source]
    if not sources:
        return ""
    if len(sources) == 1:
        return sources[0]
    return f"{sources[0]} ~ {sources[-1]}"


def _overlap_tail(blocks: list[Block], overlap_tokens: int) -> list[Block]:
    if overlap_tokens <= 0 or not blocks:
        return []
    tail: list[Block] = []
    total = 0
    for b in reversed(blocks):
        tail.insert(0, b)
        total += count_tokens(b.md)
        if total >= overlap_tokens:
            break
    return tail


def chunk(blocks: list[Block], max_tokens: int = 8000, overlap: int = 0) -> list[Chunk]:
    chunks: list[Chunk] = []
    buf: list[Block] = []
    tok = 0

    def flush() -> None:
        nonlocal buf, tok
        if not buf:
            return
        chunks.append(
            Chunk(
                id=len(chunks) + 1,
                text=_render(buf),
                tokens=tok,
                range=_range(buf),
                sources=[b.source for b in buf if b.source],
            )
        )
        carry = _overlap_tail(buf, overlap)
        buf = list(carry)
        tok = sum(count_tokens(b.md) for b in buf)

    for b in blocks:
        t = count_tokens(b.md)
        if t > max_tokens:
            if buf:
                flush()
            chunks.append(
                Chunk(
                    id=len(chunks) + 1,
                    text=_render([b]),
                    tokens=t,
                    range=b.source,
                    sources=[b.source] if b.source else [],
                )
            )
            buf = []
            tok = 0
            continue
        if buf and tok + t > max_tokens:
            flush()
        buf.append(b)
        tok += t
    if buf:
        flush()
    return chunks


def render_index(filename: str, chunks: list[Chunk]) -> str:
    total = sum(c.tokens for c in chunks)
    lines = [
        f"# {filename} — 변환 인덱스",
        "",
        f"- 총 청크: {len(chunks)}",
        f"- 총 토큰(근사): {total}",
        "",
        "## 사용 방법",
        "",
        "1. 아래 표의 순서대로 `chunk_NN.md` 내용을 복사합니다.",
        "2. 채팅창에 **청크 1부터 순서대로** 붙여넣습니다.",
        "3. 질문은 마지막 청크 뒤에 붙여서 전송합니다.",
        "",
        "## 청크 목차",
        "",
        "| # | 원본 범위 | 토큰 | 파일 |",
        "| --- | --- | --- | --- |",
    ]
    for c in chunks:
        lines.append(f"| {c.id} | {c.range or '-'} | {c.tokens} | chunk_{c.id:02d}.md |")
    lines.append("")
    return "\n".join(lines)
