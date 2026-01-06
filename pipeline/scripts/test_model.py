#!/usr/bin/env python3
"""Test quantized ONNX models with a random question from the SFT dataset."""

import random
import sys
from pathlib import Path

import yaml
from datasets import load_from_disk
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())

# Match frontend's `src/config/prompts.ts` (`CHATBOT_CONFIG.systemPrompt`), does not include additional profile context
SYSTEM_PROMPT = f"You are {CONFIG['person_full_name']}'s AI assistant. Answer questions about {CONFIG['person_name']} using only the provided context. Give informative but concise answers in 1-3 short sentences."


def test_onnx_model(onnx_path: Path, model_file: str, question: str, expected: str) -> None:
    """Test a specific ONNX quantization."""
    model_path = onnx_path / model_file

    if not model_path.exists():
        print(f"  ⚠️  Model not found: {model_file}")
        return

    model_size_mb = model_path.stat().st_size / 1024 / 1024

    print(f"\n{'='*60}")
    print(f"Testing: {model_file} ({model_size_mb:.1f} MB)")
    print(f"{'='*60}")

    tokenizer = AutoTokenizer.from_pretrained(str(onnx_path))
    
    # Load specific quantized model by passing file_name
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
        max_new_tokens=128,
        do_sample=False,
        repetition_penalty=1.2,
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
        print("Run 'make generate-dataset' first")
        return 1

    # Check ONNX path exists
    if not onnx_path.exists():
        print(f"Error: ONNX models not found at {onnx_path}")
        print("Run 'make train-model' first")
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
        "model_q4f16.onnx",       # 4-bit weights + fp16 (smallest, for mobile)
        "model_quantized.onnx",   # INT8 (balanced, for WASM)
        "model_fp16.onnx",        # FP16 (highest quality)
    ]

    print("\nTesting all quantization levels with same prompt:")
    print(f"System: {SYSTEM_PROMPT}\n")

    for model_file in quantizations:
        test_onnx_model(onnx_path, model_file, question, expected)

    print(f"\n{'='*60}")
    print("All quantization tests complete!")
    print(f"{'='*60}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
