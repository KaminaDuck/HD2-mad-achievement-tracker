"""E2E tests for compose operations across runtimes.

These tests verify the high-level service functions work correctly
with auto-detected container runtimes. Tests fail if no runtime is available.
"""

import time
import urllib.error
import urllib.request
from collections.abc import Generator
from pathlib import Path

import pytest

from worktree_flow.lib.container_runtime import ContainerRuntime, get_runtime
from worktree_flow.lib.services import compose_down, get_container_status


def _require_runtime() -> ContainerRuntime:
    """Get a container runtime, failing if none available."""
    runtime = get_runtime()
    if runtime is None:
        raise RuntimeError(
            "No container runtime available. "
            "Install Docker or Podman with podman-compose."
        )
    return runtime


class TestComposeOperations:
    """Test compose operations with auto-detected runtime."""

    @pytest.fixture(autouse=True)
    def cleanup(self, test_compose_dir: Path) -> Generator[None, None, None]:
        """Cleanup after each test."""
        yield
        compose_down(test_compose_dir)

    def test_auto_detection_works(self) -> None:
        """Auto-detection returns a valid runtime."""
        runtime = _require_runtime()
        assert runtime.runtime in ("docker", "podman")

    def test_get_container_status_integration(
        self,
        test_compose_dir: Path,
    ) -> None:
        """get_container_status works with real containers."""
        runtime = _require_runtime()

        # Start
        runtime.compose_up(test_compose_dir)
        time.sleep(2)  # Allow startup

        # Check status via service function
        status = get_container_status(test_compose_dir)
        assert status is not None

    def test_compose_down_integration(
        self,
        test_compose_dir: Path,
    ) -> None:
        """compose_down function stops services."""
        runtime = _require_runtime()

        # Start
        runtime.compose_up(test_compose_dir)
        time.sleep(2)

        # Stop via service function
        result = compose_down(test_compose_dir)
        assert result is True

        # Verify stopped
        status = get_container_status(test_compose_dir)
        if status:
            assert all("running" not in s.lower() for s in status.values())

    def test_health_endpoint_reachable(
        self,
        test_compose_dir: Path,
    ) -> None:
        """Container health endpoint responds after compose up."""
        runtime = _require_runtime()

        runtime.compose_up(test_compose_dir)

        # Wait for container to be healthy
        max_retries = 15
        for _ in range(max_retries):
            try:
                req = urllib.request.Request(
                    "http://localhost:8080/health",
                    method="GET",
                )
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        return  # Success
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            time.sleep(1)

        pytest.fail("Health endpoint not reachable after compose up")

    def test_root_endpoint_returns_service_info(
        self,
        test_compose_dir: Path,
    ) -> None:
        """Root endpoint returns service information."""
        runtime = _require_runtime()

        runtime.compose_up(test_compose_dir)

        # Wait for container to be healthy
        max_retries = 15
        for _ in range(max_retries):
            try:
                req = urllib.request.Request(
                    "http://localhost:8080/",
                    method="GET",
                )
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        data = resp.read().decode()
                        assert "worktree-flow-test" in data
                        return  # Success
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            time.sleep(1)

        pytest.fail("Root endpoint not reachable after compose up")
