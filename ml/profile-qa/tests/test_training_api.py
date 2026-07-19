"""Regression checks for dependency APIs used by the training entry point."""

import ast
from pathlib import Path


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


def test_export_recovery_uses_isolated_lock() -> None:
    """Keep exporter recovery guidance pointed at its isolated environment."""

    source_path = Path(__file__).parents[1] / "profile_qa" / "export_onnx.py"
    source = source_path.read_text(encoding="utf-8")

    assert "requirements-export.lock" in source
    assert "requirements.txt" not in source
