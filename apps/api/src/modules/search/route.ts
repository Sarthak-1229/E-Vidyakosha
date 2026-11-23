import { DOCUMENT_TYPES } from '@evidy/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { objectId, pageQuery } from '../../lib/http.js';
import { findDocuments } from './repository.js';

const query = z.object({
  ...pageQuery,
  q: z.string().trim().max(250).optional(),
  subjectId: objectId.optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
}).strict();

export function searchRoutes(db: Database) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await findDocuments(db, query.parse(req.query))));
  return router;
}
