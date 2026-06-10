import { useState } from 'react';
import { storageService } from '../services/storageService';
import { colors, font } from '../styles/theme';

export default function ImageUploader({ folder, currentUrl, onUpload, onRemove, accept = 'image/*', label = 'Imagen' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl || '');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('La imagen no debe superar 2MB'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const url = await storageService.uploadImage(folder, file, setProgress);
      setPreview(url);
      onUpload(url);
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview('');
    onUpload('');
    if (onRemove) onRemove();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{
          padding: '8px 16px', borderRadius: '99px', cursor: 'pointer',
          background: colors.primary, color: '#fff', fontSize: '13px',
          fontFamily: font.body, fontWeight: 500, border: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          opacity: uploading ? 0.6 : 1,
        }}>
          {uploading ? `Subiendo ${progress}%` : `📷 ${label}`}
          <input type="file" accept={accept} onChange={handleFile} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {preview && (
          <button onClick={handleRemove} style={{
            padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
            background: colors.errorBg, color: colors.error, fontSize: '12px',
            fontFamily: font.body, border: 'none', fontWeight: 500,
          }}>
            🗑️ Eliminar
          </button>
        )}
      </div>
      {uploading && (
        <div style={{ width: '100%', height: '6px', background: colors.grayBg, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>
      )}
      {preview && (
        <img src={preview} alt="preview" style={{
          width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover',
          marginTop: '8px', border: `1px solid ${colors.border}`,
        }} onError={e => { e.target.style.display = 'none'; }} />
      )}
      {currentUrl && !preview && (
        <img src={currentUrl} alt="preview" style={{
          width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover',
          marginTop: '8px', border: `1px solid ${colors.border}`,
        }} onError={e => { e.target.style.display = 'none'; }} />
      )}
    </div>
  );
}
