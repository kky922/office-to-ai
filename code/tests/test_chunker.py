from code.converter.chunker import chunk, render_index
from code.converter.readers.common import Block


def _mk(md: str, source: str = "s") -> Block:
    return Block(kind="paragraph", md=md, source=source)


def test_chunk_respects_max_tokens_within_tolerance():
    # Each block ~= 25 chars → ~7 tokens under char/4 fallback
    blocks = [_mk("x" * 100, f"블록{i}") for i in range(20)]
    chunks = chunk(blocks, max_tokens=50, overlap=0)
    assert len(chunks) >= 3
    for c in chunks:
        # Allow small overshoot since we never split a block mid-way
        assert c.tokens <= 100


def test_chunk_never_splits_a_block():
    big = _mk("z" * 1000, "거대블록")
    chunks = chunk([big], max_tokens=100, overlap=0)
    assert len(chunks) == 1
    assert chunks[0].tokens > 100  # single oversized block goes alone


def test_overlap_copies_tail():
    blocks = [_mk(f"part-{i} " + "x" * 50, f"s{i}") for i in range(10)]
    chunks = chunk(blocks, max_tokens=40, overlap=20)
    assert len(chunks) >= 2
    # The tail of a chunk should appear at the start of the next.
    tail = chunks[0].text.strip().splitlines()[-1]
    assert tail in chunks[1].text


def test_render_index_lists_every_chunk():
    blocks = [_mk("hi", f"원본-{i}") for i in range(5)]
    chunks = chunk(blocks, max_tokens=10)
    md = render_index("x.docx", chunks)
    for c in chunks:
        assert f"chunk_{c.id:02d}.md" in md
    assert "사용 방법" in md
