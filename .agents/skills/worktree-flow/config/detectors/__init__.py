"""Project pattern detection for worktree-flow configuration."""

from pathlib import Path

from .base import DetectionResult, ProjectDetectionResults
from .build_tools import BuildToolDetector
from .infrastructure import InfrastructureDetector
from .package_managers import PackageManagerDetector


def run_all_detectors(project_root: Path) -> ProjectDetectionResults:
    """Run all detectors and return combined results."""
    results = ProjectDetectionResults()

    detectors = [
        PackageManagerDetector(),
        BuildToolDetector(),
        InfrastructureDetector(),
    ]

    for detector in detectors:
        result = detector.detect(project_root)
        results.add_result(detector.name, result)

    return results


__all__ = [
    "DetectionResult",
    "ProjectDetectionResults",
    "run_all_detectors",
    "PackageManagerDetector",
    "BuildToolDetector",
    "InfrastructureDetector",
]
