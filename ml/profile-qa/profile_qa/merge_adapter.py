"""Merge a trained LoRA adapter into its base model for export."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import MERGED_DIR, PRIMARY_BASE_MODEL_ID
from .provenance import (
    ADAPTER_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    directory_sha256,
)
from .train_lora import (
    ensure_primary_base_model_id,
    require_local_model_path,
    trusted_model_load_kwargs,
)


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

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    adapter_path = require_local_model_path(
        args.adapter_model_id,
        source="adapter model",
    ).resolve()
    adapter_config = PeftConfig.from_pretrained(args.adapter_model_id)
    adapter_base_model_id = str(getattr(adapter_config, "base_model_name_or_path", ""))
    ensure_primary_base_model_id(
        adapter_base_model_id,
        source=f"{args.adapter_model_id} adapter base",
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

    merged_model.save_pretrained(output_dir, safe_serialization=True)
    tokenizer.save_pretrained(output_dir)
    (output_dir / LINEAGE_FILENAME).write_text(
        json.dumps(
            {
                "schema_version": LINEAGE_SCHEMA_VERSION,
                "adapter_model_id": Path(args.adapter_model_id).as_posix(),
                ADAPTER_DIGEST_FIELD: directory_sha256(adapter_path),
                "base_model": PRIMARY_BASE_MODEL_ID,
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
