from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_dependabot_excludes_exporter_manifests():
    config = (REPO_ROOT / ".github" / "dependabot.yml").read_text()
    assert "exclude-paths:" in config
    assert '"requirements-export.txt"' in config
    assert '"requirements-export.lock"' in config


def test_exporter_lane_keeps_compatible_ranges():
    requirements = (
        REPO_ROOT / "ml" / "profile-qa" / "requirements-export.txt"
    ).read_text()
    assert "huggingface-hub>=0.36.2,<1.0" in requirements
    assert "optimum[onnxruntime]>=2.1.0,<2.2" in requirements
    assert "transformers>=4.57.6,<4.58" in requirements
