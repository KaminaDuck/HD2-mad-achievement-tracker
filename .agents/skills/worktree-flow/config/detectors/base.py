"""Base detector interface for project pattern detection."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class DetectionResult:
    """Result of a detection check.

    Attributes:
        detected: Whether the pattern was found.
        confidence: Detection confidence from 0.0 (uncertain) to 1.0 (certain).
            - 1.0: Unambiguous indicator (e.g., lock file exists)
            - 0.9: Strong indicator (e.g., config file present)
            - 0.7: Moderate indicator (e.g., inferred from package.json)
            - 0.5: Weak indicator (e.g., heuristic match)
        details: Key-value pairs with detection specifics.
        suggestions: Configuration suggestions based on detection.
    """

    detected: bool
    confidence: float  # 0.0 to 1.0
    details: dict[str, str] = field(default_factory=dict)
    suggestions: list[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.detected


@dataclass
class ProjectDetectionResults:
    """Combined results from all detectors."""

    results: dict[str, DetectionResult] = field(default_factory=dict)

    def add_result(self, name: str, result: DetectionResult) -> None:
        self.results[name] = result

    def get(self, name: str) -> DetectionResult | None:
        return self.results.get(name)

    def has(self, name: str) -> bool:
        result = self.results.get(name)
        return result.detected if result else False

    def all_suggestions(self) -> list[str]:
        suggestions = []
        for result in self.results.values():
            suggestions.extend(result.suggestions)
        return suggestions

    def summary(self) -> dict[str, bool]:
        return {name: result.detected for name, result in self.results.items()}

    # Convenience accessors for common queries

    def has_docker(self) -> bool:
        """Check if Docker/Compose is detected."""
        infra = self.get("infrastructure")
        return bool(infra and "docker" in infra.details)

    def has_typescript(self) -> bool:
        """Check if TypeScript is detected."""
        infra = self.get("infrastructure")
        return bool(infra and "typescript" in infra.details)

    def has_python(self) -> bool:
        """Check if Python is detected."""
        infra = self.get("infrastructure")
        return bool(infra and "python" in infra.details)

    def has_make(self) -> bool:
        """Check if Makefile is detected."""
        build = self.get("build_tools")
        return bool(build and "make" in build.details)

    def has_turbo(self) -> bool:
        """Check if Turborepo is detected."""
        build = self.get("build_tools")
        return bool(build and "turbo" in build.details)

    def get_makefile_targets(self) -> list[str]:
        """Get list of detected Makefile targets."""
        build = self.get("build_tools")
        if build and "makefile_targets" in build.details:
            return build.details["makefile_targets"].split(",")
        return []

    def get_primary_package_manager(self) -> str | None:
        """Get the primary package manager (bun > pnpm > yarn > npm)."""
        pkg = self.get("package_managers")
        if not pkg:
            return None
        # Priority order
        for manager in ["bun", "pnpm", "yarn", "npm"]:
            if manager in pkg.details:
                return manager
        return None


class BaseDetector(ABC):
    """Base class for project pattern detectors."""

    name: str
    description: str

    @abstractmethod
    def detect(self, project_root: Path) -> DetectionResult:
        """Run detection logic and return result."""

    def _check_file_exists(self, project_root: Path, filename: str) -> bool:
        return (project_root / filename).exists()

    def _check_any_file_exists(self, project_root: Path, filenames: list[str]) -> str | None:
        for filename in filenames:
            if (project_root / filename).exists():
                return filename
        return None
