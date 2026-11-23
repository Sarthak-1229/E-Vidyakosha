import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Source-level guard so a bare scaffold can be checked before a TS loader exists.
const shared = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
test('role/status/type contract constants exist', () => {
  for (const token of ['STUDENT', 'FACULTY', 'ADMIN', 'PENDING', 'APPROVED', 'REJECTED', 'QUESTION_PAPER', '50 * 1024 * 1024']) {
    assert.ok(shared.includes(token));
  }
});
