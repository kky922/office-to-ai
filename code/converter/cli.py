"""Command-line entry for the converter."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .chunker import chunk, render_index
from .dispatch import SUPPORTED_EXTS, read_file


def _write_outputs(out_dir: Path, filename: str, chunks, index_md: str, images) -> None:
    base = out_dir / Path(filename).stem
    base.mkdir(parents=True, exist_ok=True)
    (base / "index.md").write_text(index_md, encoding="utf-8")
    for c in chunks:
        (base / f"chunk_{c.id:02d}.md").write_text(c.text, encoding="utf-8")
    if images:
        (base / "images").mkdir(exist_ok=True)
        for img in images:
            (base / img.path).write_bytes(img.data)


def _expand_inputs(paths: list[str], glob: str | None) -> list[Path]:
    out: list[Path] = []
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            pattern = glob or "*"
            for child in sorted(p.rglob(pattern)):
                if child.is_file() and child.suffix.lower() in SUPPORTED_EXTS:
                    out.append(child)
        elif p.is_file():
            out.append(p)
        else:
            print(f"경고: 경로를 찾을 수 없음 — {p}", file=sys.stderr)
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m code.converter",
        description="MS Office(.xlsx/.docx/.pptx) · PDF를 LLM 붙여넣기용 마크다운 청크로 변환",
    )
    parser.add_argument("inputs", nargs="+", help="변환할 파일 또는 폴더")
    parser.add_argument("-o", "--out", default="./out", help="출력 디렉터리 (기본 ./out)")
    parser.add_argument("--max-tokens", type=int, default=8000, help="청크 최대 토큰 (기본 8000)")
    parser.add_argument("--overlap", type=int, default=0, help="청크 간 오버랩 토큰 (기본 0)")
    parser.add_argument(
        "--images",
        choices=["extract", "placeholder", "omit"],
        default="extract",
        help="이미지 처리 방식 (기본 extract)",
    )
    parser.add_argument("--sheet-rows", type=int, default=200, help="Excel 시트 행 분할 단위 (기본 200)")
    parser.add_argument("--glob", default=None, help="디렉터리 입력 시 파일 필터 (예: '*.xlsx')")
    args = parser.parse_args(argv)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = _expand_inputs(args.inputs, args.glob)
    if not files:
        print("변환할 파일이 없습니다.", file=sys.stderr)
        return 2

    errors = 0
    for f in files:
        try:
            blocks, images = read_file(
                f,
                image_mode=args.images,
                sheet_rows=args.sheet_rows,
            )
            chunks = chunk(blocks, max_tokens=args.max_tokens, overlap=args.overlap)
            index_md = render_index(f.name, chunks)
            _write_outputs(out_dir, f.name, chunks, index_md, images)
            print(f"[OK] {f} → {out_dir / f.stem} ({len(chunks)} 청크)")
        except Exception as exc:  # noqa: BLE001
            errors += 1
            print(f"[ERR] {f}: {exc}", file=sys.stderr)
    return 0 if errors == 0 else 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
