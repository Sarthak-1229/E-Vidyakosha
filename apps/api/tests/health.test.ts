import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('health endpoint explicitly identifies scaffold status', async () => {
  const response = await request(createApp()).get('/api/v1/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'scaffold');
});

test('missing routes do not accidentally serve data', async () => {
  const response = await request(createApp()).get('/api/v1/documents');
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});
