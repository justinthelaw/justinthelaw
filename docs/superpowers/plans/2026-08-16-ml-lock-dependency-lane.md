# ML Lock Dependency Lane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Dependabot from combining incompatible training and exporter requirements, refresh the ML source manifests, and regenerate locks that pass the existing source-lock CI.

**Architecture:** Keep `requirements.txt` as the Transformers 5 training lane and `requirements-export.txt` as the isolated Transformers 4 ONNX-export lane. Exclude the exporter manifests from the shared pip Dependabot scan because the two lanes intentionally reuse dependency names with incompatible major-version ranges. Protect the boundary with a focused pytest regression test.

**Tech Stack:** GitHub Dependabot YAML, Python 3.14, uv 0.11.29, pytest, hash-pinned requirements.

## Global Constraints

- Training remains on Hub 1.x and Transformers 5.x.
- Export remains on Hub 0.x, Optimum 2.1.x, and Transformers 4.57.x.
- Locks are generated with `uv pip compile --python-version 3.14 --generate-hashes`.
- The existing `.github/workflows/ml.test.yml` commands remain unchanged.

---

### Task 1: Add the regression test

**Files:** Create `ml/profile-qa/tests/test_dependency_policy.py`.

- [ ] **Step 1: Write the failing tests**

```python
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
        "onnxruntime>=1.28.0",
        "optimum[onnxruntime]>=2.1.0,<2.2",
        "safetensors>=0.8.0",
        "sentencepiece>=0.2.2",
        "torch>=2.13.0",
        "transformers>=4.57.6,<4.58",
    ]
```

- [ ] **Step 2: Verify RED**

Run `PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests/test_dependency_policy.py -q`; it must fail because the current Dependabot config has no exporter exclusions.

- [ ] **Step 3: Commit the test**

```bash
git add ml/profile-qa/tests/test_dependency_policy.py
git commit -m "test: protect ML dependency lanes"
```

### Task 2: Fix Dependabot scope and source manifests

**Files:** Modify `.github/dependabot.yml`, `ml/profile-qa/requirements.txt`, and `ml/profile-qa/requirements-export.txt`.

- [ ] **Step 1: Exclude exporter manifests from the pip updater**

Under the existing `/ml/profile-qa` pip entry, add a comment and:

```yaml
    exclude-paths:
      - "requirements-export.txt"
      - "requirements-export.lock"
```

- [ ] **Step 2: Refresh training minimums**

Set the training manifest entries to `huggingface-hub>=1.27.0` and `transformers>=5.15.0`.

- [ ] **Step 3: Refresh the compatible exporter lane**

Keep Hub and Transformers in their existing compatibility ranges and keep Optimum at `optimum[onnxruntime]>=2.1.0,<2.2`, the range compatible with the exporter's Transformers 4.57.x lane.

- [ ] **Step 4: Verify GREEN**

Run `PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests/test_dependency_policy.py -q`; expect 2 passed.

- [ ] **Step 5: Commit the source/config change**

```bash
git add .github/dependabot.yml ml/profile-qa/requirements.txt ml/profile-qa/requirements-export.txt
git commit -m "fix: separate ML dependency update lanes"
```

### Task 3: Regenerate the locks

**Files:** Modify `ml/profile-qa/requirements.lock` and `ml/profile-qa/requirements-export.lock`.

- [ ] **Step 1: Install the pinned compiler**

Run `python -m pip install uv==0.11.29`.

- [ ] **Step 2: Generate both locks**

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements.lock \
  ml/profile-qa/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements-export.lock \
  ml/profile-qa/requirements-export.txt
```

Both commands must resolve; the training lock must contain Transformers 5.15.x and the exporter lock must contain Optimum 2.1.x with Transformers 4.57.x.

- [ ] **Step 3: Verify deterministic regeneration**

Run both compile commands a second time, then:

```bash
git diff --exit-code -- ml/profile-qa/requirements.lock ml/profile-qa/requirements-export.lock
```

Expect exit code 0.

- [ ] **Step 4: Commit the generated locks**

```bash
git add ml/profile-qa/requirements.lock ml/profile-qa/requirements-export.lock
git commit -m "chore: refresh ML dependency locks"
```

### Task 4: Validate and publish

**Files:** Verify the complete branch against `.github/workflows/ml.test.yml` and `AGENTS.md`.

- [ ] **Step 1: Run ML tests**

Run `PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests`; expect all tests to pass.

- [ ] **Step 2: Run hygiene checks**

Run `git diff --check` and `git diff --check origin/main...HEAD`; expect no errors.

- [ ] **Step 3: Review scope**

Run `git status --short --branch && git diff --stat origin/main...HEAD`; only the plan, regression test, Dependabot config, two source manifests, and two generated locks may be changed.

- [ ] **Step 4: Publish**

Push `agent/fix-ml-lock-dependency-lane` and open a draft PR against `main` titled `fix: separate ML dependency update lanes`. The body must explain the resolver failure, the two dependency lanes, and the observed validation commands.

- [ ] **Step 5: Monitor current-head CI**

Inspect Profile-QA Tests, Lint, Playwright Tests, reviews, and comments. Fix any actionable current-head failure before reporting the PR.
