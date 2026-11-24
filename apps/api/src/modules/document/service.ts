import { Types } from 'mongoose';
import type { Database } from '../../lib/database.js';
import { conflict, forbidden, isDuplicate, logFailure, notFound, unavailable } from '../../lib/http.js';
import { lockSubject, subjectExists } from '../academic/repository.js';
import { validatePdf } from '../file/pdf.js';
import type { FileStore } from '../file/repository.js';
import { safeFileName } from '../file/service.js';
import { lockUser } from '../user/repository.js';
import {
  documentDto, findApproved, findByHash, findFileAsset, findGridFsReference, insertSubmission,
  removeFileAsset, unlinkDocument, updateMetadata,
} from './repository.js';
import type { EditMetadata, UploadMetadata } from './schema.js';

async function compensateUpload(db: Database, store: FileStore, id: Types.ObjectId, error: unknown) {
  try {
    // withTransaction retries an uncertain commit. If its result is still ambiguous, leave bytes for reconciliation.
    if (error instanceof Error && 'hasErrorLabel' in error && typeof error.hasErrorLabel === 'function' &&
        error.hasErrorLabel('UnknownTransactionCommitResult')) {
      logFailure('upload-commit-outcome-unknown', error);
      return;
    }
    if (!await findGridFsReference(db, id)) await store.remove(id);
  } catch (cleanupError) {
    logFailure('upload-compensation-failed', cleanupError);
  }
}

export async function submitPdf(
  db: Database, store: FileStore, submittedBy: string, input: UploadMetadata, upload: Express.Multer.File,
) {
  if (!await subjectExists(db, input.subjectId)) throw notFound();
  const sha256Hash = await validatePdf(upload.path, upload.size);
  const duplicate = () => conflict('This PDF is already retained.');
  if (await findByHash(db, sha256Hash)) throw duplicate();

  const gridFsFileId = new Types.ObjectId();
  const originalName = safeFileName(upload.originalname);
  let stored = false;
  try {
    await store.write(gridFsFileId, upload.path, originalName);
    stored = true;
    const submissionId = await db.connection.transaction(async session => {
      if (!await lockUser(db, submittedBy, 'FACULTY', session)) throw forbidden();
      if (!await lockSubject(db, input.subjectId, session)) throw notFound();
      return insertSubmission(db, input, submittedBy, {
        gridFsFileId, originalName, fileSize: upload.size, sha256Hash,
      }, session);
    });
    return { submissionId, status: 'PENDING' as const };
  } catch (error) {
    await compensateUpload(db, store, gridFsFileId, error);
    if (!stored) {
      logFailure('gridfs-write-failed', error);
      throw unavailable();
    }
    if (isDuplicate(error)) throw duplicate();
    throw error;
  }
}

export async function getApprovedDocument(db: Database, id: string) {
  const document = await findApproved(db, id);
  if (!document) throw notFound();
  return documentDto(document);
}

export async function getApprovedFile(db: Database, id: string) {
  const document = await findApproved(db, id);
  if (!document) throw notFound();
  const file = await findFileAsset(db, document.fileAssetId);
  if (!file) {
    logFailure('referenced-file-asset-missing', new Error('Missing FileAsset'));
    throw unavailable();
  }
  return file;
}

export function editDocument(db: Database, id: string, input: EditMetadata) {
  return db.connection.transaction(async session => {
    if (input.subjectId && !await lockSubject(db, input.subjectId, session)) throw notFound();
    const document = await updateMetadata(db, id, input, session);
    if (!document) throw notFound();
    return documentDto(document);
  });
}

export async function deleteDocument(db: Database, store: FileStore, id: string) {
  const file = await db.connection.transaction(session => unlinkDocument(db, id, session));
  if (!file) throw notFound();
  try {
    await store.remove(file.gridFsFileId);
    await removeFileAsset(db, file._id);
  } catch (error) {
    logFailure('document-file-cleanup-failed', error);
    throw unavailable();
  }
}
