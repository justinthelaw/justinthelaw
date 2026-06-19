"""Merge a trained LoRA adapter into its base model for export."""

from __future__ import annotations

import argparse
from pathlib import Path

from .config import MERGED_DIR, PRIMARY_BASE_MODEL_ID


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--adapter-model-id", required=True)
    parser.add_argument("--base-model-id", default=PRIMARY_BASE_MODEL_ID)
    parser.add_argument("--output-dir", default=str(MERGED_DIR / "teapot-profile-qa"))
    args = parser.parse_args()

    try:
        import torch
        from peft import PeftModel
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    except ImportError as exc:
        raise RuntimeError("Install merge dependencies with pip install -r ml/profile-qa/requirements.txt") from exc

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.adapter_model_id, trust_remote_code=True)
    base_model = AutoModelForSeq2SeqLM.from_pretrained(
        args.base_model_id,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(base_model, args.adapter_model_id)
    merged_model = model.merge_and_unload()

    merged_model.save_pretrained(output_dir, safe_serialization=True)
    tokenizer.save_pretrained(output_dir)
    print(f"merged adapter {args.adapter_model_id} into {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
