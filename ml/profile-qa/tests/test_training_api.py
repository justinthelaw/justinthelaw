"""Regression checks for dependency APIs used by the training entry point."""

import ast
from pathlib import Path

import pytest


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


def test_t5_lora_trains_and_generates_with_locked_dependencies() -> None:
    """Exercise PEFT's encoder-decoder boundary, broken before PEFT 0.21.2."""

    torch = pytest.importorskip("torch")
    peft = pytest.importorskip("peft")
    transformers = pytest.importorskip("transformers")
    previous_threads = torch.get_num_threads()
    torch.set_num_threads(1)
    try:
        with torch.random.fork_rng(devices=[]):
            torch.manual_seed(17)
            model = transformers.T5ForConditionalGeneration(
                transformers.T5Config(
                    vocab_size=16, d_model=8, d_kv=4, d_ff=16,
                    num_layers=1, num_decoder_layers=1, num_heads=2,
                    dropout_rate=0.0, decoder_start_token_id=0,
                    pad_token_id=0, eos_token_id=1,
                )
            )
            model = peft.get_peft_model(
                model,
                peft.LoraConfig(
                    task_type=peft.TaskType.SEQ_2_SEQ_LM,
                    r=2, lora_alpha=4, target_modules=["q", "v"],
                ),
            )
            input_ids = torch.tensor([[3, 4, 1]])
            loss = model(input_ids=input_ids, labels=torch.tensor([[5, 6, 1]])).loss
            assert torch.isfinite(loss)
            loss.backward()
            gradients = [
                parameter.grad for parameter in model.parameters()
                if parameter.requires_grad and parameter.grad is not None
            ]
            assert gradients
            assert all(torch.isfinite(gradient).all() for gradient in gradients)
            assert any(torch.count_nonzero(gradient) > 0 for gradient in gradients)
            model.eval()
            generated = model.generate(input_ids=input_ids, max_new_tokens=2)
            assert generated.shape[0] == 1
            assert 1 < generated.shape[1] <= 3
    finally:
        torch.set_num_threads(previous_threads)
