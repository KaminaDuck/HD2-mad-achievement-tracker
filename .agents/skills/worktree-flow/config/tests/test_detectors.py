"""Tests for project pattern detectors."""

import tempfile
from pathlib import Path

from ..detectors import run_all_detectors
from ..detectors.base import DetectionResult, ProjectDetectionResults
from ..detectors.build_tools import BuildToolDetector
from ..detectors.infrastructure import InfrastructureDetector
from ..detectors.package_managers import PackageManagerDetector


class TestDetectionResult:
    """Test DetectionResult dataclass."""

    def test_bool_true_when_detected(self) -> None:
        result = DetectionResult(detected=True, confidence=0.9)
        assert bool(result) is True

    def test_bool_false_when_not_detected(self) -> None:
        result = DetectionResult(detected=False, confidence=0.0)
        assert bool(result) is False

    def test_details_and_suggestions(self) -> None:
        result = DetectionResult(
            detected=True,
            confidence=0.9,
            details={"npm": "package-lock.json"},
            suggestions=["npm install"],
        )
        assert result.details == {"npm": "package-lock.json"}
        assert result.suggestions == ["npm install"]


class TestProjectDetectionResults:
    """Test ProjectDetectionResults container."""

    def test_add_and_get_result(self) -> None:
        results = ProjectDetectionResults()
        result = DetectionResult(detected=True, confidence=0.9)
        results.add_result("test", result)
        assert results.get("test") == result

    def test_get_returns_none_for_missing(self) -> None:
        results = ProjectDetectionResults()
        assert results.get("missing") is None

    def test_has_method(self) -> None:
        results = ProjectDetectionResults()
        results.add_result(
            "detected", DetectionResult(detected=True, confidence=0.9)
        )
        results.add_result(
            "not_detected", DetectionResult(detected=False, confidence=0.0)
        )
        assert results.has("detected") is True
        assert results.has("not_detected") is False
        assert results.has("missing") is False

    def test_all_suggestions(self) -> None:
        results = ProjectDetectionResults()
        results.add_result(
            "a", DetectionResult(detected=True, confidence=0.9, suggestions=["s1"])
        )
        results.add_result(
            "b", DetectionResult(detected=True, confidence=0.9, suggestions=["s2", "s3"])
        )
        assert sorted(results.all_suggestions()) == ["s1", "s2", "s3"]

    def test_summary(self) -> None:
        results = ProjectDetectionResults()
        results.add_result("a", DetectionResult(detected=True, confidence=0.9))
        results.add_result("b", DetectionResult(detected=False, confidence=0.0))
        assert results.summary() == {"a": True, "b": False}


class TestProjectDetectionResultsAccessors:
    """Test convenience accessor methods."""

    def test_has_docker(self) -> None:
        results = ProjectDetectionResults()
        # No infrastructure result
        assert results.has_docker() is False

        # Infrastructure without docker
        results.add_result(
            "infrastructure",
            DetectionResult(detected=True, confidence=0.9, details={"typescript": "x"}),
        )
        assert results.has_docker() is False

        # Infrastructure with docker
        results.results["infrastructure"].details["docker"] = "docker-compose.yml"
        assert results.has_docker() is True

    def test_has_typescript(self) -> None:
        results = ProjectDetectionResults()
        results.add_result(
            "infrastructure",
            DetectionResult(
                detected=True, confidence=0.9, details={"typescript": "tsconfig.json"}
            ),
        )
        assert results.has_typescript() is True

    def test_has_make(self) -> None:
        results = ProjectDetectionResults()
        results.add_result(
            "build_tools",
            DetectionResult(detected=True, confidence=0.9, details={"make": "Makefile"}),
        )
        assert results.has_make() is True

    def test_get_makefile_targets(self) -> None:
        results = ProjectDetectionResults()
        results.add_result(
            "build_tools",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"make": "Makefile", "makefile_targets": "test,lint,build"},
            ),
        )
        assert results.get_makefile_targets() == ["test", "lint", "build"]

    def test_get_makefile_targets_empty(self) -> None:
        results = ProjectDetectionResults()
        assert results.get_makefile_targets() == []

    def test_get_primary_package_manager(self) -> None:
        results = ProjectDetectionResults()

        # No package managers
        assert results.get_primary_package_manager() is None

        # Multiple managers - should prefer bun
        results.add_result(
            "package_managers",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"npm": "x", "bun": "y", "pnpm": "z"},
            ),
        )
        assert results.get_primary_package_manager() == "bun"


class TestPackageManagerDetector:
    """Test PackageManagerDetector."""

    def test_detects_npm(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "package-lock.json").write_text("{}")

            detector = PackageManagerDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "npm" in result.details

    def test_detects_bun(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "bun.lockb").write_bytes(b"")

            detector = PackageManagerDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "bun" in result.details

    def test_detects_uv(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "uv.lock").write_text("")

            detector = PackageManagerDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "uv" in result.details

    def test_no_detection(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)

            detector = PackageManagerDetector()
            result = detector.detect(root)

            assert result.detected is False


class TestBuildToolDetector:
    """Test BuildToolDetector."""

    def test_detects_makefile(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "Makefile").write_text("test:\n\techo test\n")

            detector = BuildToolDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "make" in result.details
            assert "makefile_targets" in result.details
            assert "test" in result.details["makefile_targets"]

    def test_detects_turbo(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "turbo.json").write_text("{}")

            detector = BuildToolDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "turbo" in result.details


class TestInfrastructureDetector:
    """Test InfrastructureDetector."""

    def test_detects_docker(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "docker-compose.yml").write_text(
                "services:\n  server:\n    build: .\n"
            )

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "docker" in result.details
            assert "docker_services" in result.details
            assert "server" in result.details["docker_services"]

    def test_detects_typescript(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "tsconfig.json").write_text("{}")

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "typescript" in result.details

    def test_detects_python(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "pyproject.toml").write_text("[project]\nname = 'test'")

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "python" in result.details

    def test_detects_typescript_monorepo_ts_dir(self) -> None:
        """Test TypeScript detection in ts/ monorepo structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            # Create ts/apps/server/tsconfig.json structure
            ts_dir = root / "ts" / "apps" / "server"
            ts_dir.mkdir(parents=True)
            (ts_dir / "tsconfig.json").write_text("{}")

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "typescript" in result.details
            assert "ts/apps/server/tsconfig.json" in result.details["typescript"]

    def test_detects_typescript_monorepo_packages_dir(self) -> None:
        """Test TypeScript detection in packages/ monorepo structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            # Create packages/core/tsconfig.json structure
            pkg_dir = root / "packages" / "core"
            pkg_dir.mkdir(parents=True)
            (pkg_dir / "tsconfig.json").write_text("{}")

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert "typescript" in result.details
            assert "packages/core/tsconfig.json" in result.details["typescript"]

    def test_typescript_root_takes_priority(self) -> None:
        """Test that root tsconfig.json is preferred over monorepo paths."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            # Create both root and monorepo tsconfig
            (root / "tsconfig.json").write_text("{}")
            ts_dir = root / "ts" / "apps"
            ts_dir.mkdir(parents=True)
            (ts_dir / "tsconfig.json").write_text("{}")

            detector = InfrastructureDetector()
            result = detector.detect(root)

            assert result.detected is True
            assert result.details["typescript"] == "tsconfig.json"


class TestRunAllDetectors:
    """Test run_all_detectors integration."""

    def test_runs_all_detectors(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "package-lock.json").write_text("{}")
            (root / "Makefile").write_text("test:\n\techo test\n")
            (root / "tsconfig.json").write_text("{}")

            results = run_all_detectors(root)

            assert results.has("package_managers")
            assert results.has("build_tools")
            assert results.has("infrastructure")
