import { PDFDocument } from 'pdf-lib';

export async function testPdf(label: string, size?: number) {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText(label, { x: 48, y: 740, size: 20 });
  pdf.setTitle(label);
  const bytes = Buffer.from(await pdf.save());

  if (size === undefined) return bytes;
  const trailer = bytes.lastIndexOf('startxref');
  if (trailer < 0 || size < bytes.length) throw new Error('Invalid PDF fixture size');
  // Whitespace between the xref object and trailer preserves every PDF byte offset.
  return Buffer.concat([bytes.subarray(0, trailer), Buffer.alloc(size - bytes.length, 0x20), bytes.subarray(trailer)]);
}
