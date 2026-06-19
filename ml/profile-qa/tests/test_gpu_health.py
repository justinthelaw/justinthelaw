from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from profile_qa.gpu_health import _check_nvidia_devices, _check_torch_cuda


@dataclass(frozen=True)
class FakeDeviceProperties:
    total_memory: int


class FakeCuda:
    def __init__(self, available: bool, total_memory: int = 8 * 1024**3) -> None:
        self.available = available
        self.total_memory = total_memory

    def is_available(self) -> bool:
        return self.available

    def get_device_name(self, _index: int) -> str:
        return "NVIDIA RTX 4070 Laptop GPU"

    def get_device_properties(self, _index: int) -> FakeDeviceProperties:
        return FakeDeviceProperties(total_memory=self.total_memory)


class FakeTorch:
    def __init__(self, cuda: FakeCuda) -> None:
        self.cuda = cuda


def test_nvidia_devices_fail_when_device_nodes_are_missing() -> None:
    check = _check_nvidia_devices(lambda _pattern: [])

    assert check.ok is False
    assert "/dev/nvidia" in check.message


def test_nvidia_devices_fail_with_capability_nodes_only() -> None:
    check = _check_nvidia_devices(lambda _pattern: ["/dev/nvidia-caps"])

    assert check.ok is False
    assert "/dev/nvidia0" in check.message


def test_nvidia_devices_pass_with_control_and_gpu_nodes() -> None:
    check = _check_nvidia_devices(
        lambda _pattern: ["/dev/nvidia0", "/dev/nvidiactl", "/dev/nvidia-uvm"]
    )

    assert check.ok is True
    assert "/dev/nvidia0" in check.message


def test_torch_cuda_fails_when_cuda_is_unavailable() -> None:
    checks = _check_torch_cuda(FakeTorch(FakeCuda(False)), min_vram_gb=7.0)

    assert checks[0].ok is False
    assert "is false" in checks[0].message


def test_torch_cuda_reports_vram_for_8gb_gpu() -> None:
    checks = _check_torch_cuda(FakeTorch(FakeCuda(True)), min_vram_gb=7.0)

    assert [check.ok for check in checks] == [True, True]
    assert "4070" in checks[0].message
    assert "8.0 GB" in checks[1].message
