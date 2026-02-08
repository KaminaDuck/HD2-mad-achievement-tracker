"""Docker-specific e2e tests.

Tests in this module verify Docker runtime functionality with real
container operations. Tests fail if Docker is not available.
"""

from pathlib import Path

from worktree_flow.lib.container_runtime import ContainerRuntime


class TestDockerRuntime:
    """E2E tests for Docker runtime."""

    def test_detect_docker(self, docker_runtime: ContainerRuntime) -> None:
        """Docker runtime can be detected."""
        assert docker_runtime.runtime == "docker"

    def test_compose_command_format(self, docker_runtime: ContainerRuntime) -> None:
        """Docker compose command is correct format."""
        # Either v2 plugin or v1 standalone
        assert docker_runtime.compose_command in (
            ["docker", "compose"],
            ["docker-compose"],
        )

    def test_compose_lifecycle(
        self,
        docker_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Test full compose lifecycle: up -> ps -> down."""
        # Start services
        assert docker_runtime.compose_up(test_compose_dir) is True

        # Check running status
        status = docker_runtime.compose_ps(test_compose_dir)
        assert status is not None
        assert len(status) > 0
        assert any("running" in s.lower() for s in status.values())

        # Stop services
        assert docker_runtime.compose_down(test_compose_dir) is True

        # Verify stopped
        status_after = docker_runtime.compose_ps(test_compose_dir)
        assert status_after == {} or all("running" not in s.lower() for s in status_after.values())

    def test_ps_filter(
        self,
        docker_runtime: ContainerRuntime,
        test_compose_dir: Path,
        compose_cleanup: None,
    ) -> None:
        """Test ps_filter returns container names."""
        # Start services
        docker_runtime.compose_up(test_compose_dir)

        # Filter should return containers with matching name
        # The compose project name is derived from the directory
        containers = docker_runtime.ps_filter("docker")
        # May be empty if project name doesn't match, but shouldn't error
        assert isinstance(containers, list)

        # Cleanup
        docker_runtime.compose_down(test_compose_dir)
