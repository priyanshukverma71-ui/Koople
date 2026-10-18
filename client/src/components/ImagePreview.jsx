import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, Trash2, Calendar, Sparkles, Maximize2 } from 'lucide-react';
import './ImagePreview.css';

export default function ImagePreview({ image, onClose, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const handleDownload = () => {
    const downloadUrl = image.imageData
      ? `data:${image.mimeType || 'image/png'};base64,${image.imageData}`
      : image.imageUrl || image.url;
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    // File naming based on prompt or timestamp
    const safePrompt = (image.prompt || 'koople-generation')
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `koople-${safePrompt}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(image.id || image._id);
        onClose();
      } catch (err) {
        console.error('Failed to delete image', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formattedDate = image.createdAt
    ? new Date(image.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently created';

  const imageSrc = image.imageData
    ? `data:${image.mimeType || 'image/png'};base64,${image.imageData}`
    : image.imageUrl || image.url;

  return (
    <div className="preview-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image preview">
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with actions and close */}
        <div className="preview-header">
          <div className="preview-header-meta">
            <span className="badge badge-primary">
              <Sparkles size={12} />
              {image.aspectRatio || '1:1'}
            </span>
            <span className="preview-date">
              <Calendar size={14} />
              {formattedDate}
            </span>
          </div>

          <div className="preview-header-actions">
            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-sm"
              title="Download image"
            >
              <Download size={16} />
              <span>Download</span>
            </button>

            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
                title="Delete generation"
              >
                <Trash2 size={16} />
                <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="preview-close-btn"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Image & Prompt details */}
        <div className="preview-body">
          <div className="preview-image-container">
            <img
              src={imageSrc}
              alt={image.prompt || 'Generated AI image'}
              className="preview-full-image"
            />
          </div>

          <div className="preview-details">
            <div className="preview-prompt-header">
              <label className="preview-label">Prompt</label>
              <button
                onClick={handleCopyPrompt}
                className="btn btn-ghost btn-sm copy-btn"
                title="Copy prompt text"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="preview-prompt-text">{image.prompt}</p>

            <div className="preview-metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Model</span>
                <span className="metadata-value">{image.model || 'Gemini Imagen 3'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Aspect Ratio</span>
                <span className="metadata-value">{image.aspectRatio || '1:1'}</span>
              </div>
              {image.dimensions && (
                <div className="metadata-item">
                  <span className="metadata-label">Resolution</span>
                  <span className="metadata-value">{image.dimensions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
