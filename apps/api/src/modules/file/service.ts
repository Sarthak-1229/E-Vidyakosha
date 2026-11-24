import { win32 } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { create as contentDisposition } from 'content-disposition';
import type { Response } from 'express';
import type { ObjectId } from 'mongodb';
import { logFailure, unavailable } from '../../lib/http.js';
import type { FileStore } from './repository.js';

export function safeFileName(originalName: string) {
  const name = win32.basename(originalName).replace(/[\p{C}<>:"/\\|?*]/gu, '_')
    .replace(/\.pdf$/i, '').replace(/^[.\s]+|[.\s]+$/g, '');
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)) return 'document.pdf';
  return `${Array.from(name).slice(0, 120).join('') || 'document'}.pdf`;
}

export async function sendPdf(
  store: FileStore, file: { gridFsFileId: ObjectId; originalName: string; fileSize: number },
  res: Response, disposition: 'inline' | 'attachment', headOnly: boolean,
) {
  const info = await store.info(file.gridFsFileId);
  if (!info || info.length !== file.fileSize) {
    logFailure('referenced-pdf-unavailable', new Error('GridFS file missing or invalid'));
    throw unavailable();
  }

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': contentDisposition(safeFileName(file.originalName), { type: disposition }),
    'Content-Length': String(info.length),
    'X-Content-Type-Options': 'nosniff',
  });
  if (headOnly) {
    res.end();
    return;
  }
  try {
    await pipeline(store.read(file.gridFsFileId), res);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
      logFailure('pdf-stream-failed', error);
    }
    if (!res.destroyed) res.destroy();
  }
}
