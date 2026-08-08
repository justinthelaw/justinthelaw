from __future__ import annotations

import argparse
import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from profile_qa.prepare_hf_artifacts import (
    prepare_dataset_payload,
    prepare_model_payload,
    validate_promotion_metrics,
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
    browser_dir = tmp_path / "browser"
    browser_dir.mkdir()
    dataset_path = tmp_path / "profile_qa.jsonl"
    dataset_path.write_text("{}\n", encoding="utf-8")

    reports = _passing_reports()
    reports["promoted_validation"]["refusal_accuracy"] = 0.94
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
