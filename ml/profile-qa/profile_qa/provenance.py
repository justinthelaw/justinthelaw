"""Deterministic lineage and artifact-digest helpers for profile-QA releases."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

LINEAGE_FILENAME = "teapot_profile_qa_lineage.json"
LINEAGE_SCHEMA_VERSION = 1
EXPECTED_LINEAGE_PIPELINE = "profile-qa-teapot-lora"
ADAPTER_CHECKPOINT_FIELD = "adapter_checkpoint"
ADAPTER_DIGEST_FIELD = "adapter_model_sha256"
BASE_MODEL_REVISION_FIELD = "base_model_revision"
MERGED_DIGEST_FIELD = "merged_model_sha256"
DATASET_DIGEST_FIELD = "dataset_sha256"
PROMPT_DIGEST_FIELD = "evaluation_prompt_sha256"
SOURCE_LINEAGE_DIGEST_FIELD = "source_lineage_sha256"
ARTIFACT_STAGE_FIELD = "artifact_stage"
ARTIFACT_DIGEST_FIELD = "artifact_sha256"
PUBLIC_LINEAGE_FIELDS = frozenset(
    {
        "schema_version",
        ADAPTER_CHECKPOINT_FIELD,
        ADAPTER_DIGEST_FIELD,
        "base_model",
        BASE_MODEL_REVISION_FIELD,
        "pipeline",
        MERGED_DIGEST_FIELD,
    }
)
ARTIFACT_LINEAGE_FIELDS = PUBLIC_LINEAGE_FIELDS | {
    SOURCE_LINEAGE_DIGEST_FIELD,
    ARTIFACT_STAGE_FIELD,
    ARTIFACT_DIGEST_FIELD,
}


def _artifact_digest_exclusions(stage: str) -> frozenset[str]:
    excluded = {LINEAGE_FILENAME}
    if stage == "browser":
        # Preparation generates the release-specific model card after export.
        excluded.add("README.md")
    return frozenset(excluded)


def load_json_object(path: Path, *, label: str) -> dict[str, Any]:
    """Read a required JSON object with a release-oriented error message."""

    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"could not load required {label} {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"required {label} {path} must contain a JSON object")
    return value


def file_sha256(path: Path) -> str:
    """Return the SHA-256 digest of one file."""

    digest = hashlib.sha256()
    try:
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as exc:
        raise ValueError(f"could not hash required file {path}: {exc}") from exc
    return digest.hexdigest()


def canonical_json_sha256(value: Any) -> str:
    """Hash a JSON value with deterministic encoding and no layout variance."""

    encoded = json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def directory_sha256(
    directory: Path,
    *,
    excluded_relative_paths: frozenset[str] = frozenset(),
) -> str:
    """Hash relative paths, sizes, and contents for every regular file."""

    if not directory.is_dir():
        raise ValueError(f"artifact directory does not exist: {directory}")

    digest = hashlib.sha256()
    entries = sorted(directory.rglob("*"))
    for file_path in entries:
        if file_path.is_symlink():
            raise ValueError(f"artifact directories may not contain symlinks: {file_path}")
        if not file_path.is_file():
            continue
        relative_path = file_path.relative_to(directory).as_posix()
        if relative_path in excluded_relative_paths:
            continue

        relative_bytes = relative_path.encode("utf-8")
        file_size = file_path.stat().st_size
        digest.update(len(relative_bytes).to_bytes(8, "big"))
        digest.update(relative_bytes)
        digest.update(file_size.to_bytes(8, "big"))
        with file_path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    return digest.hexdigest()


def require_sha256(value: Any, *, field: str, source: Path) -> str:
    """Validate and normalize a lowercase SHA-256 value."""

    if not isinstance(value, str):
        raise ValueError(f"{source} is missing SHA-256 field {field!r}")
    normalized = value.strip().lower()
    if len(normalized) != 64 or any(character not in "0123456789abcdef" for character in normalized):
        raise ValueError(f"{source} field {field!r} must be a 64-character SHA-256")
    return normalized


def require_checkpoint_label(value: Any, *, source: Path) -> str:
    """Require a portable checkpoint label rather than a workstation path."""

    if not isinstance(value, str) or not value.strip():
        raise ValueError(
            f"{source} is missing non-empty string field {ADAPTER_CHECKPOINT_FIELD!r}"
        )
    label = value.strip()
    if re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}", label) is None:
        raise ValueError(
            f"{source} field {ADAPTER_CHECKPOINT_FIELD!r} must be a portable "
            "ASCII label"
        )
    return label


def public_lineage_fields(source_lineage: dict[str, Any]) -> dict[str, Any]:
    """Remove host-local locators before lineage enters publishable artifacts."""

    return {
        key: value
        for key, value in source_lineage.items()
        if key in PUBLIC_LINEAGE_FIELDS
    }


def write_artifact_lineage(
    artifact_dir: Path,
    *,
    source_lineage: dict[str, Any],
    source_lineage_sha256: str,
    stage: str,
) -> Path:
    """Write lineage metadata bound to an artifact directory's exact contents."""

    lineage_path = artifact_dir / LINEAGE_FILENAME
    payload = public_lineage_fields(source_lineage)
    payload[SOURCE_LINEAGE_DIGEST_FIELD] = source_lineage_sha256
    payload[ARTIFACT_STAGE_FIELD] = stage
    payload[ARTIFACT_DIGEST_FIELD] = directory_sha256(
        artifact_dir,
        excluded_relative_paths=_artifact_digest_exclusions(stage),
    )
    lineage_path.write_text(
        json.dumps(payload, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return lineage_path


def validate_artifact_lineage(
    artifact_dir: Path,
    *,
    source_lineage_sha256: str,
    stage: str,
) -> dict[str, Any]:
    """Verify that an artifact marker matches its source lineage and files."""

    lineage_path = artifact_dir / LINEAGE_FILENAME
    lineage = load_json_object(lineage_path, label=f"{stage} artifact lineage")
    unexpected_fields = sorted(set(lineage) - ARTIFACT_LINEAGE_FIELDS)
    if unexpected_fields:
        raise ValueError(
            f"{lineage_path} contains non-publishable fields: "
            f"{', '.join(unexpected_fields)}"
        )
    recorded_source_digest = require_sha256(
        lineage.get(SOURCE_LINEAGE_DIGEST_FIELD),
        field=SOURCE_LINEAGE_DIGEST_FIELD,
        source=lineage_path,
    )
    if recorded_source_digest != source_lineage_sha256:
        raise ValueError(
            f"{lineage_path} does not match the selected merge lineage: "
            f"expected {source_lineage_sha256}, got {recorded_source_digest}"
        )
    recorded_stage = lineage.get(ARTIFACT_STAGE_FIELD)
    if recorded_stage != stage:
        raise ValueError(
            f"{lineage_path} field {ARTIFACT_STAGE_FIELD!r} must be {stage!r}, "
            f"got {recorded_stage!r}"
        )
    recorded_artifact_digest = require_sha256(
        lineage.get(ARTIFACT_DIGEST_FIELD),
        field=ARTIFACT_DIGEST_FIELD,
        source=lineage_path,
    )
    actual_artifact_digest = directory_sha256(
        artifact_dir,
        excluded_relative_paths=_artifact_digest_exclusions(stage),
    )
    if recorded_artifact_digest != actual_artifact_digest:
        raise ValueError(
            f"{lineage_path} artifact digest does not match {artifact_dir}: "
            f"expected {recorded_artifact_digest}, got {actual_artifact_digest}"
        )
    return lineage
