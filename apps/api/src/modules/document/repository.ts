import type { DocumentDto, DocumentStatus } from '@evidy/shared';
import type { ClientSession, Types } from 'mongoose';
import type { Database } from '../../lib/database.js';
import type { EditMetadata, UploadMetadata } from './schema.js';

export interface DocumentRow {
  _id: Types.ObjectId;
  title: string;
  author?: string | null;
  type: DocumentDto['type'];
  subjectId: Types.ObjectId;
  status: DocumentStatus;
  uploadedAt: Date;
}

export function documentDto(document: DocumentRow): DocumentDto {
  return {
    id: document._id.toHexString(), title: document.title, author: document.author ?? null,
    type: document.type, subjectId: document.subjectId.toHexString(), uploadedAt: document.uploadedAt.toISOString(),
  };
}

export const findByHash = (db: Database, sha256Hash: string) => db.models.fileAssets.exists({ sha256Hash });

export const findFileAsset = (db: Database, id: Types.ObjectId) => db.models.fileAssets.findById(id).lean();

export const findApproved = (db: Database, id: string) =>
  db.models.documents.findOne({ _id: id, status: 'APPROVED' }).lean();

export async function insertSubmission(
  db: Database, metadata: UploadMetadata, submittedBy: string,
  file: { gridFsFileId: Types.ObjectId; originalName: string; fileSize: number; sha256Hash: string },
  session: ClientSession,
) {
  const asset = await new db.models.fileAssets(file).save({ session });
  const submittedAt = new Date();
  const document = await new db.models.documents({
    ...metadata, uploadedBy: submittedBy, fileAssetId: asset._id, uploadedAt: submittedAt,
  }).save({ session });
  const submission = await new db.models.uploadRequests({
    documentId: document._id, submittedBy, submittedAt,
  }).save({ session });
  return submission._id.toHexString();
}

export const updateMetadata = (db: Database, id: string, input: EditMetadata, session: ClientSession) =>
  db.models.documents.findByIdAndUpdate(id, { $set: input }, { new: true, session, runValidators: true });

export async function unlinkDocument(db: Database, id: string, session: ClientSession) {
  const document = await db.models.documents.findByIdAndDelete(id, { session });
  if (document) {
    await db.models.uploadRequests.deleteOne({ documentId: id }, { session });
    await db.models.fileAssets.updateOne(
      { _id: document.fileAssetId }, { $set: { cleanupDocumentId: id } }, { session },
    );
  }
  // The cleanup record allows the same DELETE request to retry an interrupted binary deletion.
  return db.models.fileAssets.findOne({ cleanupDocumentId: id }).session(session).lean();
}

export const removeFileAsset = (db: Database, id: Types.ObjectId) => db.models.fileAssets.deleteOne({ _id: id });

export const findGridFsReference = (db: Database, id: Types.ObjectId) =>
  db.models.fileAssets.exists({ gridFsFileId: id }).readConcern('majority');
