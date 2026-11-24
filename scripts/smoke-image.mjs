import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';
import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

const exec = promisify(execFile);
const image = process.argv[2];
if (!image) throw new Error('Provide a locally built Docker image tag');
const db = await MongoMemoryReplSet.create();
const origin = 'http://127.0.0.1:4400';
let container;

try {
  const { stdout } = await exec('docker', [
    'run', '--detach', '--rm', '--network', 'host',
    '-e', 'PORT', '-e', 'MONGODB_URI', '-e', 'JWT_SECRET', '-e', 'WEB_ORIGIN', image,
  ], {
    env: {
      ...process.env,
      PORT: '4400',
      MONGODB_URI: db.getUri('evidyakosha_container_smoke'),
      JWT_SECRET: randomBytes(48).toString('base64url'),
      WEB_ORIGIN: origin,
    },
  });
  container = stdout.trim();
  let health;
  for (let attempt = 0; attempt < 40; attempt++) {
    health = await fetch(origin + '/api/v1/health').catch(() => undefined);
    if (health?.ok) break;
    await setTimeout(500);
  }
  assert.equal(health?.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const shell = await fetch(origin + '/library');
  assert.equal(shell.status, 200);
  assert.match(await shell.text(), /<div id="root"><\/div>/);
  assert.equal((await fetch(origin + '/api/v1/documents')).status, 401);
  console.log('Container smoke passed against a MongoDB replica set.');
} catch (error) {
  if (container) {
    const logs = await exec('docker', ['logs', container]).catch(() => null);
    if (logs) console.error(logs.stdout, logs.stderr);
  }
  throw error;
} finally {
  try {
    if (container) await exec('docker', ['stop', container]).catch(() => {});
  } finally {
    await db.stop();
  }
}
