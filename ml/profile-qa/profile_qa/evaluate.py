"""Evaluate profile-QA model outputs against the public synthetic set."""

from __future__ import annotations

import argparse
import inspect
import io
import json
import textwrap
import tokenize
from collections import defaultdict
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_DATASET_PATH,
    DEFAULT_EVAL_REPORT_PATH,
    MODEL_CONTEXT_LIMIT,
    PRIMARY_BASE_MODEL_ID,
    PRIMARY_BASE_MODEL_REVISION,
)
from .export_onnx import ensure_teapot_export_model
from .provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    DATASET_DIGEST_FIELD,
    LINEAGE_FILENAME,
    MERGED_DIGEST_FIELD,
    PROMPT_DIGEST_FIELD,
    canonical_json_sha256,
    directory_sha256,
    load_json_object,
    require_checkpoint_label,
    require_sha256,
)
from .train_lora import (
    ensure_primary_base_model_id,
    ensure_teapot_seq2seq_config,
    evaluation_prompt_sha256,
    format_instruction,
    require_local_model_path,
    trusted_model_load_kwargs,
)
from .validation import canonical_jsonl_sha256, read_jsonl

SCORING_SCHEMA_VERSION = 1
SCORING_SCHEMA_FIELD = "scoring_schema_version"
SCORING_DIGEST_FIELD = "scoring_implementation_sha256"
GENERATION_SCHEMA_VERSION = 1
GENERATION_SCHEMA_FIELD = "generation_schema_version"
GENERATION_DIGEST_FIELD = "generation_implementation_sha256"
GENERATION_CONFIG_FIELD = "generation_config"
GENERATION_MAX_NEW_TOKENS = 160
GENERATION_DO_SAMPLE = False


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


def _implementation_sha256(
    functions: tuple[Any, ...],
    *,
    schema_version: int,
) -> str:
    """Hash semantic Python tokens without Python-minor-specific AST layouts."""

    function_tokens = []
    ignored_token_types = {
        tokenize.COMMENT,
        tokenize.ENCODING,
        tokenize.ENDMARKER,
        tokenize.NL,
    }
    structural_token_types = {
        tokenize.DEDENT,
        tokenize.INDENT,
        tokenize.NEWLINE,
    }
    for function in functions:
        source = textwrap.dedent(inspect.getsource(function))
        tokens = []
        for token in tokenize.generate_tokens(io.StringIO(source).readline):
            if token.type in ignored_token_types:
                continue
            token_value = (
                "" if token.type in structural_token_types else token.string
            )
            tokens.append((tokenize.tok_name[token.type], token_value))
        function_tokens.append(tokens)
    return canonical_json_sha256(
        {
            "schema_version": schema_version,
            "function_tokens": function_tokens,
        }
    )


def scoring_implementation_sha256() -> str:
    """Hash every function that defines report scores."""

    return _implementation_sha256(
        (score_answer, score_predictions, _mean),
        schema_version=SCORING_SCHEMA_VERSION,
    )


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


def evaluation_provenance(
    model_id: str,
    split: str,
    dataset_sha256: str,
    prompt_sha256: str,
) -> dict[str, Any]:
    """Describe the immutable model lineage used to create an eval report."""

    normalized_split = split.strip()
    if not normalized_split:
        raise RuntimeError("evaluation split must not be empty")
    normalized_dataset_sha256 = require_sha256(
        dataset_sha256,
        field=DATASET_DIGEST_FIELD,
        source=Path("evaluation dataset"),
    )
    normalized_prompt_sha256 = require_sha256(
        prompt_sha256,
        field=PROMPT_DIGEST_FIELD,
        source=Path("evaluation prompts"),
    )
    evaluation_contract_provenance = {
        SCORING_SCHEMA_FIELD: SCORING_SCHEMA_VERSION,
        SCORING_DIGEST_FIELD: scoring_implementation_sha256(),
        **generation_provenance_fields(),
    }
    if model_id.rstrip("/") == PRIMARY_BASE_MODEL_ID:
        return {
            "model_kind": "baseline",
            "model_id": PRIMARY_BASE_MODEL_ID,
            BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
            "base_model": PRIMARY_BASE_MODEL_ID,
            DATASET_DIGEST_FIELD: normalized_dataset_sha256,
            PROMPT_DIGEST_FIELD: normalized_prompt_sha256,
            **evaluation_contract_provenance,
            "split": normalized_split,
        }

    model_path = require_local_model_path(
        model_id,
        source="evaluation model",
    ).resolve()
    canonical_model_id = str(model_path)
    adapter_base_model_id = _adapter_base_model_id(canonical_model_id)
    if adapter_base_model_id:
        ensure_primary_base_model_id(
            adapter_base_model_id,
            source=f"{canonical_model_id} adapter base",
        )
        adapter_checkpoint = require_checkpoint_label(
            model_path.name,
            source=model_path,
        )
        adapter_digest = directory_sha256(model_path)
        return {
            "model_kind": "adapter",
            "model_id": adapter_checkpoint,
            "model_sha256": adapter_digest,
            ADAPTER_CHECKPOINT_FIELD: adapter_checkpoint,
            ADAPTER_DIGEST_FIELD: adapter_digest,
            "base_model": PRIMARY_BASE_MODEL_ID,
            BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
            DATASET_DIGEST_FIELD: normalized_dataset_sha256,
            PROMPT_DIGEST_FIELD: normalized_prompt_sha256,
            **evaluation_contract_provenance,
            "split": normalized_split,
        }

    if (model_path / LINEAGE_FILENAME).exists():
        lineage = ensure_teapot_export_model(canonical_model_id).data
        adapter_checkpoint = require_checkpoint_label(
            lineage.get(ADAPTER_CHECKPOINT_FIELD),
            source=model_path / LINEAGE_FILENAME,
        )
        adapter_digest = lineage.get(ADAPTER_DIGEST_FIELD)
        if not isinstance(adapter_digest, str):
            raise RuntimeError(
                f"{model_path / LINEAGE_FILENAME} does not record "
                f"{ADAPTER_DIGEST_FIELD}"
        )
        return {
            "model_kind": "merged",
            "model_id": "merged-model",
            "model_sha256": lineage[MERGED_DIGEST_FIELD],
            ADAPTER_CHECKPOINT_FIELD: adapter_checkpoint,
            ADAPTER_DIGEST_FIELD: adapter_digest,
            "base_model": PRIMARY_BASE_MODEL_ID,
            BASE_MODEL_REVISION_FIELD: lineage[BASE_MODEL_REVISION_FIELD],
            DATASET_DIGEST_FIELD: normalized_dataset_sha256,
            PROMPT_DIGEST_FIELD: normalized_prompt_sha256,
            **evaluation_contract_provenance,
            "split": normalized_split,
        }

    raise RuntimeError(
        "local evaluation models must be an adapter checkpoint or a merged model "
        f"containing {LINEAGE_FILENAME}: {model_path}"
    )


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
    if model_id.rstrip("/") != PRIMARY_BASE_MODEL_ID:
        require_local_model_path(model_id, source="evaluation model")
    adapter_base_model_id = _adapter_base_model_id(model_id)
    config_model_id = adapter_base_model_id or model_id
    config_load_kwargs = trusted_model_load_kwargs(config_model_id)
    config = stack["AutoConfig"].from_pretrained(config_model_id, **config_load_kwargs)
    _ensure_generation_lineage(model_id, adapter_base_model_id, config)
    ensure_teapot_seq2seq_config(config, config_model_id)
    tokenizer = stack["AutoTokenizer"].from_pretrained(
        model_id,
        **trusted_model_load_kwargs(model_id),
    )
    if tokenizer.pad_token is None and tokenizer.eos_token is not None:
        tokenizer.pad_token = tokenizer.eos_token
    model = stack["AutoModelForSeq2SeqLM"].from_pretrained(
        config_model_id,
        device_map="auto",
        torch_dtype=stack["torch"].float16,
        **config_load_kwargs,
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
                max_new_tokens=GENERATION_MAX_NEW_TOKENS,
                do_sample=GENERATION_DO_SAMPLE,
            )
        generated_ids = output_ids[0]
        generated = tokenizer.decode(generated_ids, skip_special_tokens=True)
        predictions[str(record["id"])] = str(generated).strip()
    return predictions


def generation_config() -> dict[str, Any]:
    """Return generation settings that materially affect saved predictions."""

    return {
        "decode_skip_special_tokens": True,
        "do_sample": GENERATION_DO_SAMPLE,
        "input_truncation": True,
        "max_input_tokens": MODEL_CONTEXT_LIMIT,
        "max_new_tokens": GENERATION_MAX_NEW_TOKENS,
    }


def generation_implementation_sha256() -> str:
    """Hash the local generation path independently of scoring semantics."""

    return _implementation_sha256(
        (
            _adapter_base_model_id,
            _ensure_generation_lineage,
            generate_predictions,
        ),
        schema_version=GENERATION_SCHEMA_VERSION,
    )


def generation_provenance_fields() -> dict[str, Any]:
    """Describe the exact generation contract for reports and saved bundles."""

    return {
        GENERATION_SCHEMA_FIELD: GENERATION_SCHEMA_VERSION,
        GENERATION_DIGEST_FIELD: generation_implementation_sha256(),
        GENERATION_CONFIG_FIELD: generation_config(),
    }


def write_prediction_bundle(
    path: Path,
    *,
    predictions: dict[str, str],
    provenance: dict[str, Any],
) -> None:
    """Persist predictions with the provenance needed for safe report reuse."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {"predictions": predictions, "provenance": provenance},
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )


def load_prediction_bundle(
    path: Path,
    *,
    expected_provenance: dict[str, Any],
    records: list[dict[str, Any]],
) -> dict[str, str]:
    """Load saved predictions only when their full evaluation inputs match."""

    bundle = load_json_object(path, label="saved predictions")
    provenance = bundle.get("provenance")
    if not isinstance(provenance, dict):
        raise ValueError(
            f"{path} is missing object field 'provenance'; regenerate it with "
            "--save-predictions-json"
        )
    mismatched_fields = sorted(
        field
        for field in set(expected_provenance) | set(provenance)
        if field not in provenance
        or field not in expected_provenance
        or provenance[field] != expected_provenance[field]
    )
    if mismatched_fields:
        raise ValueError(
            f"{path} prediction provenance does not match the selected model, "
            "dataset, split, and prompt context; mismatched fields: "
            f"{', '.join(mismatched_fields)}"
        )

    raw_predictions = bundle.get("predictions")
    if not isinstance(raw_predictions, dict) or not all(
        isinstance(record_id, str) and isinstance(prediction, str)
        for record_id, prediction in raw_predictions.items()
    ):
        raise ValueError(
            f"{path} field 'predictions' must map string record IDs to strings"
        )
    if any(
        not isinstance(record.get("id"), str) or not str(record["id"]).strip()
        for record in records
    ):
        raise ValueError("evaluation records must have unique non-empty string IDs")
    expected_ids = [str(record["id"]) for record in records]
    if len(expected_ids) != len(set(expected_ids)):
        raise ValueError("evaluation records must have unique non-empty string IDs")
    expected_id_set = set(expected_ids)
    actual_id_set = set(raw_predictions)
    if actual_id_set != expected_id_set:
        missing = sorted(expected_id_set - actual_id_set)
        unexpected = sorted(actual_id_set - expected_id_set)
        details = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if unexpected:
            details.append(f"unexpected: {', '.join(unexpected)}")
        raise ValueError(
            f"{path} predictions do not match evaluated record IDs "
            f"({'; '.join(details)})"
        )
    return dict(raw_predictions)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH))
    parser.add_argument(
        "--model-id",
        required=True,
        help="base model, adapter checkpoint, or merged model represented by the report",
    )
    predictions_group = parser.add_mutually_exclusive_group()
    predictions_group.add_argument(
        "--predictions-json",
        help="reuse a provenance-bound bundle written by --save-predictions-json",
    )
    predictions_group.add_argument(
        "--save-predictions-json",
        help="save generated predictions and their provenance for later scoring",
    )
    parser.add_argument("--split", default="test")
    parser.add_argument("--output", default=str(DEFAULT_EVAL_REPORT_PATH))
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    dataset_records = read_jsonl(dataset_path)
    dataset_sha256 = canonical_jsonl_sha256(dataset_records)
    records = [record for record in dataset_records if record.get("split") == args.split]
    provenance = evaluation_provenance(
        args.model_id,
        args.split,
        dataset_sha256,
        evaluation_prompt_sha256(records),
    )
    if args.predictions_json:
        predictions = load_prediction_bundle(
            Path(args.predictions_json),
            expected_provenance=provenance,
            records=records,
        )
    else:
        predictions = generate_predictions(args.model_id, records)
        if args.save_predictions_json:
            write_prediction_bundle(
                Path(args.save_predictions_json),
                predictions=predictions,
                provenance=provenance,
            )

    report = score_predictions(records, predictions)
    report["provenance"] = provenance
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "records"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
