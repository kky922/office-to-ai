"""Shared types for readers and the pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Block:
    """One logical unit of content (heading, paragraph, slide, page, row-window)."""

    kind: str
    md: str
    source: str = ""
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class ImageAsset:
    """Binary image extracted from an Office file."""

    path: str  # relative path like "images/slide3_img1.png"
    data: bytes
