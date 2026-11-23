#!/usr/bin/env python3
"""Offline, dependency-light source and contract sanity checks."""
from pathlib import Path
import hashlib
import re
import sys

root = Path(__file__).resolve().parents[1]
required = [
    'README.md', 'AGENTS.md', 'GEMINI.md', 'spec/openapi.yaml',
    'packages/shared/src/index.ts', 'apps/api/src/app.ts', 'apps/web/src/App.tsx',
    'docs/02-REQUIREMENTS.md', 'docs/06-TEST-MATRIX.md',
]
missing = [str(x) for x in required if not (root / x).is_file()]
if missing:
    print('MISSING FILES:', ', '.join(missing))
    sys.exit(1)

sources = sorted((root / 'docs/reference').glob('*.pdf'))
texts = sorted((root / 'docs/reference/extracted').glob('*.txt'))
if len(sources) != 8 or len(texts) != 8:
    print(f'Expected 8 PDFs + 8 extracted texts; found {len(sources)} + {len(texts)}')
    sys.exit(1)

req = (root / 'docs/02-REQUIREMENTS.md').read_text()
assert all(f'FR-{i:02d}' in req for i in range(1, 13))
api = (root / 'spec/openapi.yaml').read_text()
assert all(f'/approvals/' in api and f'/documents/' in api for _ in range(1))
assert 'QUESTION_PAPER' in api and 'application/pdf' in api

print('PASS: required files, 8 sources, 8 extracted texts, 12 FRs, API markers present')
for src in sources:
    print(src.name, hashlib.sha256(src.read_bytes()).hexdigest()[:16])
try:
    import yaml
except ImportError:
    print('OpenAPI YAML parse skipped: PyYAML not installed (optional offline check)')
else:
    doc = yaml.safe_load(api)
    assert doc['openapi'] == '3.1.0'
    assert len(doc['paths']) >= 12
    print(f"PASS: parsed OpenAPI with {len(doc['paths'])} route templates")
