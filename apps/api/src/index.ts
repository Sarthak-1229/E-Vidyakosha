import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './lib/config.js';
import { openDatabase } from './lib/database.js';
import { logFailure } from './lib/http.js';

async function main() {
  const config = loadConfig();
  const db = await openDatabase(config.mongoUri);
  const server = createApp({ db, ...config }).listen(config.port, () => {
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

main().catch((error: unknown) => {
  logFailure('api-startup-failed', error);
  process.exitCode = 1;
});
