import type { ErrorRequestHandler } from 'express';
import { MongoError, MongoNetworkError, MongoServerSelectionError } from 'mongodb';
import { MulterError } from 'multer';
import { ZodError, z } from 'zod';

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

export const invalid = (message: string) => new HttpError(400, 'VALIDATION_ERROR', message);
export const unauthenticated = (message = 'Authentication is required.') =>
  new HttpError(401, 'UNAUTHENTICATED', message);
export const forbidden = () => new HttpError(403, 'FORBIDDEN', 'This action is not permitted.');
export const notFound = () => new HttpError(404, 'NOT_FOUND', 'Resource not found.');
export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);
export const tooLarge = () => new HttpError(413, 'PAYLOAD_TOO_LARGE', 'PDF must be at most 50 MiB.');
export const unavailable = () => new HttpError(503, 'STORAGE_UNAVAILABLE', 'Storage is temporarily unavailable.');

export const isDuplicate = (error: unknown) =>
  error instanceof MongoError && error.code === 11000;

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
export const name = z.string().trim().min(1).max(120);
export const pageQuery = {
  page: z.string().regex(/^\d{1,10}$/).transform(Number).pipe(z.number().int().min(1)).default(1),
  pageSize: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
};

export function logFailure(event: string, error: unknown) {
  process.stderr.write(JSON.stringify({
    event,
    errorType: error instanceof Error ? error.name : 'UnknownError',
  }) + '\n');
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) {
    res.destroy();
    return;
  }

  let failure: HttpError;
  if (error instanceof HttpError) failure = error;
  else if (error instanceof ZodError) failure = invalid('Invalid request data.');
  else if (error instanceof MulterError) {
    failure = error.code === 'LIMIT_FILE_SIZE' ? tooLarge() : invalid('Invalid multipart upload.');
  } else if (isDuplicate(error)) failure = conflict('A record with these values already exists.');
  else if (error instanceof MongoNetworkError || error instanceof MongoServerSelectionError) {
    logFailure('database-unavailable', error);
    failure = unavailable();
  } else if (error instanceof Error && 'status' in error && error.status === 413) {
    failure = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the size limit.');
  } else if (error instanceof Error && 'status' in error && error.status === 400) {
    failure = invalid('Malformed request.');
  } else {
    logFailure('request-failed', error);
    failure = new HttpError(500, 'INTERNAL_ERROR', 'An internal error occurred.');
  }
  if (failure.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
  res.status(failure.status).json({ error: { code: failure.code, message: failure.message } });
};
