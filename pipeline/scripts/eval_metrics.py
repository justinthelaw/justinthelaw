#!/usr/bin/env python3
"""Evaluation metrics for response quality and behavior."""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass

from eval_dataset import EvalCase

STOP_WORDS = {
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'were',
    'will',
    'with',
}


@dataclass(frozen=True, slots=True)
class CaseScores:
    """Per-case evaluation metrics."""

    exact_match: float
    token_f1: float
    keyword_coverage: float
    response_length_compliant: bool
    is_refusal: bool
    behavior_correct: bool


def normalize_text(text: str) -> str:
    """Normalize text for lexical comparison."""
    lowered = text.lower()
    lowered = re.sub(r'[^a-z0-9\s]', ' ', lowered)
    lowered = re.sub(r'\s+', ' ', lowered).strip()
    return lowered


def tokenize(text: str) -> list[str]:
    """Tokenize normalized text."""
    normalized = normalize_text(text)
    if not normalized:
        return []
    return normalized.split(' ')


def exact_match(reference: str, prediction: str) -> float:
    """Strict normalized exact match."""
    return 1.0 if normalize_text(reference) == normalize_text(prediction) else 0.0


def token_f1(reference: str, prediction: str) -> float:
    """Token-level F1 between reference and prediction."""
    ref_tokens = tokenize(reference)
    pred_tokens = tokenize(prediction)

    if not ref_tokens and not pred_tokens:
        return 1.0
    if not ref_tokens or not pred_tokens:
        return 0.0

    ref_counter = Counter(ref_tokens)
    pred_counter = Counter(pred_tokens)
    overlap = sum((ref_counter & pred_counter).values())
    if overlap == 0:
        return 0.0

    precision = overlap / len(pred_tokens)
    recall = overlap / len(ref_tokens)
    return 2 * precision * recall / (precision + recall)


def extract_required_keywords(reference_answer: str, tags: Sequence[str], max_keywords: int = 6) -> tuple[str, ...]:
    """Extract required keywords from tags or reference answer."""
    tag_keywords: list[str] = []
    for tag in tags:
        tag_lower = tag.lower()
        if not tag_lower.startswith('kw:'):
            continue
        keyword = tag_lower.removeprefix('kw:').strip()
        if keyword:
            tag_keywords.append(keyword)

    if tag_keywords:
        return tuple(_dedupe_keep_order(tag_keywords)[:max_keywords])

    inferred: list[str] = []
    for token in tokenize(reference_answer):
        if len(token) < 4 or token in STOP_WORDS or token.isdigit():
            continue
        inferred.append(token)

    return tuple(_dedupe_keep_order(inferred)[:max_keywords])


def keyword_coverage(response: str, required_keywords: Sequence[str]) -> float:
    """Fraction of required keywords found in response."""
    if not required_keywords:
        return 1.0

    normalized_response = normalize_text(response)
    if not normalized_response:
        return 0.0

    matched = 0
    for keyword in required_keywords:
        normalized_keyword = normalize_text(keyword)
        if not normalized_keyword:
            continue
        if normalized_keyword in normalized_response:
            matched += 1

    return matched / len(required_keywords)


def response_length_compliant(text: str, max_sentences: int, max_words: int) -> bool:
    """Check response length constraints."""
    stripped = text.strip()
    if not stripped:
        return False

    words = [word for word in stripped.split() if word]
    if len(words) > max_words:
        return False

    sentences = _count_sentences(stripped)
    return sentences <= max_sentences


def is_refusal_response(response: str, refusal_markers: Sequence[str]) -> bool:
    """Heuristic refusal detector."""
    normalized_response = normalize_text(response)
    if not normalized_response:
        return True

    for marker in refusal_markers:
        normalized_marker = normalize_text(marker)
        if normalized_marker and normalized_marker in normalized_response:
            return True

    fallback_patterns = (
        'not enough information',
        'cannot determine',
        'outside the scope',
        'do not know',
        'don t know',
        'can t answer',
    )
    return any(pattern in normalized_response for pattern in fallback_patterns)


def score_case(
    case: EvalCase,
    response: str,
    refusal_markers: Sequence[str],
    max_sentences: int,
    max_words: int,
) -> CaseScores:
    """Score a single response for one eval case."""
    case_exact_match = exact_match(case.reference_answer, response) if case.reference_answer else 0.0
    case_token_f1 = token_f1(case.reference_answer, response) if case.reference_answer else 0.0
    required_keywords = extract_required_keywords(case.reference_answer, case.tags)
    case_keyword_coverage = keyword_coverage(response, required_keywords)
    case_length_ok = response_length_compliant(response, max_sentences=max_sentences, max_words=max_words)
    case_is_refusal = is_refusal_response(response, refusal_markers=refusal_markers)

    if case.expected_behavior == 'refuse':
        behavior_correct = case_is_refusal
    else:
        behavior_correct = not case_is_refusal

    return CaseScores(
        exact_match=case_exact_match,
        token_f1=case_token_f1,
        keyword_coverage=case_keyword_coverage,
        response_length_compliant=case_length_ok,
        is_refusal=case_is_refusal,
        behavior_correct=behavior_correct,
    )


def _count_sentences(text: str) -> int:
    """Approximate sentence count from punctuation."""
    chunks = re.split(r'[.!?]+', text)
    non_empty = [chunk for chunk in chunks if chunk.strip()]
    return max(1, len(non_empty))


def _dedupe_keep_order(items: Sequence[str]) -> list[str]:
    """Deduplicate while preserving order."""
    deduped: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        deduped.append(item)
    return deduped
