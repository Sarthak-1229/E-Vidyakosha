import type { Database } from '../../lib/database.js';
import { conflict, notFound } from '../../lib/http.js';
import {
  departmentDto, departmentHasSubjects, insertDepartment, insertSubject, lockDepartment, lockSubject,
  removeDepartment, removeSubject, renameSubject, subjectDto, subjectHasDocuments,
} from './repository.js';

export const createDepartment = async (db: Database, name: string) =>
  departmentDto(await insertDepartment(db, name));

export function deleteDepartment(db: Database, id: string) {
  return db.connection.transaction(async session => {
    if (!await lockDepartment(db, id, session)) throw notFound();
    if (await departmentHasSubjects(db, id, session)) throw conflict('The department still has subjects.');
    await removeDepartment(db, id, session);
  });
}

export function createSubject(db: Database, name: string, departmentId: string) {
  return db.connection.transaction(async session => {
    if (!await lockDepartment(db, departmentId, session)) throw notFound();
    return subjectDto(await insertSubject(db, name, departmentId, session));
  });
}

export async function updateSubject(db: Database, id: string, name: string) {
  const subject = await renameSubject(db, id, name);
  if (!subject) throw notFound();
  return subjectDto(subject);
}

export function deleteSubject(db: Database, id: string) {
  return db.connection.transaction(async session => {
    if (!await lockSubject(db, id, session)) throw notFound();
    if (await subjectHasDocuments(db, id, session)) throw conflict('The subject still has documents.');
    await removeSubject(db, id, session);
  });
}
