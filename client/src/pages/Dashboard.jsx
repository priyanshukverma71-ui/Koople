import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import ImagePreview from '../components/ImagePreview';
import {
  Wand2,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Lightbulb,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import './Dashboard.css';

const EXAMPLE_PROMPTS = [
  {
    category: 'Cinematic',
    prompt:
      'Bioluminescent crystal cavern with an underground turquoise waterfall, hyperrealistic 8k, cinematic ray tracing, volumetric ambient lighting',
  },
  {
    category: 'Cyberpunk',
    prompt:
      'Cyberpunk street market in Neo-Tokyo in heavy rain, neon reflections on wet asphalt, steam vents, 35mm photography, detailed textures',
  },
  {
    category: 'Fantasy',
    prompt:
      'Ancient moss-covered stone library carved into an overgrown mountain cliff, warm lantern glow, mystical atmosphere, golden hour sunbeams',
  },
  {
    category: 'Architecture',
    prompt:
      'Minimalist Scandinavian glass villa on a serene Nordic lake, surrounded by pine forests, misty sunrise, Architectural Digest cover',
  },
  {
    category: 'Macro',
    prompt:
      'Whimsical miniature brass clockwork butterfly perched on a dewy lavender petal, macro tilt-shift photography, soft bokeh background',
  },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', icon: Square, desc: '1:1 ratio' },
  { id: '16:9', label: 'Landscape', icon: RectangleHorizontal, desc: '16:9 ratio' },
  { id: '9:16', label: 'Portrait', icon: RectangleVertical, desc: '9:16 ratio' },
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Rotate loading text for enhanced UX during image synthesis
  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingPhase(0);
      const phases = [
        'Connecting to Google Gemini...',
        'Analyzing creative prompt semantics...',
        'Synthesizing textures and lighting...',
        'Rendering high-resolution pixels...',
      ];
      let current = 0;
      timer = setInterval(() => {
        current = (current + 1) % phases.length;
        setLoadingPhase(current);
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await apiRequest('/api/generate-image', {
        method: 'POST',
        body: {
          prompt: prompt.trim(),
          aspectRatio,
        },
      });

      // Backend returns { success, generation: { id, prompt, model, aspectRatio, imageData, mimeType, createdAt } }
      const gen = result.generation || result;
      const imageUrl = gen.imageData
        ? `data:${gen.mimeType || 'image/png'};base64,${gen.imageData}`
        : gen.imageUrl || gen.url;

      setGeneratedImage({
        id: gen.id || gen._id || Date.now().toString(),
        prompt: prompt.trim(),
        aspectRatio,
        model: gen.model || 'Gemini Imagen 3',
        imageUrl,
        mimeType: gen.mimeType || 'image/png',
        createdAt: gen.createdAt || new Date().toISOString(),
        dimensions:
          aspectRatio === '1:1'
            ? '1024 x 1024'
            : aspectRatio === '16:9'
            ? '1344 x 768'
            : '768 x 1344',
      });
    } catch (err) {
      console.error('Generation error:', err);
      let message = 'Failed to generate image. Please try again.';
      if (err.status === 429) {
        message = 'Gemini API quota exceeded. Please wait a moment before trying again.';
      } else if (err.status === 400 && err.message?.toLowerCase().includes('safety')) {
        message = 'Prompt triggered safety filters. Please refine your description and avoid restricted content.';
      } else if (err.message) {
        message = err.message;
      }
      setError({
        status: err.status,
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!generatedImage?.prompt) return;
    try {
      await navigator.clipboard.writeText(generatedImage.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = () => {
    if (!generatedImage?.imageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImage.imageUrl;
    const cleanPrompt = generatedImage.prompt
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `koople-${cleanPrompt}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseExample = (text) => {
    setPrompt(text);
  };

  const loadingPhases = [
    'Connecting to Google Gemini...',
    'Analyzing creative prompt semantics...',
    'Synthesizing textures and lighting...',
    'Rendering high-resolution pixels...',
  ];

  return (
    <div className="dashboard-page">
      <div className="container dashboard-container">
        {/* Top Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Studio Workspace</h1>
            <p className="dashboard-subtitle">
              Describe your vision with rich details to generate original artwork
            </p>
          </div>
          <Link to="/history" className="btn btn-secondary view-history-btn">
            <Clock size={16} />
            <span>Generation History</span>
          </Link>
        </div>

        {/* Workspace Grid */}
        <div className="workspace-grid">
          {/* Left Column: Prompt Input Controls */}
          <div className="prompt-controls-col">
            <form onSubmit={handleGenerate} className="prompt-form">
              <div className="prompt-box-card">
                <div className="prompt-box-header">
                  <label htmlFor="prompt-input" className="control-label">
                    Prompt Description
                  </label>
                  <span
                    className={`char-counter ${
                      prompt.length >= 1900
                        ? 'counter-danger'
                        : prompt.length >= 1500
                        ? 'counter-warning'
                        : ''
                    }`}
                  >
                    {prompt.length} / 2000
                  </span>
                </div>

                <textarea
                  id="prompt-input"
                  className="prompt-textarea"
                  placeholder="Describe the image you want to create... (e.g., A futuristic greenhouse observatory at dusk overlooking a misty bioluminescent mountain valley, volumetric ambient light, 8k)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                  rows={5}
                  disabled={loading}
                />

                {/* Aspect Ratio Selector */}
                <div className="aspect-ratio-section">
                  <span className="control-label">Aspect Ratio</span>
                  <div className="ratio-options-grid">
                    {ASPECT_RATIOS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = aspectRatio === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`ratio-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setAspectRatio(item.id)}
                          disabled={loading}
                        >
                          <Icon size={18} />
                          <div className="ratio-text-info">
                            <span className="ratio-label">{item.label}</span>
                            <span className="ratio-dim">{item.id}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="btn btn-primary btn-lg generate-submit-btn"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Example Prompts */}
            <div className="example-prompts-section">
              <div className="examples-header">
                <Lightbulb size={16} className="bulb-icon" />
                <span className="examples-title">Prompt Inspirations</span>
              </div>
              <div className="example-list">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseExample(ex.prompt)}
                    className="example-item-btn"
                    disabled={loading}
                  >
                    <span className="example-category">{ex.category}</span>
                    <p className="example-snippet">{ex.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Output Display Area */}
          <div className="output-display-col">
            {error && (
              <div className="alert alert-error" role="alert">
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Generation Failed: </strong>
                  <span>{error.message}</span>
                </div>
              </div>
            )}

            <div className="display-canvas-card">
              {loading ? (
                /* Loading State Skeleton */
                <div className="canvas-loading-state">
                  <div className="skeleton canvas-skeleton">
                    <div className="skeleton-overlay">
                      <div className="spinner spinner-lg"></div>
                      <p className="loading-phase-text">
                        {loadingPhases[loadingPhase]}
                      </p>
                      <span className="loading-subtext">
                        Synthesizing pixel data from Google Gemini
                      </span>
                    </div>
                  </div>
                </div>
              ) : generatedImage ? (
                /* Rendered Result */
                <div className="rendered-result-container">
                  <div className="rendered-image-wrapper">
                    <img
                      src={generatedImage.imageUrl}
                      alt={generatedImage.prompt}
                      className="rendered-image"
                      onClick={() => setPreviewImage(generatedImage)}
                    />
                    <div className="image-hover-actions">
                      <button
                        onClick={() => setPreviewImage(generatedImage)}
                        className="btn btn-secondary btn-sm"
                        title="View Full Size"
                      >
                        <Maximize2 size={16} />
                        <span>Expand</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="btn btn-secondary btn-sm"
                        title="Download Image"
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <div className="result-metadata-panel">
                    <div className="result-prompt-box">
                      <div className="result-prompt-header">
                        <span className="control-label">Prompt Used</span>
                        <button
                          onClick={handleCopyPrompt}
                          className="btn btn-ghost btn-sm copy-btn"
                          title="Copy prompt"
                        >
                          {copied ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Copy size={14} />
                          )}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="result-prompt-text">{generatedImage.prompt}</p>
                    </div>

                    <div className="result-meta-row">
                      <div className="meta-tag">
                        <span className="meta-tag-label">Model:</span>
                        <span className="meta-tag-val">{generatedImage.model}</span>
                      </div>
                      <div className="meta-tag">
                        <span className="meta-tag-label">Ratio:</span>
                        <span className="meta-tag-val">{generatedImage.aspectRatio}</span>
                      </div>
                      <div className="meta-tag">
                        <span className="meta-tag-label">Resolution:</span>
                        <span className="meta-tag-val">{generatedImage.dimensions}</span>
                      </div>
                    </div>

                    <div className="result-actions-row">
                      <button
                        onClick={handleDownload}
                        className="btn btn-primary"
                      >
                        <Download size={16} />
                        <span>Download PNG</span>
                      </button>
                      <button
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          const textarea = document.getElementById('prompt-input');
                          if (textarea) textarea.focus();
                        }}
                        className="btn btn-secondary"
                      >
                        <RefreshCw size={16} />
                        <span>Generate Another</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty / Idle State */
                <div className="canvas-idle-state">
                  <div className="idle-icon-circle">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="idle-title">Ready for Your Vision</h3>
                  <p className="idle-description">
                    Enter a prompt on the left or select an inspiration prompt to generate
                    photorealistic or stylized art with KOOPLE.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {previewImage && (
        <ImagePreview
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
