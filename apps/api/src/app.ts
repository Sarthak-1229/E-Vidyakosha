import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '256kb' }));

  // Only the bootstrap health endpoint is operational in this starter.
  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'scaffold', service: 'e-vidyakosha-api' });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not implemented or not found' } });
  });
  const errorHandler: ErrorRequestHandler = (_err, _req, res, _next) => {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } });
  };
  app.use(errorHandler);
  return app;
}
