import React, { useEffect, useState, useRef } from 'react';
import { getInlinePdfBlob, downloadPdfBlob, getErrorMessage } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../common/Spinner';
import {
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface PdfViewerProps {
  documentId: string;
  documentTitle: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ documentId, documentTitle }) => {
  const { showToast } = useToast();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Authenticated fetch & cleanup lifecycle (FR-11)
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadPdf() {
      setIsLoading(true);
      setError(null);
      try {
        const blob = await getInlinePdfBlob(documentId);
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    // Critical cleanup on unmount or id change
    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [documentId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadPdfBlob(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Document download initiated', 'success');
    } catch {
      showToast('Failed to download document', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.88)',
        height: isFullscreen ? '100vh' : '800px',
      }}
      data-testid="pdf-viewer-container"
    >
      {/* Viewer Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(17, 29, 46, 0.95)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <FileText size={16} color="#60a5fa" />
          <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {documentTitle}
          </span>
        </div>

        {/* Zoom & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
            disabled={zoom <= 50 || isLoading}
            className="btn-ghost"
            style={{ color: '#ffffff', padding: '6px' }}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
            disabled={zoom >= 200 || isLoading}
            className="btn-ghost"
            style={{ color: '#ffffff', padding: '6px' }}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(100)}
            disabled={zoom === 100 || isLoading}
            className="btn-ghost"
            style={{ color: '#ffffff', padding: '6px' }}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Download & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading || isLoading}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            <Download size={14} /> Download PDF
          </button>
          <button
            onClick={toggleFullscreen}
            className="btn-ghost"
            style={{ color: '#ffffff', padding: '6px' }}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Viewer Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#475569',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        {isLoading && (
          <div style={{ color: '#ffffff' }}>
            <Spinner size={36} label="Loading authorized document stream..." />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              maxWidth: '460px',
            }}
          >
            <AlertCircle size={36} color="#dc2626" style={{ margin: '0 auto 12px' }} />
            <h3>Unable to Stream PDF</h3>
            <p style={{ marginTop: '8px', marginBottom: '20px', fontSize: '13px' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && blobUrl && (
          <div
            style={{
              width: `${zoom}%`,
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              transition: 'width 0.15s ease',
            }}
          >
            <object
              data={blobUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ border: 'none', minHeight: '600px' }}
              aria-label={`PDF view for ${documentTitle}`}
            >
              <iframe
                src={blobUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title={documentTitle}
              >
                <div style={{ padding: '30px', textAlign: 'center', color: '#ffffff' }}>
                  <p>Your browser does not support embedded PDF viewing.</p>
                  <button
                    onClick={handleDownload}
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    <Download size={16} /> Download {documentTitle}
                  </button>
                </div>
              </iframe>
            </object>
          </div>
        )}
      </div>
    </div>
  );
};
