import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { MAX_PDF_BYTES } from '@evidy/shared';
import { HttpError, invalid, logFailure, tooLarge, unavailable } from '../../lib/http.js';

const maxConcurrentUploads = 2;
let activeUploads = 0;

export async function withUpload<T>(req: Request, res: Response, processFile: (file: Express.Multer.File) => Promise<T>) {
  if (!req.is('multipart/form-data')) throw invalid('Send a multipart PDF upload.');
  if (activeUploads >= maxConcurrentUploads) {
    throw new HttpError(429, 'RATE_LIMITED', 'Upload capacity is busy. Try again shortly.');
  }

  activeUploads += 1;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), 'evidyakosha-upload-'));
    const parse = multer({
      dest: directory,
      defParamCharset: 'utf8',
      limits: {
        // Busboy signals its limit when reached; let the exact 50 MiB boundary pass.
        fileSize: MAX_PDF_BYTES + 1,
        files: 1,
        fields: 4,
        fieldSize: 16 * 1024,
      },
    }).single('file');
    await new Promise<void>((resolve, reject) => {
      parse(req, res, (error: unknown) => {
        if (!error) resolve();
        else if (error instanceof MulterError) reject(error);
        else if (error instanceof Error && !('code' in error)) reject(invalid('Malformed multipart upload.'));
        else {
          logFailure('multipart-read-failed', error);
          reject(unavailable());
        }
      });
    });
    if (!req.file) throw invalid('A PDF file is required.');
    if (req.file.size > MAX_PDF_BYTES) throw tooLarge();
    return await processFile(req.file);
  } finally {
    activeUploads -= 1;
    if (directory) {
      try {
        await rm(directory, { recursive: true, force: true, maxRetries: 3 });
      } catch (error) {
        logFailure('upload-temporary-file-cleanup-failed', error);
      }
    }
  }
}
