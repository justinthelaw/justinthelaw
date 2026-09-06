from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_dependabot_excludes_exporter_manifests():
    config = (REPO_ROOT / ".github" / "dependabot.yml").read_text()
    lines = config.splitlines()
    start = next(
        index
        for index, line in enumerate(lines)
        if line == "  - package-ecosystem: pip"
    )
    end = next(
        (
            index
            for index in range(start + 1, len(lines))
            if lines[index].startswith("  - package-ecosystem:")
        ),
        len(lines),
    )
    pip_block = "\n".join(lines[start:end])

    assert 'directory: "/ml/profile-qa"' in pip_block
    assert "exclude-paths:" in pip_block
    assert '      - "requirements-export.txt"' in pip_block
    assert '      - "requirements-export.lock"' in pip_block


def test_exporter_lane_keeps_compatible_ranges():
    requirements = [
        line.strip()
        for line in (
            REPO_ROOT / "ml" / "profile-qa" / "requirements-export.txt"
        ).read_text().splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    assert requirements == [
        "huggingface-hub>=0.36.2,<1.0",
        "onnx>=1.22.0",
        "onnxruntime>=1.29.0",
        "optimum[onnxruntime]>=2.1.0,<2.2",
        "safetensors>=0.8.0",
        "sentencepiece>=0.2.2",
        "torch>=2.14.0",
        "transformers>=4.57.6,<4.58",
    ]
