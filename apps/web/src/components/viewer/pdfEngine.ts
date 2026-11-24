import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;
const resources = import.meta.env.BASE_URL + 'pdfjs/';

export function openPdf(data: ArrayBuffer) {
  return getDocument({
    data,
    isEvalSupported: false,
    stopAtErrors: true,
    cMapUrl: resources + 'cmaps/',
    standardFontDataUrl: resources + 'standard_fonts/',
    wasmUrl: resources + 'wasm/',
  });
}
