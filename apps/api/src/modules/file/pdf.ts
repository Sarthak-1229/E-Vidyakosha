import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MAX_PDF_BYTES } from '@evidy/shared';
import { invalid, logFailure, tooLarge, unavailable } from '../../lib/http.js';

function checkReadable(path: string) {
  const script = fileURLToPath(new URL('./pdf-check.mjs', import.meta.url));
  const { SystemRoot, TEMP, TMP } = process.env;
  // Isolate the parser and its native dependencies from the API and its credentials.
  return new Promise<boolean>((resolve, reject) => {
    execFile(process.execPath, ['--max-old-space-size=256', script, path], {
      env: { SystemRoot, TEMP, TMP },
      timeout: 60_000,
      maxBuffer: 64 * 1024,
      windowsHide: true,
    }, error => {
      if (!error) resolve(true);
      else if (error.killed || error.signal || (typeof error.code === 'number' && error.code !== 1)) {
        resolve(false);
      } else {
        logFailure('pdf-validation-unavailable', error);
        reject(unavailable());
      }
    });
  });
}

export async function validatePdf(path: string, size: number) {
  if (size > MAX_PDF_BYTES) throw tooLarge();
  if (size === 0 || !await checkReadable(path)) {
    throw invalid('Upload a readable, unencrypted PDF.');
  }
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk as Buffer);
  }
  return hash.digest('hex');
}
