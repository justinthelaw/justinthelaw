#!/usr/bin/env python3
"""Upload dataset or model to HuggingFace Hub."""

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

from generate_dataset import get_question_categories
from huggingface_hub import HfApi, create_repo
from utils import CONFIG, PIPELINE_DIR

TEMPLATES_DIR = PIPELINE_DIR / "templates"
DEFAULT_COMMIT_MESSAGE = "WIP, commit model weights and metadata"


def _extract_username(hub_id: str) -> str:
    """Extract username from hub_id."""
    return hub_id.split("/")[0]


def _apply_template_replacements(template: str, replacements: dict[str, str]) -> str:
    """Apply all replacements to a template string."""
    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)
    return template


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
        "{sft_epochs}": str(CONFIG["sft"]["epochs"]),
        "{sft_batch_size}": str(CONFIG["sft"]["batch_size"]),
        "{sft_learning_rate}": str(CONFIG["sft"]["learning_rate"]),
        "{training_epochs}": str(CONFIG.get("training", {}).get("epochs", "N/A")),
        "{training_batch_size}": str(CONFIG.get("training", {}).get("batch_size", "N/A")),
        "{training_learning_rate}": str(CONFIG.get("training", {}).get("learning_rate", "N/A")),
        "{dpo_beta}": str(CONFIG.get("dpo", {}).get("beta", "N/A")),
        "{dpo_loss_type}": CONFIG.get("dpo", {}).get("loss_type", "N/A"),
        "{github_username}": hf_username,
        "{hf_username}": hf_username,
    }

    return _apply_template_replacements(template, replacements)


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

    return _apply_template_replacements(template, replacements)


def _push_to_hub(
    source_paths: list[tuple[Path, str]],
    repo_id: str,
    readme_content: str,
    commit_message: str,
    repo_type: str = "model",
) -> int:
    """Generic function to push content to HuggingFace Hub.
    
    Args:
        source_paths: List of (source_path, target_subdir) tuples to stage
        repo_id: HuggingFace repository ID
        readme_content: Generated README content
        commit_message: Commit message
        repo_type: "model" or "dataset"
    """
    print(f"Preparing upload to {repo_id}...")

    api = HfApi()
    try:
        if repo_type == "dataset":
            create_repo(repo_id, repo_type="dataset", exist_ok=True)
        else:
            create_repo(repo_id, exist_ok=True)
    except Exception as e:
        print(f"Note: {e}")

    # Stage all files for single-commit upload
    with tempfile.TemporaryDirectory() as staging_dir:
        staging_path = Path(staging_dir)

        # Copy source files to staging
        for source_path, target_subdir in source_paths:
            if not source_path.exists():
                print(f"Error: Source path not found at {source_path}")
                return 1

            print(f"Staging from {source_path}...")
            if target_subdir:
                target = staging_path / target_subdir
                target.mkdir(parents=True, exist_ok=True)
            else:
                target = staging_path

            for item in source_path.iterdir():
                if item.is_file():
                    shutil.copy2(item, target / item.name)
                elif item.is_dir():
                    shutil.copytree(item, target / item.name)

        # Write README
        print("Writing README...")
        (staging_path / "README.md").write_text(readme_content)

        # Upload
        print(f"Uploading to {repo_id}...")
        if repo_type == "dataset":
            api.upload_folder(
                folder_path=str(staging_path),
                repo_id=repo_id,
                repo_type="dataset",
                commit_message=commit_message,
            )
        else:
            api.upload_folder(
                folder_path=str(staging_path),
                repo_id=repo_id,
                commit_message=commit_message,
            )

    url_prefix = "https://huggingface.co/datasets/" if repo_type == "dataset" else "https://huggingface.co/"
    print(f"\nUploaded to {url_prefix}{repo_id}")
    return 0


def push_model(commit_message: str) -> int:
    """Upload model to HuggingFace Hub."""
    merged_path = PIPELINE_DIR / CONFIG["merged_output"]
    onnx_path = PIPELINE_DIR / CONFIG.get("onnx_output", "models/onnx")
    repo_id = CONFIG["model"]["hub_id"]

    model_card = _generate_model_card()

    # Source paths: (path, target_subdirectory)
    source_paths = [
        (merged_path, ""),  # Merged model at root
        (onnx_path, "onnx"),  # ONNX models in /onnx subdirectory
    ]

    return _push_to_hub(source_paths, repo_id, model_card, commit_message, repo_type="model")


def push_dataset(commit_message: str) -> int:
    """Upload dataset to HuggingFace Hub."""
    dataset_path = PIPELINE_DIR / CONFIG["dataset_output"]
    repo_id = CONFIG["dataset"]["hub_id"]

    dataset_card = _generate_dataset_card()

    source_paths = [
        (dataset_path, ""),  # Dataset at root
    ]

    return _push_to_hub(source_paths, repo_id, dataset_card, commit_message, repo_type="dataset")


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
