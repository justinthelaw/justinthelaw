#!/usr/bin/env python3
"""Train LoRA adapter using SFT for factual memorization. Run before DPO."""

import sys
from pathlib import Path

import torch
import yaml
from datasets import load_from_disk
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())


def main() -> int:
    sft_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"] / "sft"
    output_dir = PIPELINE_DIR / CONFIG["model_output"]

    if not sft_dataset_path.exists():
        print(f"Error: SFT dataset not found at {sft_dataset_path}")
        print("Run 'make generate' first")
        return 1

    # Load dataset
    print(f"Loading SFT dataset from {sft_dataset_path}")
    dataset = load_from_disk(str(sft_dataset_path))
    print(f"  Train: {len(dataset['train'])}, Validation: {len(dataset['validation'])}")

    model_name = CONFIG["model"]["base"]
    print(f"\nLoading model: {model_name}")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"  # Prevents attention mask issues

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

    # SFTConfig handles tokenization and proper label masking automatically
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

    # SFTTrainer automatically:
    # - Applies chat template from tokenizer
    # - Masks prompt tokens (only trains on assistant responses)
    # - Handles LoRA setup
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        processing_class=tokenizer,
        peft_config=peft_config,
    )

    trainable = sum(p.numel() for p in trainer.model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in trainer.model.parameters())
    print(f"  LoRA: {trainable:,} trainable / {total:,} total ({100*trainable/total:.2f}%)")

    trainer.train()

    # Save
    print(f"\nSaving to {output_dir}")
    trainer.save_model(str(output_dir))
    if not tokenizer.chat_template:
        print("⚠️  Warning: Tokenizer has no chat_template.")
    tokenizer.save_pretrained(str(output_dir))

    print("\nSFT Training complete!")
    print("Next: DPO LoRA training and merging")
    return 0


if __name__ == "__main__":
    sys.exit(main())
