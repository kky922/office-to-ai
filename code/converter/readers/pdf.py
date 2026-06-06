"""PDF reader using pypdf — text extraction only (v1)."""

from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader

from .common import Block, ImageAsset


def read(path: str | Path, image_mode: str = "extract") -> tuple[list[Block], list[ImageAsset]]:
    path = Path(path)
    reader = PdfReader(str(path))
    blocks: list[Block] = [
        Block(
            kind="heading",
            md=f"# {path.name}\n\n> PDF 문서 · 페이지 {len(reader.pages)}개\n",
            source=path.name,
        )
    ]
    images: list[ImageAsset] = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:  # noqa: BLE001
            text = ""
        body = text.strip() or "_(텍스트 없음 / 스캔 이미지일 수 있음)_"
        blocks.append(
            Block(
                kind="page",
                md=f"### 페이지 {i}\n\n{body}\n",
                source=f"페이지 {i}",
            )
        )
        if image_mode == "extract":
            try:
                for j, img in enumerate(getattr(page, "images", []) or [], start=1):
                    ext = (Path(img.name).suffix.lstrip(".") or "bin").lower()
                    images.append(
                        ImageAsset(
                            path=f"images/page{i}_img{j}.{ext}",
                            data=img.data,
                        )
                    )
            except Exception:  # noqa: BLE001
                pass
    return blocks, images
