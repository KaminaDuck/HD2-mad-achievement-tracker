"""Detect build tools: Make, turbo, nx, gradle, cargo."""

import re
from pathlib import Path

from .base import BaseDetector, DetectionResult


class BuildToolDetector(BaseDetector):
    """Detect build tools and task runners."""

    name = "build_tools"
    description = "Detect build tools and task runners"

    INDICATORS: dict[str, list[str]] = {
        "make": ["Makefile", "makefile", "GNUmakefile"],
        "turbo": ["turbo.json"],
        "nx": ["nx.json"],
        "gradle": ["build.gradle", "build.gradle.kts", "gradlew"],
        "maven": ["pom.xml"],
        "just": ["justfile", "Justfile"],
    }

    def detect(self, project_root: Path) -> DetectionResult:
        detected: dict[str, str] = {}
        makefile_targets: list[str] = []

        for tool, files in self.INDICATORS.items():
            found_file = self._check_any_file_exists(project_root, files)
            if found_file:
                detected[tool] = found_file

        # Parse Makefile for common targets
        if "make" in detected:
            makefile_targets = self._parse_makefile_targets(project_root)
            if makefile_targets:
                detected["makefile_targets"] = ",".join(makefile_targets[:10])

        suggestions = self._generate_suggestions(detected, makefile_targets)

        return DetectionResult(
            detected=bool(detected),
            confidence=0.9 if detected else 0.0,
            details=detected,
            suggestions=suggestions,
        )

    def _parse_makefile_targets(self, project_root: Path) -> list[str]:
        """Extract target names from Makefile."""
        targets: list[str] = []
        makefile_path = project_root / "Makefile"

        if not makefile_path.exists():
            return targets

        content = makefile_path.read_text()

        # Match target definitions (name: or name::)
        target_pattern = re.compile(r"^([a-zA-Z_][a-zA-Z0-9_-]*)\s*::?", re.MULTILINE)
        matches = target_pattern.findall(content)

        # Filter out common internal targets
        internal_prefixes = (".", "_")
        targets = [t for t in matches if not t.startswith(internal_prefixes)]

        return targets

    def _generate_suggestions(
        self, detected: dict[str, str], makefile_targets: list[str]
    ) -> list[str]:
        suggestions = []

        # Suggest validation commands based on Makefile targets
        validation_targets = {
            "test": "test_command",
            "ts-test": "test_command",
            "lint": "lint_command",
            "ts-lint": "lint_command",
            "typecheck": "typecheck_command",
            "ts-typecheck": "typecheck_command",
            "validate": "validation_command",
            "check": "validation_command",
            "build": "build_command",
            "ts-build": "build_command",
            "dev": "dev_command",
        }

        for target, config_key in validation_targets.items():
            if target in makefile_targets:
                suggestions.append(f"{config_key}: make {target}")

        # Note turbo for monorepo support
        if "turbo" in detected:
            suggestions.append("monorepo: turbo detected")
            suggestions.append("build_command: turbo run build")
            suggestions.append("test_command: turbo run test")

        return suggestions
