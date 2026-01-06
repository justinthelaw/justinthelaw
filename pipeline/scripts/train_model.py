#!/usr/bin/env python3
"""Complete training pipeline: SFT with LoRA → merge → multi-quantized ONNX export."""

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
from onnxruntime.quantization.onnx_model import ONNXModel
from onnxruntime.transformers.float16 import convert_float_to_float16
from optimum.onnxruntime import ORTModelForCausalLM
from peft import LoraConfig, PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl.trainer.sft_config import SFTConfig
from trl.trainer.sft_trainer import SFTTrainer

try:
    from onnxruntime.quantization.matmul_4bits_quantizer import (  # type: ignore[import-not-found]
        MatMul4BitsQuantizer,
    )

    matmul_4bits_available = True
except ImportError:
    # Fallback for older onnxruntime versions
    MatMul4BitsQuantizer = None
    matmul_4bits_available = False

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

    if not model_fp32.exists():
        print(f"Error: Base ONNX model not found at {model_fp32}")
        return 1

    # 1. FP16 quantization
    print("Generating model_fp16.onnx (fp16)...")
    model_fp16 = onnx_path / "model_fp16.onnx"
    model_proto = onnx.load(str(model_fp32))
    onnx_model_fp16_wrapper = ONNXModel(model_proto)
    onnx_model_fp16_converted = convert_float_to_float16(
        onnx_model_fp16_wrapper,
        keep_io_types=True,
    )
    # Save the converted model
    if hasattr(onnx_model_fp16_converted, "model"):
        onnx.save(onnx_model_fp16_converted.model, str(model_fp16))
    print(f"  ✓ Saved: {model_fp16.name} ({model_fp16.stat().st_size / 1024 / 1024:.1f} MB)")

    # 2. INT8 dynamic quantization
    print("\nGenerating model_quantized.onnx (int8)...")
    model_int8 = onnx_path / "model_quantized.onnx"
    quantize_dynamic(
        model_input=str(model_fp32),
        model_output=str(model_int8),
        weight_type=QuantType.QInt8,
        extra_options={
            "WeightSymmetric": True,
            "MatMulConstBOnly": True,
        },
    )
    print(f"  ✓ Saved: {model_int8.name} ({model_int8.stat().st_size / 1024 / 1024:.1f} MB)")

    # 3. 4-bit quantization
    if matmul_4bits_available and MatMul4BitsQuantizer is not None:
        print("\nGenerating model_q4f16.onnx (4-bit weights + fp16)...")
        model_q4f16 = onnx_path / "model_q4f16.onnx"
        quant = MatMul4BitsQuantizer(
            model=onnx.load(str(model_fp16)),
            block_size=128,
            is_symmetric=True,
            accuracy_level=4,
        )
        quant.process()
        quant.model.save_model_to_file(str(model_q4f16), use_external_data_format=False)
        print(f"  ✓ Saved: {model_q4f16.name} ({model_q4f16.stat().st_size / 1024 / 1024:.1f} MB)")
    else:
        print("\n⚠️  Skipping 4-bit quantization (requires onnxruntime>=1.18.0)")

    # Remove unquantized fp32 to save space
    if model_fp32.exists():
        model_fp32.unlink()
        print(f"\n  Removed {model_fp32.name} (saved space)")

    print("\n✓ Quantization complete!\n")
    return 0


def main() -> int:
    """Run complete training pipeline."""
    print("\n" + "=" * 60)
    print("SmolLM2-360M Fine-tuning Pipeline")
    print("=" * 60 + "\n")

    # Stage 1: SFT Training with LoRA
    ret = train_sft_lora()
    if ret != 0:
        return ret

    # Stage 2: Merge and export to ONNX
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
    print("  • model_q4f16.onnx      - 4-bit (mobile/WebGPU)")
    print("  • model_quantized.onnx  - INT8 (WASM/CPU)")
    print("  • model_fp16.onnx       - FP16 (quality)")
    print("\nNext steps:")
    print("  1. Test models:  make test-model")
    print("  2. Push to Hub:  make push-model")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
