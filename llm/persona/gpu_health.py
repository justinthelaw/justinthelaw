"""Fail-fast NVIDIA/CUDA health checks for local training."""

from __future__ import annotations

import argparse
import glob
import importlib
import json
import re
import subprocess
from collections.abc import Callable
from dataclasses import asdict, dataclass
from typing import Protocol


class TorchCudaLike(Protocol):
    def is_available(self) -> bool: ...

    def get_device_name(self, index: int) -> str: ...

    def get_device_properties(self, index: int) -> object: ...


class TorchLike(Protocol):
    cuda: TorchCudaLike


@dataclass(frozen=True)
class HealthCheck:
    name: str
    ok: bool
    message: str


@dataclass(frozen=True)
class HealthReport:
    ok: bool
    checks: list[HealthCheck]


def _run_nvidia_smi() -> HealthCheck:
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader",
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except FileNotFoundError:
        return HealthCheck("nvidia-smi", False, "nvidia-smi not found on PATH")
    except subprocess.TimeoutExpired:
        return HealthCheck("nvidia-smi", False, "nvidia-smi timed out")

    if result.returncode != 0:
        stderr = result.stderr.strip() or "nvidia-smi returned a non-zero status"
        return HealthCheck("nvidia-smi", False, stderr)

    summary = result.stdout.strip().splitlines()[0] if result.stdout.strip() else "GPU present"
    return HealthCheck("nvidia-smi", True, summary)


def _check_nvidia_devices(glob_func: Callable[[str], list[str]] = glob.glob) -> HealthCheck:
    devices = sorted(glob_func("/dev/nvidia*"))
    if not devices:
        return HealthCheck(
            "nvidia-devices",
            False,
            "no /dev/nvidia* devices are visible; run from the host or with NVIDIA passthrough",
        )
    has_control = "/dev/nvidiactl" in devices
    has_gpu = any(re.fullmatch(r"/dev/nvidia[0-9]+", device) for device in devices)
    if not has_control or not has_gpu:
        return HealthCheck(
            "nvidia-devices",
            False,
            (
                "NVIDIA capability nodes are visible, but /dev/nvidiactl and a "
                "GPU node such as /dev/nvidia0 are required for CUDA training"
            ),
        )
    return HealthCheck("nvidia-devices", True, ", ".join(devices))


def _import_torch(
    importer: Callable[[str], object] = importlib.import_module,
) -> tuple[HealthCheck, TorchLike | None]:
    try:
        module = importer("torch")
    except ImportError:
        return HealthCheck("torch-import", False, "PyTorch is not installed"), None

    return HealthCheck("torch-import", True, "PyTorch import succeeded"), module  # type: ignore[return-value]


def _check_torch_cuda(torch_module: TorchLike | None, min_vram_gb: float) -> list[HealthCheck]:
    if torch_module is None:
        return [
            HealthCheck(
                "torch-cuda",
                False,
                "skipped because PyTorch could not be imported",
            )
        ]

    if not torch_module.cuda.is_available():
        return [HealthCheck("torch-cuda", False, "torch.cuda.is_available() is false")]

    device_name = torch_module.cuda.get_device_name(0)
    props = torch_module.cuda.get_device_properties(0)
    total_memory = getattr(props, "total_memory", 0)
    total_gb = total_memory / 1024**3
    checks = [
        HealthCheck(
            "torch-cuda",
            True,
            f"CUDA device 0: {device_name} ({total_gb:.1f} GB)",
        )
    ]

    if total_gb < min_vram_gb:
        checks.append(
            HealthCheck(
                "vram",
                False,
                f"GPU has {total_gb:.1f} GB VRAM; expected at least {min_vram_gb:.1f} GB",
            )
        )
    else:
        checks.append(
            HealthCheck(
                "vram",
                True,
                f"GPU has {total_gb:.1f} GB VRAM; minimum is {min_vram_gb:.1f} GB",
            )
        )

    return checks


def collect_health_report(min_vram_gb: float = 7.0) -> HealthReport:
    """Collect NVIDIA and CUDA readiness checks."""

    checks: list[HealthCheck] = [_run_nvidia_smi(), _check_nvidia_devices()]
    torch_check, torch_module = _import_torch()
    checks.append(torch_check)
    checks.extend(_check_torch_cuda(torch_module, min_vram_gb))
    return HealthReport(ok=all(check.ok for check in checks), checks=checks)


def assert_gpu_ready(min_vram_gb: float = 7.0) -> HealthReport:
    """Return the health report or raise RuntimeError when any check fails."""

    report = collect_health_report(min_vram_gb=min_vram_gb)
    if not report.ok:
        failures = [f"{check.name}: {check.message}" for check in report.checks if not check.ok]
        raise RuntimeError("GPU health check failed:\n" + "\n".join(failures))
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--min-vram-gb", type=float, default=7.0)
    args = parser.parse_args()

    report = collect_health_report(min_vram_gb=args.min_vram_gb)
    print(json.dumps(asdict(report), indent=2))
    return 0 if report.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
