"""Exercise release checks against isolated package copies, never installed skills."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PackageValidation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="develop-validation-", dir=ROOT.parent)
        self.assertEqual(Path(self.temp.name).resolve().parent, ROOT.parent.resolve())
        self.addCleanup(self.temp.cleanup)
        self.repository = Path(self.temp.name) / "repository"
        self.package = self.repository / "plugins/develop"
        shutil.copytree(ROOT, self.package, ignore=shutil.ignore_patterns(".git", ".agents", "__pycache__"))
        self.catalog = self.repository / ".agents/plugins/marketplace.json"
        self.catalog.parent.mkdir(parents=True)
        self.catalog.write_text(json.dumps({
            "name": "justinthelaw",
            "plugins": [{
                "name": "develop",
                "source": {"source": "local", "path": "./plugins/develop"},
            }],
        }), encoding="utf-8")

    def validate(self, marketplace=True):
        command = [sys.executable, str(ROOT / "scripts/validate.py"), "--root", str(self.package)]
        if marketplace:
            command.extend(["--marketplace-root", str(self.repository)])
        return subprocess.run(
            command,
            capture_output=True, text=True, check=False,
        )

    def test_valid_package_passes(self):
        result = self.validate()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_skill_reference_fails(self):
        skill = self.package / "skills/develop/SKILL.md"
        skill.write_text(skill.read_text(encoding="utf-8") + "\n[required](references/missing.md)\n", encoding="utf-8")
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing.md", result.stdout + result.stderr)

    def test_catalog_cannot_escape_repository(self):
        catalog = json.loads(self.catalog.read_text(encoding="utf-8"))
        catalog["plugins"][0]["source"]["path"] = "../elsewhere"
        self.catalog.write_text(json.dumps(catalog), encoding="utf-8")
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("catalog", result.stdout + result.stderr)

    def test_other_plugins_can_share_catalog(self):
        catalog = json.loads(self.catalog.read_text(encoding="utf-8"))
        catalog["plugins"].append({"name": "other", "source": "./plugins/other"})
        self.catalog.write_text(json.dumps(catalog), encoding="utf-8")
        result = self.validate()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_nested_package_requires_repository_catalog(self):
        self.catalog.unlink()
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("marketplace.json", result.stdout + result.stderr)

    def test_installed_payload_does_not_require_repository_catalog(self):
        installed = Path(self.temp.name) / ".codex/plugins/develop"
        installed.parent.mkdir(parents=True)
        self.package.rename(installed)
        self.package = installed
        result = self.validate(marketplace=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_skill_name_must_match_directory(self):
        path = self.package / "skills/clean/SKILL.md"
        path.write_text(path.read_text(encoding="utf-8").replace("name: clean", "name: wrong"), encoding="utf-8")
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("name", result.stdout + result.stderr)

    def test_missing_icon_fails(self):
        (self.package / "skills/clean/assets/icon.png").unlink()
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("icon", result.stdout + result.stderr)

    def test_icon_cannot_escape_skill(self):
        path = self.package / "skills/clean/agents/openai.yaml"
        path.write_text(path.read_text(encoding="utf-8").replace(
            "./assets/icon.png", "./../iterate/assets/icon.png"), encoding="utf-8")
        result = self.validate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("asset", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
