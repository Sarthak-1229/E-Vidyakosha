import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { downloadDocument, getErrorMessage, getInlinePdfBlob } from '../../api';
import { useToast } from '../../context/ToastContext';
import { ErrorAlert } from '../common/ErrorAlert';
import { Spinner } from '../common/Spinner';
import './viewer.css';

interface PdfViewerProps {
  documentId: string;
  documentTitle: string;
}

export function PdfViewer({ documentId, documentTitle }: PdfViewerProps) {
  const { showToast } = useToast();
  const container = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [width, setWidth] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    let loading: PDFDocumentLoadingTask | undefined;
    setPdf(undefined);
    setError(undefined);
    setPage(1);
    setZoom(100);

    async function load() {
      try {
        const blob = await getInlinePdfBlob(documentId, abort.signal);
        const bytes = await blob.arrayBuffer();
        const { openPdf } = await import('./pdfEngine');
        if (abort.signal.aborted) return;
        loading = openPdf(bytes);
        const result = await loading.promise;
        if (!abort.signal.aborted) setPdf(result);
      } catch (cause) {
        if (!abort.signal.aborted) setError(getErrorMessage(cause));
      }
    }
    void load();
    return () => {
      abort.abort();
      void loading?.destroy().catch(() => {});
    };
  }, [documentId, retry]);

  useEffect(() => {
    const target = body.current;
    if (!target || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setWidth(target.clientWidth));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  async function toggleFullscreen() {
    try {
      if (fullscreen) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch {
      showToast('Fullscreen is unavailable.', 'error');
    }
  }

  async function download() {
    setDownloading(true);
    try {
      await downloadDocument(documentId, documentTitle);
    } catch (cause) {
      showToast(getErrorMessage(cause), 'error');
    } finally {
      setDownloading(false);
    }
  }

  function changePage(next: number) {
    setPage(next);
    body.current?.scrollTo(0, 0);
  }

  return (
    <section ref={container} className="glass-card pdf-viewer" data-testid="pdf-viewer-container" aria-label="PDF viewer">
      <div className="pdf-toolbar">
        <div className="pdf-title"><FileText size={16} aria-hidden="true" /><span>{documentTitle}</span></div>
        <div className="pdf-controls" aria-label="Page controls" role="group">
          <button type="button" aria-label="Previous page" disabled={!pdf || page === 1} onClick={() => changePage(page - 1)}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span aria-live="polite">{pdf ? `Page ${page} of ${pdf.numPages}` : 'Pages'}</span>
          <button type="button" aria-label="Next page" disabled={!pdf || page === pdf.numPages} onClick={() => changePage(page + 1)}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="pdf-controls" aria-label="Zoom controls" role="group">
          <button type="button" aria-label="Zoom out" disabled={!pdf || zoom === 50} onClick={() => setZoom(Math.max(50, zoom - 25))}>
            <ZoomOut size={16} aria-hidden="true" />
          </button>
          <span aria-live="polite">{zoom}%</span>
          <button type="button" aria-label="Zoom in" disabled={!pdf || zoom === 200} onClick={() => setZoom(Math.min(200, zoom + 25))}>
            <ZoomIn size={16} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Reset zoom" disabled={!pdf || zoom === 100} onClick={() => setZoom(100)}>
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="pdf-controls">
          <button type="button" className="pdf-download" onClick={download} disabled={downloading}>
            <Download size={14} aria-hidden="true" /> {downloading ? 'Downloading…' : 'Download PDF'}
          </button>
          {document.fullscreenEnabled && (
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {fullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
      <div ref={body} className="pdf-body" tabIndex={0} role="region" aria-label="PDF page content">
        {error ? (
          <div className="pdf-message glass-card">
            <ErrorAlert message={error} />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setRetry(retry + 1)}>Retry PDF</button>
          </div>
        ) : pdf && width ? (
          <PdfPage pdf={pdf} pageNumber={page} width={Math.max(1, Math.min(width - 24, 800) * zoom / 100)} />
        ) : <Spinner size={36} label="Loading authorized PDF…" />}
      </div>
    </section>
  );
}

function PdfPage({ pdf, pageNumber, width }: { pdf: PDFDocumentProxy; pageNumber: number; width: number }) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.replaceChildren(canvas);

    let active = true;
    let rendering: RenderTask | undefined;
    setReady(false);
    setError(false);
    setText('');

    async function render() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!active) return;
        const base = page.getViewport({ scale: 1 });
        const cssScale = width / base.width;
        const viewport = page.getViewport({ scale: cssScale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8_000_000 / (viewport.width * viewport.height)));
        canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
        canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) throw new Error('Canvas rendering unavailable');
        rendering = page.render({ canvas: null, canvasContext, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
        const [, content] = await Promise.all([rendering.promise, page.getTextContent()]);
        if (!active) return;
        setText(content.items.flatMap(item => 'str' in item ? [item.str] : []).join(' '));
        setReady(true);
      } catch {
        if (active) setError(true);
      }
    }
    void render();
    return () => {
      active = false;
      rendering?.cancel();
      canvas.remove();
    };
  }, [pdf, pageNumber, width]);

  return (
    <div className="pdf-page-wrap">
      {error && <div className="pdf-message glass-card"><ErrorAlert message="This PDF page could not be rendered. You can still download the file." /></div>}
      <div ref={canvasHost} className="pdf-page" data-testid="rendered-pdf-page" hidden={!ready} />
      {!ready && !error && <Spinner label="Rendering PDF page…" />}
      {ready && <p className="sr-only">{text || `PDF page ${pageNumber}, image content`}</p>}
    </div>
  );
}
