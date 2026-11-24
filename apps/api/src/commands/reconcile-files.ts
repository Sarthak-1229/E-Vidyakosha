import 'dotenv/config';
import { loadDatabaseUri } from '../lib/config.js';
import { openDatabase } from '../lib/database.js';
import { logFailure } from '../lib/http.js';
import { reconcileFiles } from '../modules/file/reconcile.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--apply')) {
    process.stderr.write('Usage: npm run files:reconcile -w @evidy/api [-- --apply]\n');
    process.exitCode = 1;
    return;
  }
  const apply = args[0] === '--apply';
  const db = await openDatabase(loadDatabaseUri());
  try {
    const counts = await reconcileFiles(db, apply);
    process.stdout.write(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...counts }) + '\n');
  } finally {
    await db.connection.close();
  }
}

main().catch((error: unknown) => {
  logFailure('file-reconciliation-failed', error);
  process.exitCode = 1;
});
