#!/usr/bin/env python3
"""Test model with a random question from the DPO dataset."""

import argparse
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
SYSTEM_PROMPT = f"You are {CONFIG.get('person_full_name', CONFIG['person_name'])}'s AI assistant. Answer questions about {CONFIG['person_name']} using only the provided context. Give informative but concise answers in 1-3 short sentences."


def test_onnx(onnx_path: Path, question: str) -> str:
    """Test with ONNX model."""

    print(f"Loading ONNX model from {onnx_path}")
    tokenizer = AutoTokenizer.from_pretrained(str(onnx_path))
    model = ORTModelForCausalLM.from_pretrained(str(onnx_path))

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    # Use greedy decoding for consistent factual recall
    print("Generating response...")
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
    return response


def test_pytorch(model_path: Path, question: str) -> str:
    """Test with PyTorch model."""
    from transformers import AutoModelForCausalLM, AutoTokenizer

    print(f"Loading PyTorch model from {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(str(model_path))
    model = AutoModelForCausalLM.from_pretrained(
        str(model_path),
        device_map="auto",
        torch_dtype="auto",
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    # Use greedy decoding for consistent factual recall
    print("Generating response...")
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=80,
        do_sample=False,
        repetition_penalty=1.2,
        pad_token_id=tokenizer.eos_token_id,
    )

    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = full_response[
        len(tokenizer.decode(inputs["input_ids"][0], skip_special_tokens=True)) :
    ].strip()
    return response


def main() -> int:
    parser = argparse.ArgumentParser(description="Test model with random question")
    parser.add_argument(
        "--format",
        choices=["onnx", "pytorch"],
        default="pytorch",
        help="Model format to test (default: pytorch)",
    )
    args = parser.parse_args()

    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    merged_path = PIPELINE_DIR / CONFIG["merged_output"]
    dpo_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"] / "dpo"

    # Check dataset exists
    if not dpo_dataset_path.exists():
        print(f"Error: DPO dataset not found at {dpo_dataset_path}")
        print("Run 'make generate' first")
        return 1

    # Check model path based on format
    if args.format == "onnx":
        model_path = onnx_path
        if not model_path.exists():
            print(f"Error: ONNX model not found at {model_path}")
            print("Run 'make merge' first")
            return 1
    else:
        model_path = merged_path
        if not model_path.exists():
            print(f"Error: Merged model not found at {model_path}")
            print("Run 'make merge' first")
            return 1

    # Load dataset and pick random question
    print(f"Loading DPO dataset from {dpo_dataset_path}")
    dataset = load_from_disk(str(dpo_dataset_path))
    sample = random.choice(dataset["train"])
    question = sample["prompt"]
    expected = sample["chosen"]

    print(f"Question: {question}")

    # Generate response
    if args.format == "onnx":
        response = test_onnx(onnx_path, question)
    else:
        response = test_pytorch(merged_path, question)

    print(f"Model Response:\n{response}")
    print(f"\nExpected (from training):\n{expected}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
