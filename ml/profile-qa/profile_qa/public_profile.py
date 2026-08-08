"""Load canonical public profile facts for synthetic data generation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final, cast

from .config import PROJECT_ROOT

ProfileFact = dict[str, object]
ProfileSection = dict[str, object]

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


def fact_index() -> dict[tuple[str, str], ProfileFact]:
    """Return a lookup table keyed by section id and fact id."""

    index: dict[tuple[str, str], ProfileFact] = {}
    for section in PROFILE_SECTIONS:
        section_id = str(section["id"])
        for fact in section["facts"]:
            if isinstance(fact, dict):
                index[(section_id, str(fact["id"]))] = fact
    return index
