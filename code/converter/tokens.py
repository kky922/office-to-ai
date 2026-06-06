"""Token counting with tiktoken when available, character-quartile fallback otherwise."""

from __future__ import annotations

import math

try:
    import tiktoken  # type: ignore

    _enc = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text: str) -> int:
        if not text:
            return 0
        return len(_enc.encode(text))
except Exception:  # noqa: BLE001 — any failure falls back to approximation
    def count_tokens(text: str) -> int:
        if not text:
            return 0
        return math.ceil(len(text) / 4)
