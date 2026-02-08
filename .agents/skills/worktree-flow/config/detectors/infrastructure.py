"""Detect infrastructure: Docker, dev servers, frameworks."""

import re
from pathlib import Path

from .base import BaseDetector, DetectionResult


class InfrastructureDetector(BaseDetector):
    """Detect Docker, dev servers, and frameworks."""

    name = "infrastructure"
    description = "Detect Docker, dev servers, and frameworks"

    DOCKER_FILES = [
        "docker-compose.yml",
        "docker-compose.yaml",
        "compose.yml",
        "compose.yaml",
        "Dockerfile",
    ]

    DEV_SERVER_CONFIGS: dict[str, list[str]] = {
        "vite": ["vite.config.ts", "vite.config.js", "vite.config.mts"],
        "next": ["next.config.js", "next.config.ts", "next.config.mjs"],
        "webpack": ["webpack.config.js", "webpack.config.ts"],
        "parcel": [".parcelrc"],
        "rollup": ["rollup.config.js", "rollup.config.ts"],
    }

    FRAMEWORK_INDICATORS: dict[str, list[str]] = {
        "typescript": ["tsconfig.json"],
        "react": [],  # Check package.json
        "python": ["pyproject.toml", "setup.py", "setup.cfg"],
        "go": ["go.mod"],
        "rust": ["Cargo.toml"],
    }

    # Common monorepo directory structures
    MONOREPO_PATHS = ["ts", "packages", "apps", "src", "libs"]

    DEFAULT_PORTS: dict[str, int] = {
        "vite": 5173,
        "next": 3000,
        "webpack": 8080,
        "parcel": 1234,
    }

    def detect(self, project_root: Path) -> DetectionResult:
        detected: dict[str, str] = {}

        # Check Docker
        docker_file = self._check_any_file_exists(project_root, self.DOCKER_FILES)
        if docker_file:
            detected["docker"] = docker_file
            compose_services = self._parse_docker_compose(project_root, docker_file)
            if compose_services:
                detected["docker_services"] = ",".join(compose_services)

        # Check dev servers
        for server, configs in self.DEV_SERVER_CONFIGS.items():
            config_file = self._check_any_file_exists(project_root, configs)
            if config_file:
                detected[f"dev_server_{server}"] = config_file
                port = self._detect_dev_server_port(project_root, config_file, server)
                if port:
                    detected[f"{server}_port"] = str(port)

        # Check frameworks
        for framework, indicators in self.FRAMEWORK_INDICATORS.items():
            if framework == "typescript":
                # Use monorepo-aware TypeScript detection
                ts_file = self._check_typescript_monorepo(project_root)
                if ts_file:
                    detected[framework] = ts_file
            elif indicators:
                indicator_file = self._check_any_file_exists(project_root, indicators)
                if indicator_file:
                    detected[framework] = indicator_file

        # Check package.json for React/Vue/etc
        package_frameworks = self._check_package_json(project_root)
        detected.update(package_frameworks)

        suggestions = self._generate_suggestions(detected)

        return DetectionResult(
            detected=bool(detected),
            confidence=0.85 if detected else 0.0,
            details=detected,
            suggestions=suggestions,
        )

    def _parse_docker_compose(self, project_root: Path, compose_file: str) -> list[str]:
        """Extract service names from docker-compose file."""
        compose_path = project_root / compose_file
        if not compose_path.exists() or "Dockerfile" in compose_file:
            return []

        content = compose_path.read_text()

        # Simple regex to find service names under 'services:'
        services = []
        in_services = False
        for line in content.split("\n"):
            if line.strip() == "services:":
                in_services = True
                continue
            if in_services:
                # Service name is indented with 2 spaces and ends with ':'
                match = re.match(r"^  ([a-zA-Z_][a-zA-Z0-9_-]*):", line)
                if match:
                    services.append(match.group(1))
                # Stop if we hit another top-level key
                elif line and not line.startswith(" ") and ":" in line:
                    break

        return services

    def _detect_dev_server_port(
        self, project_root: Path, config_file: str, server: str
    ) -> int | None:
        """Try to detect configured port from dev server config."""
        config_path = project_root / config_file
        if not config_path.exists():
            return self.DEFAULT_PORTS.get(server)

        content = config_path.read_text()

        # Look for port configuration patterns
        port_patterns = [
            r"port\s*:\s*(\d+)",
            r"port\s*=\s*(\d+)",
            r'"port"\s*:\s*(\d+)',
        ]

        for pattern in port_patterns:
            match = re.search(pattern, content)
            if match:
                return int(match.group(1))

        return self.DEFAULT_PORTS.get(server)

    def _check_typescript_monorepo(self, project_root: Path) -> str | None:
        """Check for tsconfig.json in project root or common monorepo locations.

        Supports monorepo structures where tsconfig.json is in subdirectories
        like ts/, packages/, apps/, src/, or libs/.
        """
        # First check root
        if (project_root / "tsconfig.json").exists():
            return "tsconfig.json"

        # Check common monorepo directories
        for subdir in self.MONOREPO_PATHS:
            path = project_root / subdir
            if path.exists() and path.is_dir():
                # Check for tsconfig.json directly in subdir
                if (path / "tsconfig.json").exists():
                    return str((path / "tsconfig.json").relative_to(project_root))
                # Check one level deeper (e.g., packages/core/tsconfig.json)
                for tsconfig in path.glob("*/tsconfig.json"):
                    return str(tsconfig.relative_to(project_root))
                # Check two levels deeper (e.g., ts/apps/server/tsconfig.json)
                for tsconfig in path.glob("*/*/tsconfig.json"):
                    return str(tsconfig.relative_to(project_root))
        return None

    def _check_package_json(self, project_root: Path) -> dict[str, str]:
        """Check package.json for framework dependencies.

        Returns:
            Dict of detected frameworks (e.g., {"react": "package.json"}).
        """
        detected: dict[str, str] = {}
        package_json = project_root / "package.json"
        if not package_json.exists():
            return detected

        content = package_json.read_text()

        framework_deps = {
            "react": ['"react":', '"@types/react":'],
            "vue": ['"vue":'],
            "svelte": ['"svelte":'],
            "angular": ['"@angular/core":'],
        }

        for framework, deps in framework_deps.items():
            for dep in deps:
                if dep in content:
                    detected[framework] = "package.json"
                    break

        return detected

    def _generate_suggestions(self, detected: dict[str, str]) -> list[str]:
        suggestions = []

        # Docker suggestions
        if "docker" in detected:
            suggestions.append("enable_services: true")
            if "docker_services" in detected:
                services = detected["docker_services"]
                suggestions.append(f"docker_services: {services}")

        # Dev server port suggestions
        for key, value in detected.items():
            if key.endswith("_port"):
                server = key.replace("_port", "")
                suggestions.append(f"webui_port_base: {value}")
                suggestions.append(f"dev_server: {server}")
                break

        # TypeScript suggestions
        if "typescript" in detected:
            suggestions.append("typecheck_command: npx tsc --noEmit")

        # Python suggestions
        if "python" in detected:
            suggestions.append("typecheck_command: uv run mypy .")
            suggestions.append("lint_command: uv run ruff check .")
            suggestions.append("test_command: uv run pytest")

        return suggestions
