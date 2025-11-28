#!/usr/bin/env python3
"""Merge LoRA adapter with base model and export to ONNX."""

import json
import shutil
import sys
import warnings
from pathlib import Path

import torch
import yaml
from optimum.onnxruntime import ORTModelForCausalLM
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())


def clean_directory(path: Path) -> None:
    """Remove and recreate directory."""
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def main() -> int:
    adapter_path = PIPELINE_DIR / CONFIG["model_output"]
    merged_path = PIPELINE_DIR / CONFIG["merged_output"]
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    base_model = CONFIG["model"]["base"]

    if not adapter_path.exists():
        print(f"Error: LoRA adapter not found at {adapter_path}")
        print("Run 'make train' first")
        return 1

    # Load base model
    print(f"Loading base model: {base_model}")
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True,
    )

    print(f"Loading LoRA adapter from {adapter_path}")
    model = PeftModel.from_pretrained(model, str(adapter_path))

    print("Merging weights...")
    model = model.merge_and_unload()

    # Save merged model
    print(f"Saving merged model to {merged_path}")
    clean_directory(merged_path)
    model.save_pretrained(str(merged_path))

    # Load tokenizer from base model
    tokenizer = AutoTokenizer.from_pretrained(base_model)

    # Use a clean ChatML template without default system message fallback
    # The frontend always provides a system message, so no fallback needed
    CHAT_TEMPLATE = (
        "{% for message in messages %}"
        "{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>\n'}}"
        "{% endfor %}"
        "{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}"
    )
    tokenizer.chat_template = CHAT_TEMPLATE
    print("  Using clean ChatML template (no default system message)")
    tokenizer.save_pretrained(str(merged_path))

    # Explicitly save chat_template to tokenizer_config.json
    tokenizer_config_path = merged_path / "tokenizer_config.json"
    if tokenizer_config_path.exists():
        config = json.loads(tokenizer_config_path.read_text())
        config["chat_template"] = CHAT_TEMPLATE
        tokenizer_config_path.write_text(json.dumps(config, indent=2))

    # Export to ONNX for browser inference
    print("\nExporting to ONNX...")
    clean_directory(onnx_path)

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=UserWarning)
        warnings.filterwarnings("ignore", message=".*TracerWarning.*")
        warnings.filterwarnings("ignore", message=".*tied weights.*")
        onnx_model = ORTModelForCausalLM.from_pretrained(
            str(merged_path),
            export=True,
            trust_remote_code=True,
        )

    onnx_model.save_pretrained(str(onnx_path))
    tokenizer.save_pretrained(str(onnx_path))

    # Explicitly save chat_template to ONNX tokenizer_config.json as well
    onnx_tokenizer_config_path = onnx_path / "tokenizer_config.json"
    if onnx_tokenizer_config_path.exists():
        config = json.loads(onnx_tokenizer_config_path.read_text())
        config["chat_template"] = CHAT_TEMPLATE
        onnx_tokenizer_config_path.write_text(json.dumps(config, indent=2))

    # Rename model.onnx to model_quantized.onnx for transformers.js compatibility
    # transformers.js looks for model_quantized.onnx by default
    model_onnx = onnx_path / "model.onnx"
    model_quantized = onnx_path / "model_quantized.onnx"
    if model_onnx.exists():
        model_onnx.rename(model_quantized)
        print(f"  Renamed model.onnx -> model_quantized.onnx")

    print(f"\nMerge and ONNX export complete!")
    print(f"  Merged model: {merged_path}")
    print(f"  ONNX model:   {onnx_path}")
    print("\nNext: make push-model")
    return 0


if __name__ == "__main__":
    sys.exit(main())
