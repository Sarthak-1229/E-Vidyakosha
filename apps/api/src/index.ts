import 'dotenv/config';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './lib/config.js';
import { openDatabase } from './lib/database.js';
import { logFailure } from './lib/http.js';

async function main() {
  const config = loadConfig();
  const { webDist } = await webOptions();
  const db = await openDatabase(config.mongoUri);
  const server = createApp({ db, ...config, ...(webDist ? { webDist } : {}) }).listen(config.port, () => {
    process.stdout.write(`E-Vidyakosha API listening on port ${config.port}.\n`);
  });

  const closeDatabase = () => {
    db.connection.close().catch((error: unknown) => {
      logFailure('database-shutdown-failed', error);
      process.exitCode = 1;
    });
  };
  server.on('error', (error: Error) => {
    logFailure('http-server-failed', error);
    process.exitCode = 1;
    closeDatabase();
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => server.close(closeDatabase));
  }
}

async function webOptions() {
  if (!process.argv.includes('--serve-web')) return {};
  const webDist = fileURLToPath(new URL('../../web/dist/', import.meta.url));
  try {
    await access(fileURLToPath(new URL('../../web/dist/index.html', import.meta.url)));
  } catch {
    process.stderr.write('Build the React application before starting the combined server.\n');
    throw new Error('Missing frontend production build.');
  }
  return { webDist };
}

main().catch((error: unknown) => {
  logFailure('api-startup-failed', error);
  process.exitCode = 1;
});
