import type { UserRole } from '@evidy/shared';
import type { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { conflict, forbidden, notFound } from '../../lib/http.js';
import { hashPassword } from '../auth/password.js';
import { insertAccount } from '../auth/repository.js';
import type { privilegedRegistration } from '../auth/schema.js';
import {
  countAdmins, findUser, lockFirstAdmin, lockUser, publicUser, removeUser, updateRole, userDependencies,
} from './repository.js';

export async function createUser(db: Database, actor: string, input: z.infer<typeof privilegedRegistration>) {
  const { password, ...account } = input;
  const passwordHash = await hashPassword(password);
  return db.connection.transaction(async session => {
    if (!await lockUser(db, actor, 'ADMIN', session)) throw forbidden();
    return publicUser(await insertAccount(db, { ...account, passwordHash }, session));
  });
}

export function changeUserRole(db: Database, actor: string, id: string, role: UserRole) {
  return db.connection.transaction(async session => {
    await lockFirstAdmin(db, session);
    if (!await lockUser(db, actor, 'ADMIN', session)) throw forbidden();
    const user = await findUser(db, id, session);
    if (!user) throw notFound();
    if (user.role === role) return publicUser(user);
    const { ownsUpload, reviewed } = await userDependencies(db, id, session);
    if ((ownsUpload && role !== 'FACULTY') || (reviewed && role !== 'ADMIN')) {
      throw conflict('This role change would invalidate existing uploads or decisions.');
    }
    if (user.role === 'ADMIN' && await countAdmins(db, session) === 1) {
      throw conflict('The last administrator must remain an administrator.');
    }
    const updated = await updateRole(db, id, role, session);
    if (!updated) throw notFound();
    return publicUser(updated);
  });
}

export function deleteUser(db: Database, actor: string, id: string) {
  return db.connection.transaction(async session => {
    await lockFirstAdmin(db, session);
    if (!await lockUser(db, actor, 'ADMIN', session)) throw forbidden();
    const user = await findUser(db, id, session);
    if (!user) throw notFound();
    const { ownsUpload, reviewed } = await userDependencies(db, id, session);
    if (ownsUpload || reviewed) throw conflict('This account is referenced by an upload or decision.');
    if (user.role === 'ADMIN' && await countAdmins(db, session) === 1) {
      throw conflict('The last administrator cannot be deleted.');
    }
    await removeUser(db, id, session);
  });
}
