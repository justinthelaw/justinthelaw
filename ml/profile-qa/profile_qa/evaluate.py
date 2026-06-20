"""Evaluate profile-QA model outputs against the public synthetic set."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_DATASET_PATH,
    DEFAULT_EVAL_REPORT_PATH,
    MODEL_CONTEXT_LIMIT,
    PRIMARY_BASE_MODEL_ID,
)
from .train_lora import (
    ensure_primary_base_model_id,
    ensure_teapot_seq2seq_config,
    format_instruction,
)
from .validation import read_jsonl


def score_answer(record: dict[str, Any], prediction: str) -> dict[str, float]:
    """Score a prediction with deterministic public-profile metrics."""

    normalized = prediction.lower()
    expected_terms = [str(term).lower() for term in record.get("expected_terms", [])]
    term_hits = sum(1 for term in expected_terms if term in normalized)
    term_score = 1.0 if not expected_terms else term_hits / len(expected_terms)
    requires_refusal = bool(record.get("requires_refusal"))
    refusal_hit = "does not say" in normalized or "not in the public profile" in normalized
    refusal_score = 1.0 if refusal_hit == requires_refusal else 0.0
    if requires_refusal:
        return {"macro": refusal_score, "term": 1.0, "refusal": refusal_score}
    macro = (term_score + refusal_score) / 2
    return {"macro": macro, "term": term_score, "refusal": refusal_score}


def score_predictions(records: list[dict[str, Any]], predictions: dict[str, str]) -> dict[str, Any]:
    """Aggregate macro, per-task, refusal, and multi-turn metrics."""

    per_record: list[dict[str, Any]] = []
    by_task: dict[str, list[float]] = defaultdict(list)
    refusal_scores: list[float] = []
    multi_turn_scores: list[float] = []

    for record in records:
        prediction = predictions.get(str(record["id"]), "")
        scores = score_answer(record, prediction)
        task = str(record.get("task", "unknown"))
        by_task[task].append(scores["macro"])
        if record.get("requires_refusal"):
            refusal_scores.append(scores["refusal"])
        if task == "multi_turn":
            multi_turn_scores.append(scores["macro"])
        per_record.append({"id": record["id"], "task": task, "prediction": prediction, **scores})

    macro_scores = [item["macro"] for item in per_record]
    return {
        "macro": _mean(macro_scores),
        "by_task": {task: _mean(scores) for task, scores in sorted(by_task.items())},
        "refusal_accuracy": _mean(refusal_scores),
        "multi_turn_accuracy": _mean(multi_turn_scores),
        "records": per_record,
    }


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _load_generation_stack() -> dict[str, Any]:
    try:
        import torch
        from peft import PeftModel
        from transformers import (
            AutoConfig,
            AutoModelForSeq2SeqLM,
            AutoTokenizer,
        )
    except ImportError as exc:
        raise RuntimeError("Install eval dependencies with pip install -r ml/profile-qa/requirements.txt") from exc
    return {
        "torch": torch,
        "AutoConfig": AutoConfig,
        "AutoModelForSeq2SeqLM": AutoModelForSeq2SeqLM,
        "AutoTokenizer": AutoTokenizer,
        "PeftModel": PeftModel,
    }


def _adapter_base_model_id(model_id: str) -> str | None:
    adapter_config_path = Path(model_id) / "adapter_config.json"
    if not adapter_config_path.exists():
        return None
    adapter_config = json.loads(adapter_config_path.read_text(encoding="utf-8"))
    base_model_id = adapter_config.get("base_model_name_or_path")
    return str(base_model_id) if isinstance(base_model_id, str) else None


def _ensure_generation_lineage(model_id: str, adapter_base_model_id: str | None, config: Any) -> None:
    if adapter_base_model_id:
        ensure_primary_base_model_id(adapter_base_model_id, source=f"{model_id} adapter base")
        return

    if model_id.rstrip("/") == PRIMARY_BASE_MODEL_ID:
        ensure_primary_base_model_id(model_id, source="evaluation model")
        return

    config_source = str(getattr(config, "_name_or_path", ""))
    ensure_primary_base_model_id(
        config_source,
        source=f"{model_id} config _name_or_path",
    )


def generate_predictions(model_id: str, records: list[dict[str, Any]]) -> dict[str, str]:
    """Generate answers locally for a model or adapter directory."""

    stack = _load_generation_stack()
    adapter_base_model_id = _adapter_base_model_id(model_id)
    config_model_id = adapter_base_model_id or model_id
    config = stack["AutoConfig"].from_pretrained(config_model_id, trust_remote_code=True)
    _ensure_generation_lineage(model_id, adapter_base_model_id, config)
    ensure_teapot_seq2seq_config(config, config_model_id)
    tokenizer = stack["AutoTokenizer"].from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None and tokenizer.eos_token is not None:
        tokenizer.pad_token = tokenizer.eos_token
    model = stack["AutoModelForSeq2SeqLM"].from_pretrained(
        config_model_id,
        device_map="auto",
        torch_dtype=stack["torch"].float16,
        trust_remote_code=True,
    )
    if adapter_base_model_id:
        model = stack["PeftModel"].from_pretrained(model, model_id)
    model.eval()

    predictions: dict[str, str] = {}
    for record in records:
        prompt = format_instruction(record)
        inputs = tokenizer(
            prompt,
            truncation=True,
            max_length=MODEL_CONTEXT_LIMIT,
            return_tensors="pt",
        )
        inputs = {key: value.to(model.device) for key, value in inputs.items()}
        with stack["torch"].no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=160,
                do_sample=False,
            )
        generated_ids = output_ids[0]
        generated = tokenizer.decode(generated_ids, skip_special_tokens=True)
        predictions[str(record["id"])] = str(generated).strip()
    return predictions


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH))
    parser.add_argument("--model-id")
    parser.add_argument("--predictions-json")
    parser.add_argument("--split", default="test")
    parser.add_argument("--output", default=str(DEFAULT_EVAL_REPORT_PATH))
    args = parser.parse_args()

    records = [
        record for record in read_jsonl(Path(args.dataset)) if record.get("split") == args.split
    ]
    if args.predictions_json:
        predictions = json.loads(Path(args.predictions_json).read_text(encoding="utf-8"))
    elif args.model_id:
        predictions = generate_predictions(args.model_id, records)
    else:
        raise RuntimeError("provide --model-id or --predictions-json")

    report = score_predictions(records, predictions)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "records"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
