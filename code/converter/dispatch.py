"""Dispatch input files to the appropriate reader based on extension."""

from __future__ import annotations

from pathlib import Path

from .readers import excel as excel_reader
from .readers import pdf as pdf_reader
from .readers import pptx as pptx_reader
from .readers import word as word_reader
from .readers.common import Block, ImageAsset

SUPPORTED_EXTS = {".xlsx", ".xlsm", ".docx", ".pptx", ".pdf"}


def read_file(
    path: str | Path,
    image_mode: str = "extract",
    sheet_rows: int = 200,
) -> tuple[list[Block], list[ImageAsset]]:
    p = Path(path)
    ext = p.suffix.lower()
    if ext in {".xlsx", ".xlsm"}:
        return excel_reader.read(p, rows_per_section=sheet_rows)
    if ext == ".docx":
        return word_reader.read(p, image_mode=image_mode)
    if ext == ".pptx":
        return pptx_reader.read(p, image_mode=image_mode)
    if ext == ".pdf":
        return pdf_reader.read(p, image_mode=image_mode)
    raise ValueError(f"지원하지 않는 형식: {ext}")
