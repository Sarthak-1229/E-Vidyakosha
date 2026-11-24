import type { PublicUser, UserRole } from '@evidy/shared';
import type { RequestHandler, Response } from 'express';
import type { Database } from '../lib/database.js';
import { forbidden, unauthenticated } from '../lib/http.js';
import { authenticate } from '../modules/auth/service.js';

declare module 'express-serve-static-core' {
  interface Locals {
    user?: PublicUser;
  }
}

export function currentUser(res: Response): PublicUser {
  if (!res.locals.user) throw unauthenticated();
  return res.locals.user;
}

export function requireAuth(db: Database, secret: Uint8Array): RequestHandler {
  return async (req, res, next) => {
    const header = req.get('Authorization');
    const token = header?.match(/^Bearer ([a-z0-9_.-]+)$/i)?.[1];
    if (!token) throw unauthenticated();
    res.locals.user = await authenticate(db, secret, token);
    res.setHeader('Cache-Control', 'no-store');
    next();
  };
}

export function requireRole(role: UserRole): RequestHandler {
  return (_req, res, next) => {
    if (currentUser(res).role !== role) throw forbidden();
    next();
  };
}
