import { useEffect, useRef, useMemo, useState } from 'react';
import { fileUrl } from '../../lib/fileUrl';

function getMediaType(type) {
  if (!type) return 'unknown';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/')) return 'text';
  return 'unknown';
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isEmbeddableUrl(url) {
  if (!url) return false;
  // Common video/media platforms that can be embedded via iframe
  const embeddable = [
    'youtube.com', 'youtu.be',
    'vimeo.com',
    'dailymotion.com',
    'streamable.com',
    'drive.google.com',
  ];
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return embeddable.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

function getVimeoEmbedUrl(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

function getDailymotionEmbedUrl(url) {
  const match = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  return match ? `https://www.dailymotion.com/embed/video/${match[1]}` : null;
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreviewModal({ file, onClose }) {
  const overlayRef = useRef(null);
  const [textContent, setTextContent] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const mediaType = getMediaType(file.type);

  // Fetch text file content for preview
  useEffect(() => {
    if (mediaType !== 'text' || !file.url) return;
    setTextLoading(true);
    setTextError(null);
    fetch(fileUrl(file.url))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load file.');
        return res.text();
      })
      .then((text) => setTextContent(text))
      .catch((err) => setTextError(err.message))
      .finally(() => setTextLoading(false));
  }, [mediaType, file.url]);

  const sourceUrl = file.sourceUrl || file.url;
  const isUrlUpload = file.sourceType === 'url';

  // Determine embed strategy for URL uploads
  // Only use embeds when we DON'T have a local downloaded copy
  const hasLocalFile = file.url && file.url.startsWith('/api/files/');
  const embedInfo = useMemo(() => {
    if (!isUrlUpload || !sourceUrl || hasLocalFile) return null;

    const ytId = extractYouTubeId(sourceUrl);
    if (ytId) {
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0` };
    }

    const vimeoUrl = getVimeoEmbedUrl(sourceUrl);
    if (vimeoUrl) {
      return { type: 'vimeo', embedUrl: vimeoUrl };
    }

    const dmUrl = getDailymotionEmbedUrl(sourceUrl);
    if (dmUrl) {
      return { type: 'dailymotion', embedUrl: dmUrl };
    }

    if (isEmbeddableUrl(sourceUrl)) {
      return { type: 'iframe', embedUrl: sourceUrl };
    }

    return null;
  }, [isUrlUpload, sourceUrl, hasLocalFile]);

  const iconInfo = useMemo(() => {
    if (embedInfo?.type === 'youtube') return { icon: 'fa-brands fa-youtube', color: 'text-red-500 bg-red-50' };
    if (embedInfo?.type === 'vimeo') return { icon: 'fa-brands fa-vimeo-v', color: 'text-cyan-600 bg-cyan-50' };
    if (mediaType === 'image') return { icon: 'fa-image', color: 'text-violet-600 bg-violet-50' };
    if (mediaType === 'audio') return { icon: 'fa-music', color: 'text-sky-600 bg-sky-50' };
    if (mediaType === 'video') return { icon: 'fa-video', color: 'text-rose-500 bg-rose-50' };
    if (mediaType === 'pdf') return { icon: 'fa-file-pdf', color: 'text-red-600 bg-red-50' };
    if (mediaType === 'text') return { icon: 'fa-file-alt', color: 'text-gray-600 bg-gray-50' };
    if (isUrlUpload) return { icon: 'fa-link', color: 'text-indigo-600 bg-indigo-50' };
    return { icon: 'fa-file', color: 'text-gray-400 bg-gray-50' };
  }, [embedInfo, mediaType, isUrlUpload]);

  const renderContent = () => {
    // URL uploads with embeddable content
    if (embedInfo) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <iframe
            src={embedInfo.embedUrl}
            className="w-full max-w-3xl aspect-video rounded-lg shadow-sm"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={file.originalName}
          />
        </div>
      );
    }

    // URL uploads without embed — show link + download
    if (isUrlUpload && mediaType === 'unknown') {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-link text-indigo-500 text-2xl"></i>
          </div>
          <p className="text-sm font-medium text-dark-text mb-1">External URL</p>
          <p className="text-xs text-gray-text mb-5 max-w-sm mx-auto truncate" title={sourceUrl}>
            {sourceUrl}
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-medium text-dark-text rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-external-link-alt text-xs"></i>
              Open Source URL
            </a>
            {file.url && (
              <a
                href={fileUrl(file.url)}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white text-sm font-semibold rounded-lg shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 transition-all"
              >
                <i className="fas fa-download text-xs"></i>
                Download
              </a>
            )}
          </div>
        </div>
      );
    }

    // Direct file uploads — use stored URL
    if (mediaType === 'image') {
      return (
        <img
          src={fileUrl(file.url)}
          alt={file.originalName}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
        />
      );
    }

    if (mediaType === 'audio') {
      return (
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-music text-sky-500 text-2xl"></i>
            </div>
            <p className="text-sm font-medium text-dark-text mb-6 truncate">{file.originalName}</p>
            <audio controls className="w-full" preload="metadata">
              <source src={fileUrl(file.url)} type={file.type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }

    if (mediaType === 'video') {
      return (
        <video
          controls
          className="max-w-full max-h-[70vh] rounded-lg shadow-sm"
          preload="metadata"
        >
          <source src={fileUrl(file.url)} type={file.type} />
          Your browser does not support the video element.
        </video>
      );
    }

    if (mediaType === 'pdf') {
      return (
        <iframe
          src={fileUrl(file.url)}
          className="w-full border-0"
          style={{ minHeight: '70vh' }}
          title={file.originalName}
        />
      );
    }

    if (mediaType === 'text') {
      return (
        <div className="w-full">
          {textLoading && (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-primary text-2xl mb-3 block"></i>
              <p className="text-sm text-gray-text">Loading file...</p>
            </div>
          )}
          {textError && (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-exclamation-circle text-red-400 text-xl"></i>
              </div>
              <p className="text-sm text-red-600">{textError}</p>
            </div>
          )}
          {!textLoading && !textError && textContent !== null && (
            <pre className="w-full bg-gray-50 rounded-xl border border-gray-200 p-5 text-xs text-gray-700 font-mono overflow-auto max-h-[65vh] whitespace-pre-wrap break-words">
              {textContent}
            </pre>
          )}
        </div>
      );
    }

    // Fallback — unknown type
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-file text-gray-400 text-2xl"></i>
        </div>
        <p className="text-sm font-medium text-dark-text mb-1">Preview not available</p>
        <p className="text-xs text-gray-text mb-5">This file type cannot be previewed in the browser.</p>
        {file.url && (
          <a
            href={fileUrl(file.url) + '?download=1'}
            className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white text-sm font-semibold rounded-lg shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 transition-all"
          >
            <i className="fas fa-download text-xs"></i>
            Download File
          </a>
        )}
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconInfo.color}`}>
              <i className={`${iconInfo.icon.startsWith('fa-brands') ? iconInfo.icon : `fas ${iconInfo.icon}`} text-sm`}></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-dark-text truncate" title={file.originalName}>
                {file.originalName}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                {file.type && <span>{file.type}</span>}
                {formatSize(file.size) && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span>{formatSize(file.size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto bg-gray-50/50 ${mediaType === 'pdf' ? '' : 'p-6 flex items-center justify-center'}`}>
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            {file.serviceCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                <i className="fas fa-tag text-indigo-400 text-[9px]"></i>
                {file.serviceCategory}
              </span>
            )}
            {isUrlUpload && sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary transition-colors"
                title={sourceUrl}
              >
                <i className="fas fa-external-link-alt text-[9px]"></i>
                Source
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            {file.url && (
              <a
                href={fileUrl(file.url) + '?download=1'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-text hover:text-dark-text hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fas fa-download text-[10px]"></i>
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
