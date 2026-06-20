"""Export and validate browser-compatible ONNX artifacts."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from .config import MERGED_DIR, ONNX_DIR
from .merge_adapter import LINEAGE_FILENAME
from .train_lora import ensure_primary_base_model_id

TEAPOT_EXPORT_TASK = "text2text-generation-with-past"


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


def ensure_teapot_export_model(model: str) -> None:
    """Require a merged model directory produced by the Teapot adapter merge step."""

    lineage_path = Path(model) / LINEAGE_FILENAME
    if not lineage_path.exists():
        raise RuntimeError(
            "ONNX export is TeapotLLM-only; pass a merged model directory produced by "
            f"profile_qa.merge_adapter with {LINEAGE_FILENAME}"
        )
    lineage = json.loads(lineage_path.read_text(encoding="utf-8"))
    base_model = lineage.get("base_model")
    if not isinstance(base_model, str):
        raise RuntimeError(f"{lineage_path} does not record a base_model")
    ensure_primary_base_model_id(base_model, source=f"{lineage_path} base_model")


def export_onnx(model: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    ensure_teapot_export_model(model)
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


def quantize_onnx(input_dir: Path, output_dir: Path, dtype: str) -> None:
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        from onnxruntime.quantization import QuantType, quantize_dynamic
    except ImportError as exc:
        raise RuntimeError("Install export dependencies with pip install -r ml/profile-qa/requirements.txt") from exc

    weight_type = QuantType.QInt8 if dtype == "int8" else QuantType.QUInt8
    for source_path in sorted(input_dir.iterdir()):
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


def assemble_browser_artifact(fp_dir: Path, quantized_dirs: dict[str, Path], output_dir: Path) -> None:
    """Create a Transformers.js-compatible upload directory."""

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    onnx_dir = output_dir / "onnx"
    onnx_dir.mkdir(parents=True, exist_ok=True)

    for source_path in sorted(fp_dir.iterdir()):
        if source_path.is_file() and source_path.suffix != ".onnx":
            shutil.copy2(source_path, output_dir / source_path.name)

    for dtype, quantized_dir in quantized_dirs.items():
        suffix = f"_{dtype}"
        model_paths = get_browser_model_paths(quantized_dir)
        for model_path in model_paths:
            shutil.copy2(model_path, onnx_dir / f"{model_path.stem}{suffix}.onnx")

    reject_external_data_files(output_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=str(MERGED_DIR / "teapot-profile-qa"))
    parser.add_argument("--output-dir", default=str(ONNX_DIR / "candidate"))
    parser.add_argument("--skip-export", action="store_true")
    parser.add_argument("--skip-quantize", action="store_true")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    fp_dir = output_dir / "onnx"
    if args.skip_export:
        reject_external_data_files(fp_dir)
    else:
        export_onnx(args.model, fp_dir)

    quantized_dirs = {
        "int8": output_dir / "int8",
        "uint8": output_dir / "uint8",
    }
    if not args.skip_quantize:
        for dtype, quantized_dir in quantized_dirs.items():
            quantize_onnx(fp_dir, quantized_dir, dtype)
    assemble_browser_artifact(fp_dir, quantized_dirs, output_dir / "browser")

    print(f"validated browser-safe ONNX artifacts under {output_dir / 'browser'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
