import 'dotenv/config';
import { loadDatabaseUri } from '../lib/config.js';
import { openDatabase } from '../lib/database.js';
import { HttpError, logFailure } from '../lib/http.js';
import { registration } from '../modules/auth/schema.js';
import { bootstrapFirstAdmin } from '../modules/auth/service.js';

async function main() {
  const input = registration.extend({ password: registration.shape.password.min(16) }).safeParse({
    name: process.env.BOOTSTRAP_ADMIN_NAME,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  });
  if (!input.success) {
    process.stderr.write('Provide BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and a 16–128 character BOOTSTRAP_ADMIN_PASSWORD.\n');
    process.exitCode = 1;
    return;
  }
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const db = await openDatabase(loadDatabaseUri());
  try {
    await bootstrapFirstAdmin(db, input.data);
    process.stdout.write('Initial administrator created.\n');
  } finally {
    await db.connection.close();
  }
}

main().catch((error: unknown) => {
  if (error instanceof HttpError) process.stderr.write(error.message + '\n');
  else logFailure('bootstrap-admin-failed', error);
  process.exitCode = 1;
});
