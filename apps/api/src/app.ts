import { extname, join } from 'node:path';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import type { Database } from './lib/database.js';
import { errorHandler, notFound } from './lib/http.js';
import { currentUser, requireAuth } from './middleware/auth.js';
import { academicRoutes } from './modules/academic/route.js';
import { approvalRoutes } from './modules/approval/route.js';
import { publicAuthRoutes } from './modules/auth/route.js';
import { documentRoutes } from './modules/document/route.js';
import { createFileStore, type FileStore } from './modules/file/repository.js';
import { searchRoutes } from './modules/search/route.js';
import { userRoutes } from './modules/user/route.js';

interface AppOptions {
  db: Database;
  jwtSecret: string;
  webOrigin: string;
  fileStore?: FileStore;
  webDist?: string;
  trustProxyHops?: number;
}

export function createApp({
  db, jwtSecret, webOrigin, fileStore = createFileStore(db), webDist, trustProxyHops = 0,
}: AppOptions) {
  const secret = new TextEncoder().encode(jwtSecret);
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);
  app.use(helmet(webDist ? {
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        // Local production previews also use this entry point. Enforce HTTPS at the deployment proxy.
        upgradeInsecureRequests: null,
      },
    },
  } : {}));
  app.use(cors({ origin: webOrigin, exposedHeaders: ['Content-Disposition'] }));

  const api = Router();
  api.get('/health', (_req, res) => res.json({ status: 'ok', service: 'e-vidyakosha-api' }));
  api.use('/auth', publicAuthRoutes(db, secret));
  api.use(requireAuth(db, secret));
  api.use(express.json({ limit: '256kb' }));
  api.get('/auth/me', (_req, res) => res.json({ user: currentUser(res) }));
  api.use('/users', userRoutes(db));
  api.use(academicRoutes(db));
  api.use('/documents', searchRoutes(db), documentRoutes(db, fileStore));
  api.use(approvalRoutes(db));

  app.use('/api/v1', api);
  app.use('/api', (_req, _res, next) => next(notFound()));
  if (webDist) {
    app.use('/assets', express.static(join(webDist, 'assets'), { immutable: true, maxAge: '1y', index: false }));
    app.use(express.static(webDist, { index: false }));
    app.get('/{*path}', (req, res, next) => {
      if (extname(req.path) || !req.accepts('html')) return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(join(webDist, 'index.html'));
    });
  }
  app.use((_req, _res, next) => next(notFound()));
  app.use(errorHandler);
  return app;
}
