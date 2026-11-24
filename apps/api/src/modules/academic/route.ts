import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { name, objectId } from '../../lib/http.js';
import { requireRole } from '../../middleware/auth.js';
import { listDepartments, listSubjects } from './repository.js';
import { createDepartment, createSubject, deleteDepartment, deleteSubject, updateSubject } from './service.js';

const nameInput = z.object({ name }).strict();
const subjectInput = nameInput.extend({ departmentId: objectId });
const subjectQuery = z.object({ departmentId: objectId.optional() }).strict();

export function academicRoutes(db: Database) {
  const router = Router();
  const admin = requireRole('ADMIN');
  router.get('/departments', async (_req, res) => {
    res.json(await listDepartments(db));
  });
  router.post('/departments', admin, async (req, res) => {
    res.status(201).json(await createDepartment(db, nameInput.parse(req.body).name));
  });
  router.delete('/departments/:id', admin, async (req, res) => {
    await deleteDepartment(db, objectId.parse(req.params.id));
    res.status(204).end();
  });
  router.get('/subjects', async (req, res) => {
    res.json(await listSubjects(db, subjectQuery.parse(req.query).departmentId));
  });
  router.post('/subjects', admin, async (req, res) => {
    const { name, departmentId } = subjectInput.parse(req.body);
    res.status(201).json(await createSubject(db, name, departmentId));
  });
  router.patch('/subjects/:id', admin, async (req, res) => {
    res.json(await updateSubject(db, objectId.parse(req.params.id), nameInput.parse(req.body).name));
  });
  router.delete('/subjects/:id', admin, async (req, res) => {
    await deleteSubject(db, objectId.parse(req.params.id));
    res.status(204).end();
  });
  return router;
}
