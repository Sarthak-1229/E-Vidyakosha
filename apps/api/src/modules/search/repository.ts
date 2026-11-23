import type { DocumentDto, ListResponse } from '@evidy/shared';
import { Types, type PipelineStage } from 'mongoose';
import type { Database } from '../../lib/database.js';
import { documentDto, type DocumentRow } from '../document/repository.js';

interface Filters {
  page: number;
  pageSize: number;
  q?: string | undefined;
  subjectId?: string | undefined;
  type?: DocumentDto['type'] | undefined;
}

export async function findDocuments(db: Database, { page, pageSize, q, subjectId, type }: Filters): Promise<ListResponse<DocumentDto>> {
  // Treat input as words, so callers cannot inject MongoDB text query operators.
  const search = q?.match(/[\p{L}\p{M}\p{N}]+/gu)?.join(' ');
  if (q && !search) return { items: [], page, pageSize, total: 0 };

  const match: PipelineStage.Match['$match'] = { status: 'APPROVED' };
  if (search) match.$text = { $search: search };
  if (subjectId) match.subjectId = new Types.ObjectId(subjectId);
  if (type) match.type = type;

  const [result] = await db.models.documents.aggregate<{ items: DocumentRow[]; total: { count: number }[] }>([
    { $match: match },
    { $sort: { uploadedAt: -1, _id: -1 } },
    {
      $facet: {
        items: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        total: [{ $count: 'count' }],
      },
    },
  ]).readConcern('snapshot').allowDiskUse(true);
  return {
    items: result?.items.map(documentDto) ?? [], page, pageSize, total: result?.total[0]?.count ?? 0,
  };
}
