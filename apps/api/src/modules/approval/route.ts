import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { objectId } from '../../lib/http.js';
import { currentUser, requireRole } from '../../middleware/auth.js';
import { listMine, listPending } from './repository.js';
import { reviewUpload } from './service.js';

const reason = z.string().trim().min(1).max(2000);
const decision = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('APPROVED'), reason: reason.optional() }).strict(),
  z.object({ decision: z.literal('REJECTED'), reason }).strict(),
]);

export function approvalRoutes(db: Database) {
  const router = Router();
  const admin = requireRole('ADMIN');
  router.get('/approvals/pending', admin, async (_req, res) => res.json(await listPending(db)));
  router.post('/approvals/:id/decision', admin, async (req, res) => {
    res.json(await reviewUpload(db, currentUser(res).id, objectId.parse(req.params.id), decision.parse(req.body)));
  });
  router.get('/uploads/mine', requireRole('FACULTY'), async (_req, res) => {
    res.json(await listMine(db, currentUser(res).id));
  });
  return router;
}
