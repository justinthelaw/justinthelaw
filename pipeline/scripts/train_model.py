#!/usr/bin/env python3
"""Complete training pipeline: SFT with LoRA → merge → multi-quantized ONNX export."""

import argparse
import json
import shutil
import sys
import warnings
from pathlib import Path

import onnx
import torch
import yaml
from datasets import load_from_disk
from onnxruntime.quantization import QuantType, quantize_dynamic
from onnxruntime.quantization.matmul_nbits_quantizer import MatMulNBitsQuantizer
from onnxruntime.quantization.onnx_model import ONNXModel
from onnxruntime.transformers.float16 import convert_float_to_float16
from optimum.onnxruntime import ORTModelForCausalLM
from peft import LoraConfig, PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl.trainer.sft_config import SFTConfig
from trl.trainer.sft_trainer import SFTTrainer

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())


def clean_directory(path: Path) -> None:
    """Remove and recreate directory."""
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def train_sft_lora() -> int:
    """Stage 1: Train SFT with LoRA adapter."""
    print("=" * 60)
    print("STAGE 1: SFT Training with LoRA")
    print("=" * 60)
    
    sft_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"] / "sft"
    output_dir = PIPELINE_DIR / CONFIG["model_output"]

    if not sft_dataset_path.exists():
        print(f"Error: SFT dataset not found at {sft_dataset_path}")
        print("Run 'make generate-dataset' first")
        return 1

    # Load dataset
    print(f"Loading SFT dataset from {sft_dataset_path}")
    dataset = load_from_disk(str(sft_dataset_path))
    train_data = dataset["train"]
    val_data = dataset["validation"]
    print(f"  Train: {len(train_data)}, Validation: {len(val_data)}")

    model_name = CONFIG["model"]["base"]
    print(f"\nLoading base model: {model_name}")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype="auto",
        device_map="auto",
        trust_remote_code=True,
    )
    print(f"  Parameters: {model.num_parameters():,}")

    # LoRA config
    lora_cfg = CONFIG["lora"]
    peft_config = LoraConfig(
        r=lora_cfg["r"],
        lora_alpha=lora_cfg["alpha"],
        lora_dropout=lora_cfg["dropout"],
        target_modules=lora_cfg["target_modules"],
        bias="none",
        task_type="CAUSAL_LM",
    )

    # Training precision
    sft_cfg = CONFIG["sft"]
    use_bf16 = torch.cuda.is_available()
    use_fp16 = not use_bf16 and torch.backends.mps.is_available()
    use_gradient_checkpointing = torch.cuda.is_available()

    # SFTConfig handles tokenization and label masking
    training_args = SFTConfig(
        output_dir=str(output_dir),
        num_train_epochs=sft_cfg["epochs"],
        per_device_train_batch_size=sft_cfg["batch_size"],
        per_device_eval_batch_size=sft_cfg["batch_size"],
        gradient_accumulation_steps=sft_cfg["gradient_accumulation"],
        learning_rate=sft_cfg["learning_rate"],
        warmup_ratio=sft_cfg["warmup_ratio"],
        weight_decay=sft_cfg.get("weight_decay", 0.01),
        max_length=sft_cfg["max_length"],
        bf16=use_bf16,
        fp16=use_fp16,
        gradient_checkpointing=use_gradient_checkpointing,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        seed=sft_cfg["seed"],
        report_to="none",
    )

    # Train
    print("\nStarting SFT training...")
    print(f"  Epochs: {sft_cfg['epochs']}")
    print(f"  Learning rate: {sft_cfg['learning_rate']}")
    print(f"  Batch size: {sft_cfg['batch_size']} x {sft_cfg['gradient_accumulation']} accumulation")

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=train_data,  # type: ignore[arg-type]
        eval_dataset=val_data,  # type: ignore[arg-type]
        processing_class=tokenizer,
        peft_config=peft_config,
    )

    if trainer.model is not None:
        trainable = sum(p.numel() for p in trainer.model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in trainer.model.parameters())
        print(f"  LoRA: {trainable:,} trainable / {total:,} total ({100*trainable/total:.2f}%)")

    trainer.train()

    # Save
    print(f"\nSaving LoRA adapter to {output_dir}")
    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    
    print("✓ SFT training complete!\n")
    return 0


def merge_and_export() -> int:
    """Stage 2: Merge LoRA adapter and export to multi-quantized ONNX."""
    print("=" * 60)
    print("STAGE 2: Merge LoRA and Export to ONNX")
    print("=" * 60)
    
    adapter_path = PIPELINE_DIR / CONFIG["model_output"]
    merged_path = PIPELINE_DIR / CONFIG["merged_output"]
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    base_model = CONFIG["model"]["base"]

    if not adapter_path.exists():
        print(f"Error: LoRA adapter not found at {adapter_path}")
        return 1

    # Load and merge
    print(f"Loading base model: {base_model}")
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )

    print(f"Loading LoRA adapter from {adapter_path}")
    model = PeftModel.from_pretrained(model, str(adapter_path))

    print("Merging LoRA weights into base model...")
    model = model.merge_and_unload()

    # Save merged model
    print(f"Saving merged model to {merged_path}")
    clean_directory(merged_path)
    model.save_pretrained(str(merged_path))  # type: ignore[call-overload]

    # Tokenizer with ChatML template
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    chat_template = (
        "{% for message in messages %}"
        "{{'<|im_start|>' + message['role'] + '\\n' + message['content'] + '<|im_end|>\\n'}}"
        "{% endfor %}"
        "{% if add_generation_prompt %}{{ '<|im_start|>assistant\\n' }}{% endif %}"
    )
    tokenizer.chat_template = chat_template
    tokenizer.save_pretrained(str(merged_path))

    # Save chat_template explicitly
    tokenizer_config_path = merged_path / "tokenizer_config.json"
    if tokenizer_config_path.exists():
        config = json.loads(tokenizer_config_path.read_text())
        config["chat_template"] = chat_template
        tokenizer_config_path.write_text(json.dumps(config, indent=2))

    print("✓ Merge complete!\n")

    # Export to ONNX
    print("Exporting to ONNX (fp32)...")
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

    # Save chat_template to ONNX tokenizer config
    onnx_tokenizer_config_path = onnx_path / "tokenizer_config.json"
    if onnx_tokenizer_config_path.exists():
        onnx_config = json.loads(onnx_tokenizer_config_path.read_text())
        onnx_config["chat_template"] = chat_template
        onnx_tokenizer_config_path.write_text(json.dumps(onnx_config, indent=2))

    print("✓ ONNX export complete!\n")
    return 0


def quantize_models() -> int:
    """Stage 3: Generate multi-level quantizations."""
    print("=" * 60)
    print("STAGE 3: Multi-level ONNX Quantization")
    print("=" * 60)
    
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    model_fp32 = onnx_path / "model.onnx"

    # Check if we have fp32 base model
    if not model_fp32.exists():
        print(f"Error: Base ONNX model not found at {model_fp32}")
        print("Run without --only-quantize to generate ONNX models first")
        return 1

    print(f"Source model: {model_fp32.name} ({model_fp32.stat().st_size / 1024 / 1024:.1f} MB)\n")

    # 1. INT8 dynamic quantization (signed)
    model_int8 = onnx_path / "model_int8.onnx"
    if not model_int8.exists():
        print("Generating model_int8.onnx (int8 signed)...")
        quantize_dynamic(
            model_input=str(model_fp32),
            model_output=str(model_int8),
            weight_type=QuantType.QInt8,
            extra_options={
                "WeightSymmetric": True,
                "MatMulConstBOnly": True,
            },
        )
        print(f"  ✓ Saved: {model_int8.name} ({model_int8.stat().st_size / 1024 / 1024:.1f} MB)\n")
    else:
        print(f"✓ Using existing {model_int8.name} ({model_int8.stat().st_size / 1024 / 1024:.1f} MB)\n")

    # 2. UINT8 dynamic quantization (unsigned)
    model_uint8 = onnx_path / "model_uint8.onnx"
    if not model_uint8.exists():
        print("Generating model_uint8.onnx (uint8 unsigned)...")
        quantize_dynamic(
            model_input=str(model_fp32),
            model_output=str(model_uint8),
            weight_type=QuantType.QUInt8,
            extra_options={
                "ActivationSymmetric": False,
                "MatMulConstBOnly": True,
            },
        )
        print(f"  ✓ Saved: {model_uint8.name} ({model_uint8.stat().st_size / 1024 / 1024:.1f} MB)\n")
    else:
        print(f"✓ Using existing {model_uint8.name} ({model_uint8.stat().st_size / 1024 / 1024:.1f} MB)\n")

    # 3. 4-bit quantization (4-bit weights)
    model_q4 = onnx_path / "model_q4.onnx"
    if not model_q4.exists():
        print("Generating model_q4.onnx (4-bit weights)...")
        try:
            # Load fp32 for 4-bit quantization
            fp32_proto = onnx.load(str(model_fp32))
            quantizer = MatMulNBitsQuantizer(
                model=fp32_proto,
                block_size=32,  # Smaller block size for better accuracy
                is_symmetric=False,
                accuracy_level=4,
            )
            quantizer.process()
            quantizer.model.save_model_to_file(str(model_q4), use_external_data_format=True)
            print(f"  ✓ Saved: {model_q4.name} ({model_q4.stat().st_size / 1024 / 1024:.1f} MB)\n")
        except Exception as e:
            print(f"  ✗ Failed to generate 4-bit model: {e}")
            print("    Skipping 4-bit quantization\n")
    else:
        print(f"✓ Using existing {model_q4.name} ({model_q4.stat().st_size / 1024 / 1024:.1f} MB)\n")

    print("✓ Quantization complete!\n")
    print("Available models:")
    for model_file in sorted(onnx_path.glob("model*.onnx")):
        size_mb = model_file.stat().st_size / 1024 / 1024
        print(f"  • {model_file.name:25s} {size_mb:>8.1f} MB")
    print()
    
    return 0


def main() -> int:
    """Run complete training pipeline."""
    parser = argparse.ArgumentParser(description="SmolLM2 Fine-tuning Pipeline")
    parser.add_argument(
        "--skip-train",
        action="store_true",
        help="Skip SFT training (use existing LoRA adapter)",
    )
    parser.add_argument(
        "--skip-merge",
        action="store_true",
        help="Skip merging and ONNX export (use existing ONNX model)",
    )
    parser.add_argument(
        "--only-quantize",
        action="store_true",
        help="Only run quantization (skip training and merging)",
    )
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("SmolLM2-360M Fine-tuning Pipeline")
    print("=" * 60 + "\n")

    # Stage 1: SFT Training with LoRA
    if not (args.skip_train or args.only_quantize):
        ret = train_sft_lora()
        if ret != 0:
            return ret

    # Stage 2: Merge and export to ONNX
    if not (args.skip_merge or args.only_quantize):
        ret = merge_and_export()
        if ret != 0:
            return ret

    # Stage 3: Quantize ONNX models
    ret = quantize_models()
    if ret != 0:
        return ret

    # Summary
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    print("=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"\nONNX models saved to: {onnx_path}")
    print("  • model.onnx       - FP32 (unquantized base)")
    print("  • model_int8.onnx  - INT8 signed (WASM/CPU)")
    print("  • model_uint8.onnx - UINT8 unsigned")
    print("  • model_q4.onnx    - 4-bit (ultra-compact)")
    print("\nNext steps:")
    print("  1. Test models:  make test-model")
    print("  2. Push to Hub:  make push-model")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
