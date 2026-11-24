import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword } from '../src/modules/auth/password.js';
import { safeFileName } from '../src/modules/file/service.js';
import { loadConfig } from '../src/lib/config.js';

test('requires valid configuration and never returns secrets in errors', () => {
  assert.throws(() => loadConfig({ JWT_SECRET: 'short-secret-example' }), /^Error: Invalid configuration for JWT_SECRET\.$/);
  assert.throws(() => loadConfig({ JWT_SECRET: 's'.repeat(32), MONGODB_URI: 'invalid-password' }), /MONGODB_URI/);
  assert.deepEqual(loadConfig({ JWT_SECRET: 's'.repeat(32), MONGODB_URI: 'mongodb://localhost/example' }), {
    mongoUri: 'mongodb://localhost/example', webOrigin: 'http://localhost:5173', port: 4000, jwtSecret: 's'.repeat(32),
  });
});

test('FR-02 password hashes are salted, verified and distinguish full Unicode passwords', async () => {
  const prefix = '💿'.repeat(30);
  const first = await hashPassword(prefix + 'A');
  const second = await hashPassword(prefix + 'A');
  assert.notEqual(first, second);
  assert.equal(first.includes(prefix), false);
  assert.equal(await verifyPassword(prefix + 'A', first), true);
  assert.equal(await verifyPassword(prefix + 'B', first), false);
  assert.equal(await verifyPassword(prefix + 'A'), false);
});

test('FR-11/FR-12 filename strips paths and header control characters', () => {
  assert.equal(safeFileName('..\\secret\\संसाधन\r\n.pdf'), 'संसाधन__.pdf');
  assert.equal(safeFileName('..'), 'document.pdf');
  assert.equal(safeFileName('notes.exe'), 'notes.exe.pdf');
  assert.equal(safeFileName('CON.pdf'), 'document.pdf');
});
