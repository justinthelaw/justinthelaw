"""Export and validate browser-compatible ONNX artifacts."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import MERGED_DIR, ONNX_DIR, PRIMARY_BASE_MODEL_REVISION
from .provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    ARTIFACT_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    directory_sha256,
    load_json_object,
    public_lineage_sha256,
    require_checkpoint_label,
    require_sha256,
    validate_artifact_lineage,
    write_artifact_lineage,
)
from .train_lora import ensure_primary_base_model_id

TEAPOT_EXPORT_TASK = "text2text-generation-with-past"


@dataclass(frozen=True)
class ValidatedMergeLineage:
    data: dict[str, Any]
    sha256: str


def _require_disjoint_output(
    output_dir: Path,
    *input_dirs: Path,
    operation: str,
) -> None:
    """Reject output locations that could delete or overwrite pipeline inputs."""

    if output_dir.is_symlink():
        raise RuntimeError(f"{operation} output directory must not be a symlink: {output_dir}")

    resolved_output = output_dir.resolve()
    for input_dir in input_dirs:
        resolved_input = input_dir.resolve()
        if (
            resolved_output == resolved_input
            or resolved_output in resolved_input.parents
            or resolved_input in resolved_output.parents
        ):
            raise RuntimeError(
                f"{operation} output directory must not overlap input "
                f"{input_dir}: {output_dir} and {input_dir}"
            )


def reject_external_data_files(output_dir: Path) -> None:
    """Reject exports that require external .onnx.data sidecar files."""

    external_files = sorted(output_dir.rglob("*.onnx.data"))
    if external_files:
        joined = "\n".join(str(path) for path in external_files)
        raise RuntimeError(f"ONNX export uses external data files, which are not browser-safe:\n{joined}")


def run_command(command: list[str]) -> None:
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"command failed with exit code {result.returncode}: {' '.join(command)}")


def venv_tool(name: str) -> str:
    tool_path = Path(sys.executable).parent / name
    return str(tool_path) if tool_path.exists() else name


def ensure_teapot_export_model(model: str) -> ValidatedMergeLineage:
    """Require a merged model directory produced by the Teapot adapter merge step."""

    model_path = Path(model)
    lineage_path = model_path / LINEAGE_FILENAME
    if not lineage_path.exists():
        raise RuntimeError(
            "ONNX export is TeapotLLM-only; pass a merged model directory produced by "
            f"profile_qa.merge_adapter with {LINEAGE_FILENAME}"
        )
    try:
        lineage = load_json_object(lineage_path, label="model lineage")
    except ValueError as exc:
        raise RuntimeError(str(exc)) from exc
    if lineage.get("schema_version") != LINEAGE_SCHEMA_VERSION:
        raise RuntimeError(
            f"{lineage_path} field 'schema_version' must be "
            f"{LINEAGE_SCHEMA_VERSION}"
        )
    base_model = lineage.get("base_model")
    if not isinstance(base_model, str):
        raise RuntimeError(f"{lineage_path} does not record a base_model")
    ensure_primary_base_model_id(base_model, source=f"{lineage_path} base_model")
    if lineage.get("pipeline") != EXPECTED_LINEAGE_PIPELINE:
        raise RuntimeError(
            f"{lineage_path} does not record pipeline "
            f"{EXPECTED_LINEAGE_PIPELINE!r}"
        )
    try:
        require_checkpoint_label(
            lineage.get(ADAPTER_CHECKPOINT_FIELD),
            source=lineage_path,
        )
        require_sha256(
            lineage.get(ADAPTER_DIGEST_FIELD),
            field=ADAPTER_DIGEST_FIELD,
            source=lineage_path,
        )
        recorded_merged_digest = require_sha256(
            lineage.get(MERGED_DIGEST_FIELD),
            field=MERGED_DIGEST_FIELD,
            source=lineage_path,
        )
    except ValueError as exc:
        raise RuntimeError(str(exc)) from exc
    if lineage.get(BASE_MODEL_REVISION_FIELD) != PRIMARY_BASE_MODEL_REVISION:
        raise RuntimeError(
            f"{lineage_path} field {BASE_MODEL_REVISION_FIELD!r} must be "
            f"{PRIMARY_BASE_MODEL_REVISION!r}"
        )
    actual_merged_digest = directory_sha256(
        model_path,
        excluded_relative_paths=frozenset({LINEAGE_FILENAME}),
    )
    if recorded_merged_digest != actual_merged_digest:
        raise RuntimeError(
            f"{lineage_path} merged model digest does not match {model_path}: "
            f"expected {recorded_merged_digest}, got {actual_merged_digest}"
        )
    return ValidatedMergeLineage(
        data=lineage,
        sha256=public_lineage_sha256(lineage),
    )


def export_onnx(model: str, output_dir: Path) -> ValidatedMergeLineage:
    lineage = ensure_teapot_export_model(model)
    model_path = Path(model).resolve()
    _require_disjoint_output(
        output_dir,
        model_path,
        operation="full-precision export",
    )
    if output_dir.exists():
        if not output_dir.is_dir():
            raise RuntimeError(
                f"full-precision export path is not a directory: {output_dir}"
            )
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    run_command(
        [
            venv_tool("optimum-cli"),
            "export",
            "onnx",
            "--model",
            model,
            "--task",
            TEAPOT_EXPORT_TASK,
            str(output_dir),
        ]
    )
    reject_external_data_files(output_dir)
    write_artifact_lineage(
        output_dir,
        source_lineage=lineage.data,
        stage="onnx-fp",
    )
    return lineage


def quantize_onnx(
    input_dir: Path,
    output_dir: Path,
    dtype: str,
    lineage: ValidatedMergeLineage,
) -> None:
    _require_disjoint_output(
        output_dir,
        input_dir,
        operation=f"{dtype} quantization",
    )
    fp_lineage = validate_artifact_lineage(
        input_dir,
        source_lineage=lineage.data,
        stage="onnx-fp",
    )
    fp_artifact_sha256 = require_sha256(
        fp_lineage.get(ARTIFACT_DIGEST_FIELD),
        field=ARTIFACT_DIGEST_FIELD,
        source=input_dir / LINEAGE_FILENAME,
    )
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        from onnxruntime.quantization import QuantType, quantize_dynamic
    except ImportError as exc:
        raise RuntimeError(
            "Install export dependencies with uv pip sync --python "
            "ml/profile-qa/.venv-export --require-hashes "
            "ml/profile-qa/requirements-export.lock"
        ) from exc

    weight_type = QuantType.QInt8 if dtype == "int8" else QuantType.QUInt8
    for source_path in sorted(input_dir.iterdir()):
        if source_path.name == LINEAGE_FILENAME:
            continue
        target_path = output_dir / source_path.name
        if source_path.suffix == ".onnx":
            quantize_dynamic(
                model_input=str(source_path),
                model_output=str(target_path),
                weight_type=weight_type,
                extra_options={"EnableSubgraph": True},
            )
        elif source_path.is_file():
            shutil.copy2(source_path, target_path)
    reject_external_data_files(output_dir)
    write_artifact_lineage(
        output_dir,
        source_lineage=lineage.data,
        stage=f"onnx-{dtype}",
        parent_artifact_sha256s={"onnx-fp": fp_artifact_sha256},
    )


def get_browser_model_paths(quantized_dir: Path) -> list[Path]:
    """Return ONNX session files needed by Transformers.js browser loading."""

    encoder_path = quantized_dir / "encoder_model.onnx"
    merged_decoder_path = quantized_dir / "decoder_model_merged.onnx"

    if encoder_path.exists() and merged_decoder_path.exists():
        return [encoder_path, merged_decoder_path]

    missing_paths = [
        str(path) for path in (encoder_path, merged_decoder_path) if not path.exists()
    ]
    raise RuntimeError(
        "Teapot/T5 browser export requires encoder and merged decoder ONNX files; "
        f"missing: {', '.join(missing_paths)}"
    )


def assemble_browser_artifact(
    fp_dir: Path,
    quantized_dirs: dict[str, Path],
    output_dir: Path,
    lineage: ValidatedMergeLineage,
) -> None:
    """Create a Transformers.js-compatible upload directory."""

    _require_disjoint_output(
        output_dir,
        fp_dir,
        *quantized_dirs.values(),
        operation="browser artifact assembly",
    )
    fp_lineage = validate_artifact_lineage(
        fp_dir,
        source_lineage=lineage.data,
        stage="onnx-fp",
    )
    fp_artifact_sha256 = require_sha256(
        fp_lineage.get(ARTIFACT_DIGEST_FIELD),
        field=ARTIFACT_DIGEST_FIELD,
        source=fp_dir / LINEAGE_FILENAME,
    )
    browser_parent_digests = {"onnx-fp": fp_artifact_sha256}
    for dtype, quantized_dir in quantized_dirs.items():
        quantized_lineage = validate_artifact_lineage(
            quantized_dir,
            source_lineage=lineage.data,
            stage=f"onnx-{dtype}",
            parent_artifact_sha256s={"onnx-fp": fp_artifact_sha256},
        )
        browser_parent_digests[f"onnx-{dtype}"] = require_sha256(
            quantized_lineage.get(ARTIFACT_DIGEST_FIELD),
            field=ARTIFACT_DIGEST_FIELD,
            source=quantized_dir / LINEAGE_FILENAME,
        )

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    onnx_dir = output_dir / "onnx"
    onnx_dir.mkdir(parents=True, exist_ok=True)

    for source_path in sorted(fp_dir.iterdir()):
        if (
            source_path.is_file()
            and source_path.suffix != ".onnx"
            and source_path.name != LINEAGE_FILENAME
        ):
            shutil.copy2(source_path, output_dir / source_path.name)

    for dtype, quantized_dir in quantized_dirs.items():
        suffix = f"_{dtype}"
        model_paths = get_browser_model_paths(quantized_dir)
        for model_path in model_paths:
            shutil.copy2(model_path, onnx_dir / f"{model_path.stem}{suffix}.onnx")

    reject_external_data_files(output_dir)
    write_artifact_lineage(
        output_dir,
        source_lineage=lineage.data,
        stage="browser",
        parent_artifact_sha256s=browser_parent_digests,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=str(MERGED_DIR / "teapot-profile-qa"))
    parser.add_argument("--output-dir", default=str(ONNX_DIR / "candidate"))
    parser.add_argument("--skip-export", action="store_true")
    parser.add_argument("--skip-quantize", action="store_true")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    _require_disjoint_output(
        output_dir,
        Path(args.model),
        operation="browser artifact pipeline",
    )
    fp_dir = output_dir / "onnx"
    if args.skip_export:
        lineage = ensure_teapot_export_model(args.model)
        reject_external_data_files(fp_dir)
        validate_artifact_lineage(
            fp_dir,
            source_lineage=lineage.data,
            stage="onnx-fp",
        )
    else:
        lineage = export_onnx(args.model, fp_dir)

    quantized_dirs = {
        "int8": output_dir / "int8",
        "uint8": output_dir / "uint8",
    }
    if not args.skip_quantize:
        for dtype, quantized_dir in quantized_dirs.items():
            quantize_onnx(fp_dir, quantized_dir, dtype, lineage)
    assemble_browser_artifact(
        fp_dir,
        quantized_dirs,
        output_dir / "browser",
        lineage,
    )

    print(f"validated browser-safe ONNX artifacts under {output_dir / 'browser'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
