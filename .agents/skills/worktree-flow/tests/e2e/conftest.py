"""E2E test fixtures for container runtime testing.

Provides pytest fixtures for container runtime e2e tests.
Tests require both Docker and Podman to be installed.
"""

import shutil
import subprocess
from collections.abc import Generator
from pathlib import Path

import pytest

from worktree_flow.lib.container_runtime import ContainerRuntime, get_runtime


def _check_docker_available() -> None:
    """Verify Docker is available, raise if not."""
    if not shutil.which("docker"):
        raise RuntimeError("Docker is not installed")


def _check_podman_available() -> None:
    """Verify Podman and podman-compose are available, raise if not."""
    if not shutil.which("podman"):
        raise RuntimeError("Podman is not installed")
    if not shutil.which("podman-compose"):
        raise RuntimeError(
            "podman-compose is not installed. "
            "Install with: pip install podman-compose"
        )


def _check_podman_rootless() -> None:
    """Verify Podman is running in rootless mode, raise if not."""
    _check_podman_available()
    result = subprocess.run(
        ["podman", "info", "--format", "{{.Host.Security.Rootless}}"],
        capture_output=True,
        text=True,
        timeout=5,
    )
    if result.stdout.strip().lower() != "true":
        raise RuntimeError("Podman is not running in rootless mode")


@pytest.fixture
def docker_runtime() -> ContainerRuntime:
    """Get Docker runtime. Fails if Docker is not available."""
    _check_docker_available()
    runtime = ContainerRuntime.detect("docker")
    assert runtime is not None, "Docker detected but ContainerRuntime.detect failed"
    return runtime


@pytest.fixture
def podman_runtime() -> ContainerRuntime:
    """Get Podman runtime. Fails if Podman/podman-compose is not available."""
    _check_podman_available()
    runtime = ContainerRuntime.detect("podman")
    assert runtime is not None, "Podman detected but ContainerRuntime.detect failed"
    return runtime


@pytest.fixture
def podman_rootless_runtime() -> ContainerRuntime:
    """Get Podman runtime in rootless mode. Fails if not available."""
    _check_podman_rootless()
    runtime = ContainerRuntime.detect("podman")
    assert runtime is not None, "Podman rootless detected but ContainerRuntime.detect failed"
    return runtime


@pytest.fixture
def test_compose_dir() -> Path:
    """Path to test compose files."""
    return Path(__file__).parent.parent.parent / "docker"


@pytest.fixture
def compose_cleanup(test_compose_dir: Path) -> Generator[None, None, None]:
    """Ensure compose services are cleaned up after test."""
    yield
    # Cleanup with both runtimes (whichever is available)
    for runtime_pref in ("docker", "podman"):
        runtime = get_runtime(runtime_pref)
        if runtime:
            runtime.compose_down(test_compose_dir, timeout=30)
