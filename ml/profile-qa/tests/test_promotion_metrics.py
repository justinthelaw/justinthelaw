from __future__ import annotations

import argparse
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from profile_qa.config import PRIMARY_BASE_MODEL_ID
from profile_qa.evaluate import _load_prediction_bundle
from profile_qa.prepare_hf_artifacts import (
    prepare_dataset_payload,
    prepare_model_payload,
    validate_promotion_metrics,
    validate_promotion_provenance,
)
from profile_qa.provenance import (
    evaluation_provenance,
    write_candidate_provenance,
)


def _report(
    *,
    macro: float = 0.92,
    refusal_accuracy: float = 0.95,
    multi_turn_accuracy: float = 0.80,
) -> dict[str, Any]:
    return {
        "macro": macro,
        "refusal_accuracy": refusal_accuracy,
        "multi_turn_accuracy": multi_turn_accuracy,
        "by_task": {
            "multi_turn": multi_turn_accuracy,
            "refusal": refusal_accuracy,
            "single_turn": macro,
        },
    }


def _passing_reports() -> dict[str, dict[str, Any]]:
    return {
        "baseline_test": _report(macro=0.80),
        "promoted_validation": _report(macro=0.90),
        "promoted_test": _report(macro=0.92),
    }


def test_promotion_metrics_accept_exact_thresholds() -> None:
    reports = _passing_reports()

    validate_promotion_metrics(**reports)


@pytest.mark.parametrize(
    ("report_name", "metric_name", "value", "message"),
    [
        (
            "promoted_test",
            "macro",
            0.919,
            "must improve on baseline test by at least 15%",
        ),
        (
            "promoted_validation",
            "refusal_accuracy",
            0.949,
            "promoted validation metric 'refusal_accuracy'",
        ),
        (
            "promoted_test",
            "refusal_accuracy",
            0.949,
            "promoted test metric 'refusal_accuracy'",
        ),
        (
            "promoted_validation",
            "multi_turn_accuracy",
            0.799,
            "promoted validation metric 'multi_turn_accuracy'",
        ),
        (
            "promoted_test",
            "multi_turn_accuracy",
            0.799,
            "promoted test metric 'multi_turn_accuracy'",
        ),
    ],
)
def test_promotion_metrics_reject_threshold_failures(
    report_name: str,
    metric_name: str,
    value: float,
    message: str,
) -> None:
    reports = _passing_reports()
    reports[report_name][metric_name] = value
    task_name_by_metric = {
        "refusal_accuracy": "refusal",
        "multi_turn_accuracy": "multi_turn",
    }
    if metric_name in task_name_by_metric:
        reports[report_name]["by_task"][task_name_by_metric[metric_name]] = value

    with pytest.raises(ValueError, match=message):
        validate_promotion_metrics(**reports)


def test_promotion_metrics_reject_missing_metrics() -> None:
    reports = _passing_reports()
    del reports["baseline_test"]["macro"]

    with pytest.raises(
        ValueError, match="baseline test report is missing metric 'macro'"
    ):
        validate_promotion_metrics(**reports)


def test_promotion_metrics_reject_zero_baseline_for_relative_comparison() -> None:
    reports = _passing_reports()
    reports["baseline_test"]["macro"] = 0.0

    with pytest.raises(ValueError, match="baseline test macro must be greater than 0"):
        validate_promotion_metrics(**reports)


@pytest.mark.parametrize(
    ("value", "message"),
    [
        ("0.95", "must be a number"),
        (float("nan"), "must be finite"),
        (1.01, "must be between 0 and 1"),
    ],
)
def test_promotion_metrics_reject_invalid_score_values(
    value: object,
    message: str,
) -> None:
    reports = _passing_reports()
    reports["promoted_validation"]["refusal_accuracy"] = value

    with pytest.raises(ValueError, match=message):
        validate_promotion_metrics(**reports)


def test_promotion_metrics_reject_malformed_task_metrics() -> None:
    reports = _passing_reports()
    reports["promoted_test"]["by_task"] = []

    with pytest.raises(ValueError, match="field 'by_task' must be a non-empty object"):
        validate_promotion_metrics(**reports)


@pytest.mark.parametrize("report_name", ["promoted_validation", "promoted_test"])
@pytest.mark.parametrize("task_name", ["refusal", "multi_turn"])
def test_promotion_metrics_require_gated_task_metrics(
    report_name: str,
    task_name: str,
) -> None:
    reports = _passing_reports()
    del reports[report_name]["by_task"][task_name]

    with pytest.raises(
        ValueError,
        match=rf"{report_name.replace('_', ' ')} report is missing required by_task entry '{task_name}'",
    ):
        validate_promotion_metrics(**reports)


@pytest.mark.parametrize(
    ("report_name", "task_name", "metric_name"),
    [
        ("promoted_validation", "refusal", "refusal_accuracy"),
        ("promoted_validation", "multi_turn", "multi_turn_accuracy"),
        ("promoted_test", "refusal", "refusal_accuracy"),
        ("promoted_test", "multi_turn", "multi_turn_accuracy"),
    ],
)
def test_promotion_metrics_reject_inconsistent_task_and_top_level_scores(
    report_name: str,
    task_name: str,
    metric_name: str,
) -> None:
    reports = _passing_reports()
    reports[report_name]["by_task"][task_name] = 0.99

    with pytest.raises(
        ValueError,
        match=rf"{report_name.replace('_', ' ')} by_task '{task_name}' must agree with '{metric_name}'",
    ):
        validate_promotion_metrics(**reports)


def test_promotion_metrics_reject_non_object_reports() -> None:
    reports = _passing_reports()

    with pytest.raises(ValueError, match="promoted test report must be a JSON object"):
        validate_promotion_metrics(
            baseline_test=reports["baseline_test"],
            promoted_validation=reports["promoted_validation"],
            promoted_test=[],
        )


def _write_report(path: Path, report: dict[str, Any]) -> None:
    path.write_text(json.dumps(report), encoding="utf-8")


def _provenance_inputs(
    tmp_path: Path,
) -> tuple[dict[str, dict[str, Any]], Path, Path, Path]:
    dataset_path = tmp_path / "profile_qa.jsonl"
    dataset_path.write_text('{"id":"example"}\n', encoding="utf-8")

    source_model_dir = tmp_path / "merged-model"
    source_model_dir.mkdir()
    (source_model_dir / "model.safetensors").write_bytes(b"candidate weights")

    browser_dir = tmp_path / "browser"
    browser_dir.mkdir()
    (browser_dir / "config.json").write_text("{}", encoding="utf-8")
    write_candidate_provenance(
        source_model=str(source_model_dir),
        browser_dir=browser_dir,
    )

    reports = _passing_reports()
    reports["baseline_test"]["provenance"] = evaluation_provenance(
        dataset_path=dataset_path,
        split="test",
        model_id=PRIMARY_BASE_MODEL_ID,
    )
    for report_name, split in (
        ("promoted_validation", "validation"),
        ("promoted_test", "test"),
    ):
        reports[report_name]["provenance"] = evaluation_provenance(
            dataset_path=dataset_path,
            split=split,
            model_id=str(source_model_dir),
        )
    return reports, dataset_path, source_model_dir, browser_dir


def test_promotion_provenance_accepts_matching_candidate_dataset_and_splits(
    tmp_path: Path,
) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)

    validate_promotion_provenance(
        **reports,
        dataset_path=dataset_path,
        model_browser_dir=browser_dir,
    )


def test_promotion_provenance_rejects_stale_candidate_report(tmp_path: Path) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    reports["promoted_test"]["provenance"]["model"]["sha256"] = "0" * 64

    with pytest.raises(
        ValueError,
        match="promoted test provenance model does not match the browser candidate",
    ):
        validate_promotion_provenance(
            **reports,
            dataset_path=dataset_path,
            model_browser_dir=browser_dir,
        )


def test_promotion_provenance_rejects_stale_dataset_report(tmp_path: Path) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    dataset_path.write_text('{"id":"changed"}\n', encoding="utf-8")

    with pytest.raises(ValueError, match="does not match dataset"):
        validate_promotion_provenance(
            **reports,
            dataset_path=dataset_path,
            model_browser_dir=browser_dir,
        )


def test_promotion_provenance_rejects_wrong_report_split(tmp_path: Path) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    reports["promoted_validation"]["provenance"]["split"] = "test"

    with pytest.raises(
        ValueError,
        match="promoted validation provenance split must be 'validation'",
    ):
        validate_promotion_provenance(
            **reports,
            dataset_path=dataset_path,
            model_browser_dir=browser_dir,
        )


def test_promotion_provenance_rejects_modified_browser_artifact(tmp_path: Path) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    (browser_dir / "config.json").write_text('{"changed":true}', encoding="utf-8")

    with pytest.raises(
        ValueError,
        match="candidate browser artifact does not match its provenance",
    ):
        validate_promotion_provenance(
            **reports,
            dataset_path=dataset_path,
            model_browser_dir=browser_dir,
        )


def test_prediction_bundle_requires_matching_provenance(tmp_path: Path) -> None:
    reports, _, _, _ = _provenance_inputs(tmp_path)
    expected_provenance = reports["promoted_test"]["provenance"]
    bundle_path = tmp_path / "predictions.json"
    bundle_path.write_text(
        json.dumps(
            {
                "predictions": {"example": "answer"},
                "provenance": expected_provenance,
            }
        ),
        encoding="utf-8",
    )

    assert _load_prediction_bundle(
        bundle_path,
        expected_provenance=expected_provenance,
    ) == {"example": "answer"}

    stale_provenance = dict(expected_provenance)
    stale_provenance["split"] = "validation"
    with pytest.raises(ValueError, match="provenance does not match"):
        _load_prediction_bundle(
            bundle_path,
            expected_provenance=stale_provenance,
        )


def test_promotion_provenance_rejects_boolean_schema_version(tmp_path: Path) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    reports["promoted_test"]["provenance"]["schema_version"] = True

    with pytest.raises(
        ValueError,
        match="promoted test provenance schema_version must be 1",
    ):
        validate_promotion_provenance(
            **reports,
            dataset_path=dataset_path,
            model_browser_dir=browser_dir,
        )


@pytest.mark.parametrize(
    ("prepare_payload", "payload_name"),
    [
        (prepare_model_payload, "model"),
        (prepare_dataset_payload, "dataset"),
    ],
)
def test_payload_preflight_preserves_existing_output_on_metric_failure(
    tmp_path: Path,
    prepare_payload: Callable[[argparse.Namespace], Path],
    payload_name: str,
) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    reports["promoted_validation"]["refusal_accuracy"] = 0.94
    reports["promoted_validation"]["by_task"]["refusal"] = 0.94
    report_paths = {
        report_name: tmp_path / f"{report_name}.json" for report_name in reports
    }
    for report_name, report in reports.items():
        _write_report(report_paths[report_name], report)

    output_dir = tmp_path / "hf"
    existing_payload = output_dir / payload_name
    existing_payload.mkdir(parents=True)
    sentinel = existing_payload / "keep.txt"
    sentinel.write_text("unchanged", encoding="utf-8")
    args = argparse.Namespace(
        baseline_report=str(report_paths["baseline_test"]),
        validation_report=str(report_paths["promoted_validation"]),
        test_report=str(report_paths["promoted_test"]),
        model_browser_dir=str(browser_dir),
        dataset=str(dataset_path),
        output_dir=str(output_dir),
        model_repo_id="example/model",
        dataset_repo_id="example/dataset",
    )

    with pytest.raises(ValueError, match="promotion metric validation failed"):
        prepare_payload(args)

    assert sentinel.read_text(encoding="utf-8") == "unchanged"


@pytest.mark.parametrize(
    ("prepare_payload", "payload_name"),
    [
        (prepare_model_payload, "model"),
        (prepare_dataset_payload, "dataset"),
    ],
)
def test_payload_preflight_preserves_existing_output_on_provenance_failure(
    tmp_path: Path,
    prepare_payload: Callable[[argparse.Namespace], Path],
    payload_name: str,
) -> None:
    reports, dataset_path, _, browser_dir = _provenance_inputs(tmp_path)
    reports["promoted_test"]["provenance"]["model"]["sha256"] = "0" * 64
    report_paths = {
        report_name: tmp_path / f"{report_name}.json" for report_name in reports
    }
    for report_name, report in reports.items():
        _write_report(report_paths[report_name], report)

    output_dir = tmp_path / "hf"
    existing_payload = output_dir / payload_name
    existing_payload.mkdir(parents=True)
    sentinel = existing_payload / "keep.txt"
    sentinel.write_text("unchanged", encoding="utf-8")
    args = argparse.Namespace(
        baseline_report=str(report_paths["baseline_test"]),
        validation_report=str(report_paths["promoted_validation"]),
        test_report=str(report_paths["promoted_test"]),
        model_browser_dir=str(browser_dir),
        dataset=str(dataset_path),
        output_dir=str(output_dir),
        model_repo_id="example/model",
        dataset_repo_id="example/dataset",
    )

    with pytest.raises(ValueError, match="promotion provenance validation failed"):
        prepare_payload(args)

    assert sentinel.read_text(encoding="utf-8") == "unchanged"
