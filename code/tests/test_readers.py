from code.converter.dispatch import read_file


def test_excel_reader_emits_sheet_headings_and_tables(sample_xlsx):
    blocks, images = read_file(sample_xlsx)
    mds = [b.md for b in blocks]
    assert any("## 시트: 인사" in m for m in mds)
    assert any("## 시트: 매출" in m for m in mds)
    assert any("| 이름 | 부서 | 입사년도 |" in m for m in mds)
    assert images == []


def test_word_reader_captures_headings_and_table(sample_docx):
    blocks, _ = read_file(sample_docx)
    mds = [b.md for b in blocks]
    assert any(m.startswith("# 테스트 문서") for m in mds)
    assert any(m.startswith("## 2장") for m in mds)
    assert any("- 불릿 항목 1" in m for m in mds)
    assert any("| A | B |" in m for m in mds)


def test_pptx_reader_emits_one_block_per_slide_with_notes(sample_pptx):
    blocks, _ = read_file(sample_pptx)
    slides = [b for b in blocks if b.kind == "slide"]
    assert len(slides) == 3
    joined = "\n".join(b.md for b in slides)
    assert "슬라이드 1 제목" in joined
    assert "발표자 노트 1" in joined


def test_pdf_reader_emits_one_block_per_page(sample_pdf):
    blocks, _ = read_file(sample_pdf)
    pages = [b for b in blocks if b.kind == "page"]
    assert len(pages) == 2
    assert "페이지 1" in pages[0].md
    assert "Page 1" in pages[0].md
