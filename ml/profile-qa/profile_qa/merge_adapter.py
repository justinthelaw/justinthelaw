"""Merge a trained LoRA adapter into its base model for export."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from .config import (
    MERGED_DIR,
    PRIMARY_BASE_MODEL_ID,
    PRIMARY_BASE_MODEL_REVISION,
)
from .provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    directory_sha256,
    require_checkpoint_label,
)
from .train_lora import (
    ensure_adapter_base_lineage,
    require_local_model_path,
    trusted_model_load_kwargs,
)


def prepare_merge_output_directory(adapter_path: Path, output_dir: Path) -> None:
    """Replace a merge output tree only when it is disjoint from the adapter."""

    resolved_adapter_path = adapter_path.resolve()
    resolved_output_dir = output_dir.resolve()
    if (
        resolved_adapter_path == resolved_output_dir
        or resolved_adapter_path in resolved_output_dir.parents
        or resolved_output_dir in resolved_adapter_path.parents
    ):
        raise RuntimeError(
            "merge output directory must not overlap the adapter checkpoint: "
            f"{resolved_output_dir} and {resolved_adapter_path}"
        )
    if output_dir.is_symlink():
        raise RuntimeError(f"merge output directory must not be a symlink: {output_dir}")
    if output_dir.exists():
        if not output_dir.is_dir():
            raise RuntimeError(f"merge output path is not a directory: {output_dir}")
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--adapter-model-id", required=True)
    parser.add_argument("--output-dir", default=str(MERGED_DIR / "teapot-profile-qa"))
    args = parser.parse_args()

    try:
        import torch
        from peft import PeftConfig, PeftModel
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    except ImportError as exc:
        raise RuntimeError("Install merge dependencies with pip install -r ml/profile-qa/requirements.txt") from exc

    adapter_path = require_local_model_path(
        args.adapter_model_id,
        source="adapter model",
    ).resolve()
    adapter_checkpoint = require_checkpoint_label(
        adapter_path.name,
        source=adapter_path,
    )
    adapter_config = PeftConfig.from_pretrained(args.adapter_model_id)
    ensure_adapter_base_lineage(
        adapter_config,
        source=f"{args.adapter_model_id} adapter",
    )

    tokenizer = AutoTokenizer.from_pretrained(
        args.adapter_model_id,
        local_files_only=True,
        trust_remote_code=False,
    )
    base_model = AutoModelForSeq2SeqLM.from_pretrained(
        PRIMARY_BASE_MODEL_ID,
        torch_dtype=torch.float16,
        device_map="auto",
        **trusted_model_load_kwargs(PRIMARY_BASE_MODEL_ID),
    )
    model = PeftModel.from_pretrained(base_model, args.adapter_model_id)
    merged_model = model.merge_and_unload()

    output_dir = Path(args.output_dir)
    prepare_merge_output_directory(adapter_path, output_dir)
    merged_model.save_pretrained(output_dir, safe_serialization=True)
    tokenizer.save_pretrained(output_dir)
    (output_dir / LINEAGE_FILENAME).write_text(
        json.dumps(
            {
                "schema_version": LINEAGE_SCHEMA_VERSION,
                # This canonical path is private build metadata. Exported artifact
                # markers retain only the portable checkpoint label and digest.
                "adapter_model_id": str(adapter_path),
                ADAPTER_CHECKPOINT_FIELD: adapter_checkpoint,
                ADAPTER_DIGEST_FIELD: directory_sha256(adapter_path),
                "base_model": PRIMARY_BASE_MODEL_ID,
                BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
                "pipeline": EXPECTED_LINEAGE_PIPELINE,
                MERGED_DIGEST_FIELD: directory_sha256(
                    output_dir,
                    excluded_relative_paths=frozenset({LINEAGE_FILENAME}),
                ),
            },
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    print(f"merged adapter {args.adapter_model_id} into {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
