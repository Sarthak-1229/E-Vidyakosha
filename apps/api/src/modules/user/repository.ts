import type { PublicUser, UserRole } from '@evidy/shared';
import type { ClientSession, Types } from 'mongoose';
import type { Database } from '../../lib/database.js';

type PublicFields = Omit<PublicUser, 'id' | 'createdAt'> & { _id: Types.ObjectId; createdAt: Date };

export function publicUser(user: PublicFields): PublicUser {
  return {
    id: user._id.toHexString(), name: user.name, email: user.email,
    role: user.role, createdAt: user.createdAt.toISOString(),
  };
}

export function lockUser(db: Database, id: string, role: UserRole, session: ClientSession) {
  return db.models.users.findOneAndUpdate(
    { _id: id, role }, { $inc: { referenceVersion: 1 } }, { session },
  );
}

export function lockFirstAdmin(db: Database, session: ClientSession) {
  // Admin removals all write the same record so concurrent transactions cannot remove the last two.
  return db.models.users.findOneAndUpdate(
    { role: 'ADMIN' }, { $inc: { referenceVersion: 1 } }, { sort: { _id: 1 }, session },
  );
}

export const findUser = (db: Database, id: string, session: ClientSession) =>
  db.models.users.findById(id).session(session);

export const countAdmins = (db: Database, session: ClientSession) =>
  db.models.users.countDocuments({ role: 'ADMIN' }).session(session);

export const updateRole = (db: Database, id: string, role: UserRole, session: ClientSession) =>
  db.models.users.findByIdAndUpdate(id, { role }, { session, new: true, runValidators: true });

export const removeUser = (db: Database, id: string, session: ClientSession) =>
  db.models.users.deleteOne({ _id: id }, { session });

export async function userDependencies(db: Database, id: string, session: ClientSession) {
  const ownsUpload = Boolean(await db.models.documents.exists({ uploadedBy: id }).session(session)) ||
    Boolean(await db.models.uploadRequests.exists({ submittedBy: id }).session(session));
  const reviewed = Boolean(await db.models.uploadRequests.exists({ reviewedBy: id }).session(session));
  return { ownsUpload, reviewed };
}

export async function listUsers(db: Database, page: number, pageSize: number) {
  const [items, total] = await Promise.all([
    db.models.users.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    db.models.users.countDocuments(),
  ]);
  return { items: items.map(publicUser), page, pageSize, total };
}
