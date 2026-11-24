import { json, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Database } from '../../lib/database.js';
import { HttpError } from '../../lib/http.js';
import { loginInput, studentRegistration } from './schema.js';
import { credentialsError, login, registerStudent } from './service.js';

export function publicAuthRoutes(db: Database, secret: Uint8Array) {
  const router = Router();
  const parseJson = json({ limit: '256kb' });
  const limit = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, _res, next) => next(new HttpError(429, 'RATE_LIMITED', 'Too many authentication requests.')),
  });
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', limit, parseJson, async (req, res) => {
    const user = await registerStudent(db, studentRegistration.parse(req.body));
    res.status(201).json({ user });
  });
  router.post('/login', limit, parseJson, async (req, res) => {
    const parsed = loginInput.safeParse(req.body);
    if (!parsed.success) throw credentialsError();
    res.json(await login(db, secret, parsed.data));
  });
  return router;
}
