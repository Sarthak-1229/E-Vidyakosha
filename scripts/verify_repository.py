#!/usr/bin/env python3
"""Verify backend traceability and keep private files out of Git."""
import argparse
import hashlib
from pathlib import Path, PurePosixPath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REQUIREMENTS = {f"FR-{i:02d}" for i in range(1, 13)}
REQUIRED_FILES = (
    "README.md", "AGENTS.md", "GEMINI.md", "spec/openapi.yaml", "package-lock.json",
    "packages/shared/src/index.ts", "apps/api/src/app.ts", "apps/web/src/App.tsx",
    "docs/02-REQUIREMENTS.md", "docs/06-TEST-MATRIX.md", "docs/12-BACKEND-TRACEABILITY.md",
    "apps/api/tests/api.integration.ts",
)


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def read(relative):
    return (ROOT / relative).read_text(encoding="utf-8")


def is_private(relative):
    path = PurePosixPath(relative)
    filename = path.name.casefold()
    reference = path.parts[:2] == ("docs", "reference")
    return (reference and path.suffix.casefold() in {".pdf", ".txt"}) or (
        (filename == ".env" or filename.startswith(".env.")) and filename != ".env.example"
    )


def verify_tracking():
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8")
    private = [path for path in tracked.split("\0") if path and is_private(path)]
    require(not private, "Private files in Git index: " + ", ".join(private))


def verify_sources():
    sources = sorted((ROOT / "docs/reference").glob("*.pdf"))
    texts = sorted((ROOT / "docs/reference/extracted").glob("*.txt"))
    require(len(sources) == len(texts) == 8,
            f"Expected 8 private PDFs and 8 extracts, found {len(sources)} PDFs and {len(texts)} extracts")
    require({source.stem for source in sources} == {extract.stem for extract in texts},
            "Private PDF and extract names differ")
    for source in sources:
        print(source.name, hashlib.sha256(source.read_bytes()).hexdigest()[:16])
    print("PASS: 8 private PDFs and 8 extracts verified locally")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ci", action="store_true", help="Run tracked-file gates without local-only sources")
    args = parser.parse_args()

    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    require(not missing, "Missing files: " + ", ".join(missing))
    verify_tracking()

    for path in ("docs/02-REQUIREMENTS.md", "docs/06-TEST-MATRIX.md", "docs/12-BACKEND-TRACEABILITY.md"):
        rows = {"FR-" + number for number in re.findall(r"^\| (?:FR-)?(\d{2})\b", read(path), flags=re.MULTILINE)}
        require(rows == REQUIREMENTS, f"Incomplete requirement rows in {path}")
    tested = set(re.findall(r"FR-\d{2}", read("apps/api/tests/api.integration.ts")))
    require(tested == REQUIREMENTS, "Integration suite must identify evidence for all 12 FRs")

    api = read("spec/openapi.yaml")
    traced = set(re.findall(r"`([a-z][A-Za-z]+)`", read("docs/12-BACKEND-TRACEABILITY.md")))
    defined = set(re.findall(r"^      operationId: (\w+)$", api, flags=re.MULTILINE))
    require(defined - {"getHealth"} == traced, "Traceability table and OpenAPI operation IDs differ")
    print(f"PASS: 12 FRs, {len(defined)} API operations and private-file tracking checks")

    if not args.ci:
        verify_sources()
        try:
            import yaml
        except ImportError:
            print("Run npm test for OpenAPI 3.1 validation")
        else:
            doc = yaml.safe_load(api)
            require(doc["openapi"] == "3.1.0", "Unexpected OpenAPI version")
            print(f"PASS: parsed OpenAPI with {len(doc['paths'])} route templates")


if __name__ == "__main__":
    main()
