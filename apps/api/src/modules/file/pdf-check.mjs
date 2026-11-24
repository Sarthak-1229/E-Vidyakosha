// @ts-check
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.url);
const resources = dirname(require.resolve('pdfjs-dist/package.json'));
const path = process.argv[2];
if (!path) throw new Error('Missing PDF path');
const data = await readFile(path);

async function isReadable() {
  if (!/^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(data.toString('latin1', 0, 12))) return false;

  // The PDF grammar defines NUL, tabs and line endings as whitespace.
  // eslint-disable-next-line no-control-regex
  const trailer = /startxref\s+(\d+)\s+%%EOF[\x00\x09\x0a\x0c\x0d\x20]*$/
    .exec(data.subarray(-4096).toString('latin1'));
  if (!trailer) return false;
  const offset = Number(trailer[1]);
  if (offset >= data.length || !/^(xref\b|\d+\s+\d+\s+obj\b)/
    .test(data.toString('latin1', offset, offset + 64))) return false;

  const task = getDocument({
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    stopAtErrors: true,
    isEvalSupported: false,
    useSystemFonts: false,
    cMapUrl: join(resources, 'cmaps') + '/',
    standardFontDataUrl: join(resources, 'standard_fonts') + '/',
    wasmUrl: join(resources, 'wasm') + '/',
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    const { info } = await pdf.getMetadata();
    // The parser can open encrypted files with an empty user password.
    if (info && 'EncryptFilterName' in info && info.EncryptFilterName) return false;
    if (pdf.numPages < 1) return false;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      await page.getOperatorList();
      page.cleanup();
    }
    return true;
  } catch {
    return false;
  } finally {
    await task.destroy();
  }
}

process.exitCode = await isReadable() ? 0 : 2;
