#!/usr/bin/env python3
"""Report writing helpers for evaluation runs."""

from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from datetime import datetime, timezone
from pathlib import Path


def utc_timestamp_compact() -> str:
    """Return UTC timestamp suitable for directory names."""
    return datetime.now(tz=timezone.utc).strftime('%Y-%m-%dT%H%M%SZ')  # noqa: UP017


def create_report_dir(base_dir: Path) -> Path:
    """Create and return a timestamped report directory."""
    report_dir = base_dir / utc_timestamp_compact()
    report_dir.mkdir(parents=True, exist_ok=False)
    return report_dir


def write_json(path: Path, payload: object) -> None:
    """Write indented JSON payload."""
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding='utf-8')


def write_jsonl(path: Path, rows: Sequence[Mapping[str, object]]) -> None:
    """Write JSONL rows to disk."""
    with path.open('w', encoding='utf-8') as file_handle:
        for row in rows:
            file_handle.write(json.dumps(row, ensure_ascii=True) + '\n')
