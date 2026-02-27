#!/usr/bin/env python3
"""Legacy manual spot-check for ONNX models.

Prefer `scripts/evaluate_model.py` for deterministic evaluation and threshold gating.
"""

import random
import sys
from pathlib import Path

from datasets import load_from_disk
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer
from utils import (
    CONFIG,
    INFERENCE_MAX_NEW_TOKENS,
    INFERENCE_REPETITION_PENALTY,
    PIPELINE_DIR,
    SYSTEM_PROMPT,
    get_model_size_mb,
)


def test_onnx_model(onnx_path: Path, model_file: str, question: str, expected: str) -> None:
    """Test a specific ONNX quantization."""
    model_path = onnx_path / model_file

    if not model_path.exists():
        print(f"  ⚠️  Model not found: {model_file}")
        return

    model_size_mb = get_model_size_mb(model_path)

    print(f"\n{'='*60}")
    print(f"Testing: {model_file} ({model_size_mb:.1f} MB)")
    print(f"{'='*60}")

    tokenizer = AutoTokenizer.from_pretrained(str(onnx_path))
    
    # Load specific quantized model
    model = ORTModelForCausalLM.from_pretrained(
        str(onnx_path),
        file_name=model_file,
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    # Use greedy decoding for consistent factual recall
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_new_tokens=INFERENCE_MAX_NEW_TOKENS,
        do_sample=False,
        repetition_penalty=INFERENCE_REPETITION_PENALTY,
        pad_token_id=tokenizer.eos_token_id,
    )

    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = full_response[
        len(tokenizer.decode(inputs["input_ids"][0], skip_special_tokens=True)) :
    ].strip()

    print(f"Question: {question}")
    print(f"\nModel Response:\n{response}")
    print(f"\nExpected:\n{expected}")


def main() -> int:
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    sft_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"] / "sft"

    # Check dataset exists
    if not sft_dataset_path.exists():
        print(f"Error: SFT dataset not found at {sft_dataset_path}")
        return 1

    # Check ONNX path exists
    if not onnx_path.exists():
        print(f"Error: ONNX models not found at {onnx_path}")
        return 1

    # Load dataset and pick random question
    print(f"Loading SFT dataset from {sft_dataset_path}")
    dataset = load_from_disk(str(sft_dataset_path))
    sample = random.choice(dataset["train"])  # noqa: S311
    
    # Extract question and expected answer from SFT format
    messages = sample["messages"]
    question = next(m["content"] for m in messages if m["role"] == "user")
    expected = next(m["content"] for m in messages if m["role"] == "assistant")

    # Test all quantization levels
    quantizations = [
        "model.onnx",        # FP32 (base, unquantized)
        "model_int8.onnx",   # INT8 signed (WASM/CPU)
        "model_uint8.onnx",  # UINT8 unsigned
        "model_q4.onnx",     # 4-bit (ultra-compact)
    ]

    print("\nTesting all quantization levels with same prompt:")
    print(f"System: {SYSTEM_PROMPT}\n")

    for model_file in quantizations:
        if not (onnx_path / model_file).exists():
            print(f"⊘ Skipping {model_file} (not found)\n")
            continue
        test_onnx_model(onnx_path, model_file, question, expected)

    print(f"\n{'='*60}")
    print("All quantization tests complete!")
    print(f"{'='*60}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
