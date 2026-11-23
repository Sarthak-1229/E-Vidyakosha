import { USER_ROLES } from '@evidy/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { objectId, pageQuery } from '../../lib/http.js';
import { currentUser, requireRole } from '../../middleware/auth.js';
import { privilegedRegistration } from '../auth/schema.js';
import { listUsers } from './repository.js';
import { changeUserRole, createUser, deleteUser } from './service.js';

const pagination = z.object(pageQuery).strict();
const roleInput = z.object({ role: z.enum(USER_ROLES) }).strict();

export function userRoutes(db: Database) {
  const router = Router();
  router.use(requireRole('ADMIN'));
  router.get('/', async (req, res) => {
    const { page, pageSize } = pagination.parse(req.query);
    res.json(await listUsers(db, page, pageSize));
  });
  router.post('/', async (req, res) => {
    const user = await createUser(db, currentUser(res).id, privilegedRegistration.parse(req.body));
    res.status(201).json({ user });
  });
  router.patch('/:id', async (req, res) => {
    const { role } = roleInput.parse(req.body);
    const user = await changeUserRole(db, currentUser(res).id, objectId.parse(req.params.id), role);
    res.json({ user });
  });
  router.delete('/:id', async (req, res) => {
    await deleteUser(db, currentUser(res).id, objectId.parse(req.params.id));
    res.status(204).end();
  });
  return router;
}
