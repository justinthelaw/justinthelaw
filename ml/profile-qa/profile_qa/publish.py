"""Publish promoted profile-QA artifacts to Hugging Face."""

from __future__ import annotations

import argparse
from pathlib import Path

from .export_onnx import reject_external_data_files


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-id", required=True)
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--repo-type", choices=["model", "dataset"], default="model")
    parser.add_argument("--private", action="store_true")
    parser.add_argument("--delete-pattern", action="append", default=[])
    args = parser.parse_args()

    artifact_dir = Path(args.artifact_dir)
    reject_external_data_files(artifact_dir)

    try:
        from huggingface_hub import HfApi
    except ImportError as exc:
        raise RuntimeError("Install publish dependencies with pip install -r ml/profile-qa/requirements.txt") from exc

    api = HfApi()
    repo_type = None if args.repo_type == "model" else args.repo_type
    api.create_repo(
        repo_id=args.repo_id,
        private=args.private,
        repo_type=repo_type,
        exist_ok=True,
    )
    api.upload_folder(
        repo_id=args.repo_id,
        folder_path=str(artifact_dir),
        repo_type=repo_type,
        commit_message="Publish promoted browser profile-QA artifacts",
        delete_patterns=args.delete_pattern or None,
    )
    print(f"published {artifact_dir} to {args.repo_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
