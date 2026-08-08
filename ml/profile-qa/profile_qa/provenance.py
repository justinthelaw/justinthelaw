"""Deterministic provenance helpers for profile-QA evaluation and export."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Collection, Mapping
from pathlib import Path
from typing import Any

from .config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION

CANDIDATE_PROVENANCE_FILENAME = "profile_qa_candidate_provenance.json"
PROVENANCE_SCHEMA_VERSION = 1
_HASH_CHUNK_SIZE = 1024 * 1024


def sha256_file(path: Path) -> str:
    """Return a SHA-256 digest for one regular file."""

    if path.is_symlink() or not path.is_file():
        raise ValueError(f"provenance input must be a regular file: {path}")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(_HASH_CHUNK_SIZE), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_directory(
    path: Path,
    *,
    excluded_relative_paths: Collection[str] = (),
) -> str:
    """Hash regular-file paths and contents in a directory deterministically."""

    if path.is_symlink() or not path.is_dir():
        raise ValueError(f"provenance input must be a directory: {path}")

    excluded = set(excluded_relative_paths)
    digest = hashlib.sha256()
    for candidate in sorted(path.rglob("*")):
        relative_path = candidate.relative_to(path).as_posix()
        if candidate.is_symlink():
            raise ValueError(
                f"provenance directories cannot contain symlinks: {candidate}"
            )
        if relative_path in excluded:
            continue
        if not candidate.is_file():
            continue
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        with candidate.open("rb") as handle:
            for chunk in iter(lambda: handle.read(_HASH_CHUNK_SIZE), b""):
                digest.update(chunk)
        digest.update(b"\0")
    return digest.hexdigest()


def model_provenance(model_id: str) -> dict[str, Any]:
    """Describe the pinned baseline or fingerprint a trusted local candidate."""

    if model_id.rstrip("/") == PRIMARY_BASE_MODEL_ID:
        return {
            "id": PRIMARY_BASE_MODEL_ID,
            "revision": PRIMARY_BASE_MODEL_REVISION,
        }

    model_path = Path(model_id)
    if not model_path.is_dir():
        raise ValueError(
            "candidate evaluation provenance requires --model-id to be a local "
            f"model directory, got {model_id}"
        )
    return {
        "kind": "local-directory",
        "sha256": sha256_directory(model_path),
    }


def evaluation_provenance(
    *,
    dataset_path: Path,
    split: str,
    model_id: str,
) -> dict[str, Any]:
    """Build provenance attached to an evaluation report."""

    return {
        "schema_version": PROVENANCE_SCHEMA_VERSION,
        "model": model_provenance(model_id),
        "dataset_sha256": sha256_file(dataset_path),
        "split": split,
    }


def write_candidate_provenance(
    *,
    source_model: str,
    browser_dir: Path,
    expected_source: Mapping[str, Any] | None = None,
) -> Path:
    """Bind a browser export to the local model directory that produced it."""

    source = model_provenance(source_model)
    if "sha256" not in source:
        raise ValueError(
            "browser candidates must be exported from a local model directory"
        )
    if expected_source is not None and source != expected_source:
        raise RuntimeError(
            "source model changed while the browser export was in progress"
        )

    manifest_path = browser_dir / CANDIDATE_PROVENANCE_FILENAME
    manifest = {
        "schema_version": PROVENANCE_SCHEMA_VERSION,
        "source_model": source,
        "browser_sha256": sha256_directory(
            browser_dir,
            excluded_relative_paths={CANDIDATE_PROVENANCE_FILENAME},
        ),
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return manifest_path
