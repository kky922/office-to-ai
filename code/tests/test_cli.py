from pathlib import Path

from code.converter.cli import main


def test_cli_converts_docx_and_writes_outputs(sample_docx, tmp_path, capsys):
    rc = main([str(sample_docx), "-o", str(tmp_path), "--max-tokens", "500"])
    assert rc == 0
    base = tmp_path / Path(sample_docx).stem
    assert (base / "index.md").exists()
    chunks = sorted(base.glob("chunk_*.md"))
    assert chunks, "expected at least one chunk"
    first = chunks[0].read_text(encoding="utf-8")
    assert "# " in first  # filename heading present


def test_cli_fails_cleanly_for_missing_input(tmp_path, capsys):
    rc = main(["/no/such/path.xlsx", "-o", str(tmp_path)])
    assert rc == 2
    err = capsys.readouterr().err
    assert "경로" in err or "없습니다" in err
