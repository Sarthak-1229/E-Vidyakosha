import type { UserRole } from '@evidy/shared';
import type { ClientSession } from 'mongoose';
import type { Database } from '../../lib/database.js';

interface NewAccount {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  bootstrap?: true;
}

export const findCredentials = (db: Database, email: string) =>
  db.models.users.findOne({ email }).select('+passwordHash').lean();

export const findActiveUser = (db: Database, id: string) => db.models.users.findById(id).lean();

export async function insertAccount(db: Database, account: NewAccount, session?: ClientSession) {
  return new db.models.users(account).save(session ? { session } : {});
}

export const hasAdmin = (db: Database) => db.models.users.exists({ role: 'ADMIN' });
