import { Router } from 'express';
import type { Database } from '../../lib/database.js';
import { objectId } from '../../lib/http.js';
import { currentUser, requireRole } from '../../middleware/auth.js';
import { withUpload } from '../file/multipart.js';
import type { FileStore } from '../file/repository.js';
import { sendPdf } from '../file/service.js';
import { editMetadata, uploadMetadata } from './schema.js';
import { deleteDocument, editDocument, getApprovedDocument, getApprovedFile, submitPdf } from './service.js';

export function documentRoutes(db: Database, store: FileStore) {
  const router = Router();
  const admin = requireRole('ADMIN');
  router.post('/', requireRole('FACULTY'), async (req, res) => {
    const { id } = currentUser(res);
    const result = await withUpload(req, res, file =>
      submitPdf(db, store, id, uploadMetadata.parse(req.body), file),
    );
    res.status(201).json(result);
  });
  router.get('/:id', async (req, res) => {
    res.json(await getApprovedDocument(db, objectId.parse(req.params.id)));
  });
  router.patch('/:id', admin, async (req, res) => {
    res.json(await editDocument(db, objectId.parse(req.params.id), editMetadata.parse(req.body)));
  });
  router.delete('/:id', admin, async (req, res) => {
    await deleteDocument(db, store, objectId.parse(req.params.id));
    res.status(204).end();
  });
  router.get('/:id/pdf', async (req, res) => {
    const file = await getApprovedFile(db, objectId.parse(req.params.id));
    await sendPdf(store, file, res, 'inline', req.method === 'HEAD');
  });
  router.get('/:id/download', async (req, res) => {
    const file = await getApprovedFile(db, objectId.parse(req.params.id));
    await sendPdf(store, file, res, 'attachment', req.method === 'HEAD');
  });
  return router;
}
