"""Regression checks for the repository-root llm.persona namespace."""

from __future__ import annotations

import importlib
from pathlib import Path
import subprocess
import sys
import sysconfig
import unittest

from llm.persona.config import DEFAULT_DATASET_PATH, PACKAGE_ROOT, PROJECT_ROOT
from llm.persona.public_profile import CANONICAL_PROFILE_PATH


class PackageLayoutTests(unittest.TestCase):
    def test_persona_package_keeps_standard_library_profiler_available(self) -> None:
        pipeline = importlib.import_module("llm.persona")
        profiler = importlib.import_module("profile")
        cprofiler = importlib.import_module("cProfile")

        self.assertNotEqual(pipeline, profiler)
        self.assertEqual(
            Path(profiler.__file__).resolve(),
            (Path(sysconfig.get_path("stdlib")) / "profile.py").resolve(),
        )
        self.assertEqual(cprofiler.Profile().runcall(lambda: 7), 7)

    def test_canonical_profile_and_generated_data_resolve_from_repository_root(self) -> None:
        repository_root = Path(__file__).resolve().parents[2]
        self.assertEqual(PROJECT_ROOT, repository_root)
        self.assertEqual(PACKAGE_ROOT, repository_root / "llm")
        self.assertEqual(DEFAULT_DATASET_PATH, PACKAGE_ROOT / "data/profile_qa.jsonl")
        self.assertEqual(
            CANONICAL_PROFILE_PATH, repository_root / "src/config/public-profile.json"
        )
        self.assertTrue(CANONICAL_PROFILE_PATH.is_file())

    def test_module_command_runs_from_repository_root(self) -> None:
        result = subprocess.run(
            [sys.executable, "-m", "llm.persona.synthetic_data", "--help"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--output", result.stdout)
