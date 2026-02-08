"""Podman-specific e2e tests.

Tests in this module verify Podman runtime functionality with real
container operations, including rootless mode testing.
Tests fail if Podman/podman-compose is not available.
"""

import subprocess
from pathlib import Path

from worktree_flow.lib.container_runtime import ContainerRuntime


class TestPodmanRuntime:
    """E2E tests for Podman runtime."""

    def test_detect_podman(self, podman_runtime: ContainerRuntime) -> None:
        """Podman runtime can be detected."""
        assert podman_runtime.runtime == "podman"

    def test_compose_command_format(self, podman_runtime: ContainerRuntime) -> None:
        """Podman compose command is podman-compose (standalone tool)."""
        # We only support podman-compose, not the podman compose wrapper
        assert podman_runtime.compose_command == ["podman-compose"]

    def test_compose_lifecycle(
        self,
        podman_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Test full compose lifecycle with Podman."""
        # Start services
        assert podman_runtime.compose_up(test_compose_dir) is True

        # Check status
        status = podman_runtime.compose_ps(test_compose_dir)
        assert status is not None
        assert len(status) > 0

        # Stop
        assert podman_runtime.compose_down(test_compose_dir) is True

    def test_ps_filter(
        self,
        podman_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Test ps_filter returns container names with Podman."""
        # Start services
        podman_runtime.compose_up(test_compose_dir)

        # Filter should work without error
        containers = podman_runtime.ps_filter("docker")
        assert isinstance(containers, list)

        # Cleanup
        podman_runtime.compose_down(test_compose_dir)


class TestPodmanRootless:
    """E2E tests specific to rootless Podman mode."""

    def test_rootless_compose_works(
        self,
        podman_rootless_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Rootless Podman can run compose services."""
        # The Containerfile uses port 8080 (>=1024) for rootless compat
        result = podman_rootless_runtime.compose_up(test_compose_dir)
        assert result is True

        # Verify container is running
        status = podman_rootless_runtime.compose_ps(test_compose_dir)
        assert status is not None
        assert len(status) > 0

    def test_rootless_user_namespace(
        self,
        podman_rootless_runtime: ContainerRuntime,
    ) -> None:
        """Rootless mode uses user namespaces correctly."""
        result = subprocess.run(
            ["podman", "info", "--format", "{{.Host.Security.Rootless}}"],
            capture_output=True,
            text=True,
        )
        assert result.stdout.strip().lower() == "true"

    def test_rootless_no_privileged_ports(
        self,
        podman_rootless_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Verify rootless container uses non-privileged port."""
        # Start the service
        podman_rootless_runtime.compose_up(test_compose_dir)

        # The compose.yaml binds to port 8080 which is >= 1024
        # This should work in rootless mode
        status = podman_rootless_runtime.compose_ps(test_compose_dir)
        assert status is not None
        # At least one container should be running
        assert any("running" in s.lower() for s in status.values())
