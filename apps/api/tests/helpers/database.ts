import { MongoMemoryReplSet } from 'mongodb-memory-server-core';
import { openDatabase } from '../../src/lib/database.js';

export const testAccount = {
  name: 'Test Administrator',
  email: 'admin@example.test',
  password: 'test-generated-password-123',
};

export const jwtSecret = 'test-only-jwt-signing-secret-for-integration';

export async function createTestDatabase() {
  const server = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger', args: ['--setParameter', 'enableTestCommands=1'] },
  });
  try {
    const uri = server.getUri('evidyakosha_test');
    const db = await openDatabase(uri);
    return {
      db, uri,
      async close() {
        try {
          await db.connection.close();
        } finally {
          await server.stop();
        }
      },
    };
  } catch (error) {
    await server.stop();
    throw error;
  }
}
