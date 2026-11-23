import type { Database } from '../../lib/database.js';
import { conflict, forbidden, notFound } from '../../lib/http.js';
import { lockUser } from '../user/repository.js';
import { finalizePending, findSubmission, recordDecision, submissionDto } from './repository.js';

type Decision = { decision: 'APPROVED' } | { decision: 'REJECTED'; reason: string };

export function reviewUpload(db: Database, adminId: string, id: string, input: Decision) {
  return db.connection.transaction(async session => {
    if (!await lockUser(db, adminId, 'ADMIN', session)) throw forbidden();
    const request = await findSubmission(db, id, session);
    if (!request) throw notFound();

    const document = await finalizePending(db, request.documentId, input.decision, session);
    if (!document) throw conflict('The submission has already been reviewed.');
    const updated = await recordDecision(db, id, {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: input.decision === 'REJECTED' ? input.reason : null,
    }, session);
    if (!updated) throw notFound();
    return submissionDto(updated, document);
  });
}
