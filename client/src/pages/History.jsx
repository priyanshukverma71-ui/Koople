import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import ImagePreview from '../components/ImagePreview';
import {
  Clock,
  Sparkles,
  Search,
  Trash2,
  Download,
  Maximize2,
  Calendar,
  AlertCircle,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import './History.css';

export default function History() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 9;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/generations?page=${page}&limit=${limit}`);

      // Backend returns { success, generations: [...], pagination: { page, limit, total, totalPages } }
      const list = data.generations || [];
      setImages(list);
      const pag = data.pagination || {};
      setTotalPages(pag.totalPages || Math.ceil((pag.total || list.length) / limit) || 1);
      setTotalCount(pag.total || list.length);
    } catch (err) {
      console.error('History fetch error:', err);
      setError(err.message || 'Failed to load your generation history.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteImage = async (id) => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/api/generations/${id}`, { method: 'DELETE' });

      // Optimistically remove from state
      setImages((prev) => prev.filter((img) => (img.id || img._id) !== id));
      setItemToDelete(null);
      if (selectedImage && (selectedImage.id || selectedImage._id) === id) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredImages = images.filter((img) =>
    searchQuery.trim()
      ? (img.prompt || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
      : true
  );

  return (
    <div className="history-page">
      <div className="container history-container">
        {/* Page Header */}
        <div className="history-header">
          <div>
            <h1 className="history-title">Generation History</h1>
            <p className="history-subtitle">
              Browse, download, and manage your previously synthesized AI visuals
            </p>
          </div>

          <Link to="/dashboard" className="btn btn-primary new-creation-btn">
            <PlusCircle size={18} />
            <span>New Generation</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="history-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="history-stats">
            <span>
              Total: <strong>{totalCount}</strong> {totalCount === 1 ? 'generation' : 'generations'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={fetchHistory}
              className="btn btn-sm btn-ghost"
              style={{ color: '#b91c1c' }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Content Section: Loading, Empty, or Cards Grid */}
        {loading ? (
          <div className="history-grid">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="skeleton history-card-skeleton"></div>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="history-empty-card">
            <div className="empty-icon-box">
              <Sparkles size={36} />
            </div>
            {searchQuery ? (
              <>
                <h3 className="empty-title">No matches found</h3>
                <p className="empty-subtitle">
                  No generations matched the query "{searchQuery}". Try a different keyword.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn btn-secondary"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="empty-title">No generations yet</h3>
                <p className="empty-subtitle">
                  Start creating! Turn your imagination into high-resolution visuals now.
                </p>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <PlusCircle size={18} />
                  <span>Start Creating</span>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="history-grid">
              {filteredImages.map((image) => {
                const id = image.id || image._id;
                const src = image.imageData
                  ? `data:${image.mimeType || 'image/png'};base64,${image.imageData}`
                  : image.imageUrl || image.url;
                const dateStr = image.createdAt
                  ? new Date(image.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={id}
                    className="history-card"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="card-thumb-wrapper">
                      <img
                        src={src}
                        alt={image.prompt || 'Generated art'}
                        className="card-thumb-image"
                        loading="lazy"
                      />
                      <div className="card-badge-tag">
                        {image.aspectRatio || '1:1'}
                      </div>
                      <div className="card-hover-overlay">
                        <button
                          type="button"
                          className="thumb-action-btn"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                        >
                          <Maximize2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="thumb-action-btn delete-btn"
                          title="Delete generation"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(image);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="card-body">
                      <p className="card-prompt" title={image.prompt}>
                        {image.prompt}
                      </p>
                      <div className="card-footer-info">
                        <span className="card-date">
                          <Calendar size={12} />
                          {dateStr}
                        </span>
                        <span className="card-model">{image.model || 'Gemini'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="page-indicator">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full Preview Modal */}
      {selectedImage && (
        <ImagePreview
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDeleteImage}
        />
      )}

      {/* Confirm Delete Dialog */}
      {itemToDelete && (
        <div
          className="preview-backdrop"
          onClick={() => setItemToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="delete-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="delete-modal-title">Delete this generation?</h3>
            <p className="delete-modal-desc">
              This action cannot be undone. This image and its prompt record will be permanently
              removed from your history.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteImage(itemToDelete.id || itemToDelete._id)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Generation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
