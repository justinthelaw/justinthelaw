"""Load canonical public profile facts for synthetic data generation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final, cast

from .config import PROJECT_ROOT

ProfileFact = dict[str, object]
ProfileSection = dict[str, object]
ProfileSubject = dict[str, str]

CANONICAL_PROFILE_PATH: Final[Path] = (
    PROJECT_ROOT / "src" / "config" / "public-profile.json"
)


def _load_profile_sections() -> list[ProfileSection]:
    try:
        value = json.loads(CANONICAL_PROFILE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            f"could not load canonical public profile {CANONICAL_PROFILE_PATH}: {exc}"
        ) from exc

    if not isinstance(value, list) or not all(
        isinstance(section, dict) for section in value
    ):
        raise RuntimeError(
            "canonical public profile "
            f"{CANONICAL_PROFILE_PATH} must be a list of objects"
        )
    return cast(list[ProfileSection], value)


PROFILE_SECTIONS: Final[list[ProfileSection]] = _load_profile_sections()


def _load_profile_subject() -> ProfileSubject:
    identity_section = next(
        (section for section in PROFILE_SECTIONS if section.get("id") == "identity"),
        None,
    )
    raw_subject = identity_section.get("subject") if identity_section else None
    if not isinstance(raw_subject, dict):
        raise RuntimeError(
            "canonical public profile identity section requires a subject object"
        )

    required_fields = (
        "name",
        "shortName",
        "subjectPronoun",
        "objectPronoun",
        "possessivePronoun",
    )
    subject: ProfileSubject = {}
    for field in required_fields:
        value = raw_subject.get(field)
        if not isinstance(value, str) or not value.strip():
            raise RuntimeError(
                f"canonical public profile subject.{field} must be non-empty"
            )
        subject[field] = value.strip()
    return subject


PROFILE_SUBJECT: Final[ProfileSubject] = _load_profile_subject()


def profile_subject_name() -> str:
    """Return the canonical full name used in training instructions."""

    return PROFILE_SUBJECT["name"]


def profile_subject_short_name() -> str:
    """Return the canonical short name used in synthetic questions."""

    return PROFILE_SUBJECT["shortName"]


def profile_subject_pronouns() -> tuple[str, str, str]:
    """Return canonical subject, object, and possessive pronouns."""

    return (
        PROFILE_SUBJECT["subjectPronoun"],
        PROFILE_SUBJECT["objectPronoun"],
        PROFILE_SUBJECT["possessivePronoun"],
    )


def possessive(value: str) -> str:
    """Return a readable possessive for a profile subject name."""

    return f"{value}'" if value.endswith("s") else f"{value}'s"


def fact_index() -> dict[tuple[str, str], ProfileFact]:
    """Return a lookup table keyed by section id and fact id."""

    index: dict[tuple[str, str], ProfileFact] = {}
    for section in PROFILE_SECTIONS:
        section_id = str(section["id"])
        for fact in section["facts"]:
            if isinstance(fact, dict):
                index[(section_id, str(fact["id"]))] = fact
    return index
