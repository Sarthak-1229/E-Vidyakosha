import type { DepartmentDto, SubjectDto } from '@evidy/shared';
import type { ClientSession, Types } from 'mongoose';
import type { Database } from '../../lib/database.js';
import { nameCollation } from '../../models/index.js';

export function departmentDto(department: { _id: Types.ObjectId; name: string }): DepartmentDto {
  return { id: department._id.toHexString(), name: department.name };
}

export function subjectDto(subject: { _id: Types.ObjectId; name: string; departmentId: Types.ObjectId }): SubjectDto {
  return { id: subject._id.toHexString(), name: subject.name, departmentId: subject.departmentId.toHexString() };
}

export async function listDepartments(db: Database) {
  return (await db.models.departments.find().sort({ name: 1, _id: 1 }).collation(nameCollation).lean())
    .map(departmentDto);
}

export async function listSubjects(db: Database, departmentId?: string) {
  return (await db.models.subjects.find(departmentId ? { departmentId } : {})
    .sort({ name: 1, _id: 1 }).collation(nameCollation).lean()).map(subjectDto);
}

export const insertDepartment = (db: Database, name: string) => db.models.departments.create({ name });

export const lockDepartment = (db: Database, id: string, session: ClientSession) =>
  db.models.departments.findByIdAndUpdate(id, { $inc: { referenceVersion: 1 } }, { session });

export const departmentHasSubjects = (db: Database, id: string, session: ClientSession) =>
  db.models.subjects.exists({ departmentId: id }).session(session);

export const removeDepartment = (db: Database, id: string, session: ClientSession) =>
  db.models.departments.deleteOne({ _id: id }, { session });

export const insertSubject = (db: Database, name: string, departmentId: string, session: ClientSession) =>
  new db.models.subjects({ name, departmentId }).save({ session });

export const renameSubject = (db: Database, id: string, name: string) =>
  db.models.subjects.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

export const subjectExists = (db: Database, id: string) => db.models.subjects.exists({ _id: id });

export const lockSubject = (db: Database, id: string, session: ClientSession) =>
  db.models.subjects.findByIdAndUpdate(id, { $inc: { referenceVersion: 1 } }, { session });

export const subjectHasDocuments = (db: Database, id: string, session: ClientSession) =>
  db.models.documents.exists({ subjectId: id }).session(session);

export const removeSubject = (db: Database, id: string, session: ClientSession) =>
  db.models.subjects.deleteOne({ _id: id }, { session });
