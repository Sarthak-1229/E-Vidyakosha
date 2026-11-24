import type { DocumentStatus, SubmissionDto } from '@evidy/shared';
import { Types, type ClientSession } from 'mongoose';
import type { Database } from '../../lib/database.js';
import { documentDto, type DocumentRow } from '../document/repository.js';

interface RequestRow {
  _id: Types.ObjectId;
  submittedAt: Date;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
}

export function submissionDto(request: RequestRow, document: DocumentRow): SubmissionDto {
  return {
    id: request._id.toHexString(), document: documentDto(document), status: document.status,
    rejectionReason: request.rejectionReason ?? null, submittedAt: request.submittedAt.toISOString(),
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
  };
}

export async function listPending(db: Database) {
  const rows = await db.models.documents.aggregate<DocumentRow & { request: RequestRow }>([
    { $match: { status: 'PENDING' } },
    { $sort: { uploadedAt: -1, _id: -1 } },
    { $lookup: { from: 'uploadRequests', localField: '_id', foreignField: 'documentId', as: 'request' } },
    { $unwind: '$request' },
  ]).readConcern('snapshot');
  return rows.map(row => submissionDto(row.request, row));
}

export async function listMine(db: Database, actorId: string) {
  const rows = await db.models.uploadRequests.aggregate<RequestRow & { document: DocumentRow }>([
    { $match: { submittedBy: new Types.ObjectId(actorId) } },
    { $sort: { submittedAt: -1, _id: -1 } },
    { $lookup: { from: 'documents', localField: 'documentId', foreignField: '_id', as: 'document' } },
    { $unwind: '$document' },
  ]).readConcern('snapshot');
  return rows.map(row => submissionDto(row, row.document));
}

export const findSubmission = (db: Database, id: string, session: ClientSession) =>
  db.models.uploadRequests.findById(id).session(session);

export const finalizePending = (
  db: Database, id: Types.ObjectId, status: Exclude<DocumentStatus, 'PENDING'>, session: ClientSession,
) => db.models.documents.findOneAndUpdate({ _id: id, status: 'PENDING' }, { status }, { session, new: true });

export const recordDecision = (
  db: Database, id: string, fields: { reviewedBy: string; reviewedAt: Date; rejectionReason: string | null },
  session: ClientSession,
) => db.models.uploadRequests.findByIdAndUpdate(id, fields, { session, new: true, runValidators: true });
