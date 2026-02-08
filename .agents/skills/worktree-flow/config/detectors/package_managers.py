"""Detect package managers: npm, pnpm, bun, yarn, uv, pip, cargo."""

import json
from pathlib import Path

from .base import BaseDetector, DetectionResult


class PackageManagerDetector(BaseDetector):
    """Detect package managers and lock files."""

    name = "package_managers"
    description = "Detect package managers and lock files"

    INDICATORS: dict[str, list[str]] = {
        "bun": ["bun.lockb", "bunfig.toml"],
        "pnpm": ["pnpm-lock.yaml", "pnpm-workspace.yaml"],
        "npm": ["package-lock.json"],
        "yarn": ["yarn.lock", ".yarnrc.yml"],
        "uv": ["uv.lock"],
        "pip": ["requirements.txt", "requirements-dev.txt"],
        "cargo": ["Cargo.lock", "Cargo.toml"],
    }

    INSTALL_COMMANDS: dict[str, str] = {
        "bun": "bun install",
        "pnpm": "pnpm install",
        "npm": "npm install",
        "yarn": "yarn install",
        "uv": "uv sync",
        "pip": "pip install -r requirements.txt",
        "cargo": "cargo build",
    }

    MONOREPO_SUBDIRS: list[str] = ["ts", "packages", "apps", "frontend", "backend"]

    def detect(self, project_root: Path) -> DetectionResult:
        detected: dict[str, str] = {}

        # Check root for lock files
        for manager, files in self.INDICATORS.items():
            found_file = self._check_any_file_exists(project_root, files)
            if found_file:
                detected[manager] = found_file

        # Check monorepo subdirectories for lock files
        for subdir in self.MONOREPO_SUBDIRS:
            subdir_path = project_root / subdir
            if subdir_path.is_dir():
                for manager, files in self.INDICATORS.items():
                    if manager not in detected:
                        found_file = self._check_any_file_exists(subdir_path, files)
                        if found_file:
                            detected[manager] = f"{subdir}/{found_file}"

        # Check packageManager field in package.json (root and subdirs)
        self._detect_package_manager_field(project_root, detected)

        # Check for pyproject.toml with [tool.uv] section
        pyproject = project_root / "pyproject.toml"
        if pyproject.exists() and "uv" not in detected:
            content = pyproject.read_text()
            if "[tool.uv]" in content or "[dependency-groups]" in content:
                detected["uv"] = "pyproject.toml"

        suggestions = self._generate_suggestions(detected)

        return DetectionResult(
            detected=bool(detected),
            confidence=0.95 if detected else 0.0,
            details=detected,
            suggestions=suggestions,
        )

    def _detect_package_manager_field(
        self, project_root: Path, detected: dict[str, str]
    ) -> None:
        """Check packageManager field in package.json files."""
        paths_to_check = [project_root] + [
            project_root / subdir
            for subdir in self.MONOREPO_SUBDIRS
            if (project_root / subdir).is_dir()
        ]

        for path in paths_to_check:
            pkg_json = path / "package.json"
            if not pkg_json.exists():
                continue

            try:
                data = json.loads(pkg_json.read_text())
            except (json.JSONDecodeError, OSError):
                continue

            pm_field = data.get("packageManager", "")
            if not pm_field:
                continue

            is_subdir = path != project_root
            relative = f"{path.name}/package.json" if is_subdir else "package.json"

            for manager in ("bun", "pnpm", "yarn", "npm"):
                if pm_field.startswith(manager) and manager not in detected:
                    detected[manager] = f"{relative} (packageManager)"
                    break

    def _generate_suggestions(self, detected: dict[str, str]) -> list[str]:
        suggestions = []

        # Prioritize modern package managers
        priority_order = ["bun", "pnpm", "uv", "yarn", "npm", "pip", "cargo"]

        for manager in priority_order:
            if manager in detected:
                cmd = self.INSTALL_COMMANDS[manager]
                suggestions.append(f"install_command: {cmd}")
                break

        # Note if multiple managers detected
        if len(detected) > 1:
            managers = ", ".join(detected.keys())
            suggestions.append(f"multiple_managers: {managers}")

        return suggestions
