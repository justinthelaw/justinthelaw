#!/usr/bin/env python3
"""Upload dataset or model to HuggingFace Hub."""

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

import yaml
from huggingface_hub import HfApi, create_repo

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())
TEMPLATES_DIR = PIPELINE_DIR / "templates"
# Import categories from generate_dataset.py
sys.path.insert(0, str(PIPELINE_DIR / "scripts"))

from generate_dataset import get_question_categories  # noqa: E402

DEFAULT_COMMIT_MESSAGE = "WIP, commit model weights and metadata"


def _extract_username(hub_id: str) -> str:
    """Extract username from hub_id."""
    return hub_id.split("/")[0]


def _generate_model_card() -> str:
    """Generate model README.md from template."""
    template = (TEMPLATES_DIR / "MODEL_CARD.md").read_text()

    # Get LoRA target modules as comma-separated string
    target_modules = ", ".join(CONFIG["lora"]["target_modules"])
    hf_username = _extract_username(CONFIG["model"]["hub_id"])

    replacements = {
        "{model_hub_id}": CONFIG["model"]["hub_id"],
        "{base_model}": CONFIG["model"]["base"],
        "{dataset_hub_id}": CONFIG["dataset"]["hub_id"],
        "{person_name}": CONFIG["person_name"],
        "{lora_r}": str(CONFIG["lora"]["r"]),
        "{lora_alpha}": str(CONFIG["lora"]["alpha"]),
        "{lora_dropout}": str(CONFIG["lora"]["dropout"]),
        "{lora_target_modules}": target_modules,
        # SFT config
        "{sft_epochs}": str(CONFIG["sft"]["epochs"]),
        "{sft_batch_size}": str(CONFIG["sft"]["batch_size"]),
        "{sft_learning_rate}": str(CONFIG["sft"]["learning_rate"]),
        # DPO config
        "{training_epochs}": str(CONFIG["training"]["epochs"]),
        "{training_batch_size}": str(CONFIG["training"]["batch_size"]),
        "{training_learning_rate}": str(CONFIG["training"]["learning_rate"]),
        "{dpo_beta}": str(CONFIG["dpo"]["beta"]),
        "{dpo_loss_type}": CONFIG["dpo"]["loss_type"],
        "{github_username}": hf_username,
        "{hf_username}": hf_username,
    }

    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)

    return template


def _generate_dataset_card() -> str:
    """Generate dataset README.md from template."""
    template = (TEMPLATES_DIR / "DATASET_CARD.md").read_text()

    hf_username = _extract_username(CONFIG["dataset"]["hub_id"])
    samples_per_cat = CONFIG["dataset"]["samples_per_category"]
    train_split = CONFIG["dataset"]["train_split"]

    # Get categories directly from generate_dataset.py
    question_categories = get_question_categories()
    categories = [cat.title() for cat in question_categories.keys()]

    total_samples = len(categories) * samples_per_cat
    categories_list = "\n".join(f"- {cat}" for cat in categories)

    replacements = {
        "{dataset_hub_id}": CONFIG["dataset"]["hub_id"],
        "{person_name}": CONFIG["person_name"],
        "{total_samples}": str(total_samples),
        "{train_split_percent}": str(int(train_split * 100)),
        "{val_split_percent}": str(int((1 - train_split) * 100)),
        "{samples_per_category}": str(samples_per_cat),
        "{variations_per_question}": str(CONFIG["dataset"].get("variations_per_question", 1)),
        "{categories_list}": categories_list,
        "{temp_question}": str(CONFIG["dataset"]["temperatures"]["question"]),
        "{temp_answer}": str(CONFIG["dataset"]["temperatures"]["answer"]),
        "{temp_variation}": str(CONFIG["dataset"]["temperatures"].get("variation", 0.85)),
        "{seed}": str(CONFIG["dataset"]["seed"]),
        "{github_username}": hf_username,
        "{hf_username}": hf_username,
    }

    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)

    return template


def push_model(commit_message: str) -> int:
    """Upload model to HuggingFace Hub."""
    merged_path = PIPELINE_DIR / CONFIG["merged_output"]
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    repo_id = CONFIG["model"]["hub_id"]

    if not merged_path.exists():
        print(f"Error: Merged model not found at {merged_path}")
        print("Run 'make merge' first")
        return 1

    if not onnx_path.exists():
        print(f"Error: ONNX model not found at {onnx_path}")
        print("Run 'make merge' first")
        return 1

    print(f"Preparing upload to {repo_id}...")

    api = HfApi()
    try:
        create_repo(repo_id, exist_ok=True)
    except Exception as e:
        print(f"Note: {e}")

    # Stage all files for single-commit upload
    with tempfile.TemporaryDirectory() as staging_dir:
        staging_path = Path(staging_dir)

        print(f"Staging merged model from {merged_path}...")
        for f in merged_path.iterdir():
            if f.is_file():
                shutil.copy2(f, staging_path / f.name)

        onnx_staging = staging_path / "onnx"
        onnx_staging.mkdir()
        print(f"Staging ONNX model from {onnx_path}...")
        for f in onnx_path.iterdir():
            if f.is_file():
                shutil.copy2(f, onnx_staging / f.name)

        # Generate and write model card
        print("Generating model card...")
        model_card = _generate_model_card()
        (staging_path / "README.md").write_text(model_card)

        print(f"Uploading to {repo_id}...")
        api.upload_folder(
            folder_path=str(staging_path),
            repo_id=repo_id,
            commit_message=commit_message,
        )

    print(f"\nUploaded to https://huggingface.co/{repo_id}")
    print("Model includes SafeTensors, ONNX, and model card.")
    return 0


def push_dataset(commit_message: str) -> int:
    """Upload dataset to HuggingFace Hub."""
    dataset_path = PIPELINE_DIR / CONFIG["dataset_output"]
    repo_id = CONFIG["dataset"]["hub_id"]

    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        print("Run 'make generate' first")
        return 1

    print(f"Preparing upload to {repo_id}...")

    api = HfApi()
    try:
        create_repo(repo_id, repo_type="dataset", exist_ok=True)
    except Exception as e:
        print(f"Note: {e}")

    with tempfile.TemporaryDirectory() as staging_dir:
        staging_path = Path(staging_dir)

        print(f"Staging dataset from {dataset_path}...")
        for item in dataset_path.iterdir():
            if item.is_file():
                shutil.copy2(item, staging_path / item.name)
            elif item.is_dir():
                shutil.copytree(item, staging_path / item.name)

        # Generate and write dataset card
        print("Generating dataset card...")
        dataset_card = _generate_dataset_card()
        (staging_path / "README.md").write_text(dataset_card)

        print(f"Uploading to {repo_id}...")
        api.upload_folder(
            folder_path=str(staging_path),
            repo_id=repo_id,
            repo_type="dataset",
            commit_message=commit_message,
        )

    print(f"\nUploaded to https://huggingface.co/datasets/{repo_id}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload to HuggingFace Hub")
    parser.add_argument(
        "target",
        choices=["model", "dataset"],
        help="What to upload: 'model' or 'dataset'",
    )
    parser.add_argument(
        "-m", "--message",
        default=DEFAULT_COMMIT_MESSAGE,
        help=f"Commit message (default: '{DEFAULT_COMMIT_MESSAGE}')",
    )
    args = parser.parse_args()

    if args.target == "model":
        return push_model(args.message)
    else:
        return push_dataset(args.message)


if __name__ == "__main__":
    sys.exit(main())
