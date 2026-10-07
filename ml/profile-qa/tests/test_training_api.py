"""Regression checks for dependency APIs used by the training entry point."""

import ast
from argparse import Namespace
from pathlib import Path

import pytest

from profile_qa.train_lora import build_training_arguments


@pytest.mark.parametrize("ratio, expected_steps", [(0.0, 0), (0.05, 10), (1.0, 200)])
def test_training_preserves_fractional_warmup(tmp_path, ratio, expected_steps) -> None:
    """Construct the real training API without downloading weights or using a GPU."""

    transformers = pytest.importorskip("transformers")
    torch = pytest.importorskip("torch")
    args = Namespace(
        output_dir=str(tmp_path),
        train_batch_size=1,
        eval_batch_size=1,
        gradient_accumulation_steps=1,
        learning_rate=0.0001,
        max_steps=200,
        lr_scheduler_type="linear",
        warmup_ratio=ratio,
        weight_decay=0.0,
        optim="adamw_torch",
        eval_steps=10,
        save_steps=10,
    )

    training_args = build_training_arguments(
        args,
        {
            "torch": torch,
            "Seq2SeqTrainingArguments": transformers.Seq2SeqTrainingArguments,
        },
        torch.float32,
    )

    assert training_args.get_warmup_steps(args.max_steps) == expected_steps


@pytest.mark.parametrize(
    "ratio, max_steps, message",
    [
        (-0.1, 200, "between 0 and 1"),
        (1.1, 200, "between 0 and 1"),
        (1.0, -1, "positive max-steps"),
    ],
)
def test_training_rejects_ambiguous_warmup(ratio, max_steps, message) -> None:
    """Do not silently reinterpret an invalid ratio as an absolute step count."""

    with pytest.raises(ValueError, match=message):
        build_training_arguments(
            Namespace(warmup_ratio=ratio, max_steps=max_steps), {}, None
        )


def test_trainer_uses_transformers_5_processing_class() -> None:
    """Keep trainer construction compatible with the locked Transformers 5 API."""

    source_path = Path(__file__).parents[1] / "profile_qa" / "train_lora.py"
    tree = ast.parse(source_path.read_text(encoding="utf-8"))
    trainer_calls = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Subscript)
        and isinstance(node.func.slice, ast.Constant)
        and node.func.slice.value == "Seq2SeqTrainer"
    ]

    assert len(trainer_calls) == 1
    keyword_names = {keyword.arg for keyword in trainer_calls[0].keywords}
    assert "processing_class" in keyword_names
    assert "tokenizer" not in keyword_names


def test_new_peft_checkpoints_persist_the_pinned_base_revision() -> None:
    """Keep PEFT's saved adapter config bound to the training base revision."""

    source_path = Path(__file__).parents[1] / "profile_qa" / "train_lora.py"
    tree = ast.parse(source_path.read_text(encoding="utf-8"))
    get_peft_calls = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Subscript)
        and isinstance(node.func.slice, ast.Constant)
        and node.func.slice.value == "get_peft_model"
    ]

    assert len(get_peft_calls) == 1
    revision_keywords = [
        keyword for keyword in get_peft_calls[0].keywords if keyword.arg == "revision"
    ]
    assert len(revision_keywords) == 1
    revision_value = revision_keywords[0].value
    assert isinstance(revision_value, ast.Name)
    assert revision_value.id == "PRIMARY_BASE_MODEL_REVISION"


def test_merge_validates_the_saved_adapter_base_lineage() -> None:
    """Prevent merge lineage from claiming an unverified training revision."""

    source_path = Path(__file__).parents[1] / "profile_qa" / "merge_adapter.py"
    tree = ast.parse(source_path.read_text(encoding="utf-8"))
    validation_calls = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "ensure_adapter_base_lineage"
    ]

    assert len(validation_calls) == 1


def test_export_recovery_uses_isolated_lock() -> None:
    """Keep exporter recovery guidance pointed at its isolated environment."""

    source_path = Path(__file__).parents[1] / "profile_qa" / "export_onnx.py"
    source = source_path.read_text(encoding="utf-8")

    assert "requirements-export.lock" in source
    assert "requirements.txt" not in source
