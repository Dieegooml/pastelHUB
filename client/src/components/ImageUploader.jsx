import { useState, useRef, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { colors, font } from '../styles/theme';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_PREVIEW_WIDTH = 1024;

export default function ImageUploader({
  currentImageUrl = '',
  onUploadComplete,
  folder = 'uploads',
  label = 'Imagen',
  aspectRatio,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WebP.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('La imagen no debe superar 5MB.');
    }
  }

  const processFile = useCallback(async (file) => {
    setError('');
    try {
      validateFile(file);
      setUploading(true);
      setProgress(0);

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const url = await storageService.uploadImage(folder, file, setProgress);
      URL.revokeObjectURL(localUrl);
      setPreview(url);
      if (onUploadComplete) onUploadComplete(url);
    } catch (err) {
      setError(err.message);
      if (preview && !currentImageUrl) setPreview('');
    } finally {
      setUploading(false);
    }
  }, [folder, onUploadComplete, currentImageUrl, preview]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleRemove() {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview('');
    setError('');
    if (onUploadComplete) onUploadComplete('');
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const dropZoneStyle = {
    position: 'relative',
    border: `2px dashed ${dragOver ? colors.accent : colors.border}`,
    borderRadius: '12px',
    padding: preview ? '8px' : '24px 16px',
    textAlign: 'center',
    cursor: uploading ? 'default' : 'pointer',
    background: dragOver ? '#f0faf5' : colors.grayLight,
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: preview ? 'auto' : '100px',
    opacity: uploading ? 0.7 : 1,
  };

  const previewContainerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: aspectRatio ? '100%' : '200px',
    margin: '0 auto',
    ...(aspectRatio ? { aspectRatio: String(aspectRatio) } : {}),
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const overlayStyle = {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    display: 'flex',
    gap: '6px',
  };

  const iconBtnStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: font.body,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  };

  return (
    <div style={containerStyle}>
      <div
        style={dropZoneStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={uploading ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '12px', zIndex: 2,
          }}>
            <div style={{
              width: '80%', maxWidth: '240px', height: '8px',
              background: colors.grayBg, borderRadius: '99px',
              overflow: 'hidden', marginBottom: '8px',
            }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: colors.accent,
                borderRadius: '99px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontSize: '12px', color: colors.textSecondary,
              fontFamily: font.body, fontWeight: 500,
            }}>
              Subiendo {progress}%
            </span>
          </div>
        )}

        {preview ? (
          <div style={previewContainerStyle}>
            <img
              src={preview}
              alt="Vista previa"
              style={{
                width: '100%',
                height: aspectRatio ? '100%' : '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {!uploading && (
              <div style={overlayStyle}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClick(); }}
                  style={{
                    ...iconBtnStyle,
                    background: colors.primary,
                    color: '#fff',
                  }}
                  title="Cambiar imagen"
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  style={{
                    ...iconBtnStyle,
                    background: colors.error,
                    color: '#fff',
                  }}
                  title="Eliminar imagen"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '6px',
          }}>
            <span style={{
              fontSize: '24px', lineHeight: 1,
              color: colors.textSecondary,
            }}>
              📁
            </span>
            <span style={{
              fontSize: '13px', color: colors.textSecondary,
              fontFamily: font.body, fontWeight: 500,
            }}>
              {dragOver ? 'Suelta la imagen aquí' : `Haz clic o arrastra ${label.toLowerCase()}`}
            </span>
            <span style={{
              fontSize: '11px', color: colors.textMuted,
              fontFamily: font.body,
            }}>
              JPG, PNG o WebP · Máx 5MB
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', background: colors.errorBg,
          color: colors.error, borderRadius: '8px',
          fontSize: '12px', fontFamily: font.body,
          borderLeft: `3px solid ${colors.error}`,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
