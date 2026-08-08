"""Deterministic provenance helpers for profile-QA evaluation and export."""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Collection, Mapping
from pathlib import Path
from typing import Any

from .config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION

CANDIDATE_PROVENANCE_FILENAME = "profile_qa_candidate_provenance.json"
PROVENANCE_SCHEMA_VERSION = 1
_HASH_CHUNK_SIZE = 1024 * 1024
_DIRECTORY_HASH_DOMAIN = b"profile-qa-directory-sha256-v2\0"
_SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")


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
    digest.update(_DIRECTORY_HASH_DOMAIN)
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
        relative_path_bytes = relative_path.encode("utf-8")
        file_digest = hashlib.sha256()
        with candidate.open("rb") as handle:
            for chunk in iter(lambda: handle.read(_HASH_CHUNK_SIZE), b""):
                file_digest.update(chunk)
        digest.update(len(relative_path_bytes).to_bytes(8, byteorder="big"))
        digest.update(relative_path_bytes)
        digest.update(file_digest.digest())
    return digest.hexdigest()


def candidate_payload_sha256(payload_dir: Path) -> str:
    """Hash every regular payload file except the manifest containing the digest."""

    return sha256_directory(
        payload_dir,
        excluded_relative_paths={CANDIDATE_PROVENANCE_FILENAME},
    )


def load_candidate_provenance(payload_dir: Path) -> dict[str, Any]:
    """Load a candidate manifest without following a manifest symlink."""

    manifest_path = payload_dir / CANDIDATE_PROVENANCE_FILENAME
    if manifest_path.is_symlink():
        raise ValueError(f"candidate provenance cannot be a symlink: {manifest_path}")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(
            f"could not load candidate provenance {manifest_path}: {exc}"
        ) from exc
    if not isinstance(manifest, dict):
        raise ValueError(
            f"candidate provenance {manifest_path} must contain a JSON object"
        )
    return manifest


def verify_candidate_payload(payload_dir: Path) -> dict[str, Any]:
    """Reject a candidate whose containing payload no longer matches its manifest."""

    manifest = load_candidate_provenance(payload_dir)
    schema_version = manifest.get("schema_version")
    if type(schema_version) is not int or schema_version != PROVENANCE_SCHEMA_VERSION:
        raise ValueError(
            f"candidate provenance schema_version must be {PROVENANCE_SCHEMA_VERSION}"
        )
    recorded_sha256 = manifest.get("browser_sha256")
    if (
        not isinstance(recorded_sha256, str)
        or _SHA256_PATTERN.fullmatch(recorded_sha256) is None
    ):
        raise ValueError(
            "candidate provenance browser_sha256 must be a lowercase SHA-256 digest"
        )
    actual_sha256 = candidate_payload_sha256(payload_dir)
    if actual_sha256 != recorded_sha256:
        raise ValueError(
            "candidate payload does not match its provenance: "
            f"recorded={recorded_sha256}, actual={actual_sha256}"
        )
    return manifest


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
        "browser_sha256": candidate_payload_sha256(browser_dir),
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return manifest_path


def refresh_candidate_provenance(browser_dir: Path) -> Path:
    """Refresh a copied candidate manifest after deterministic payload changes."""

    manifest_path = browser_dir / CANDIDATE_PROVENANCE_FILENAME
    manifest = load_candidate_provenance(browser_dir)

    manifest["browser_sha256"] = candidate_payload_sha256(browser_dir)
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return manifest_path
