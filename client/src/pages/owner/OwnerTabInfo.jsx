import { useEffect, useState } from 'react';
import { colors, font, inputStyle, btnPrimary } from '../../styles/theme';
import { shopsService } from '../../services/shopsService';
import { smallInput, sectionTitle } from './ownerConstants';
import ImageUploader from '../../components/ImageUploader';
import PropTypes from 'prop-types';

export default function OwnerTabInfo({ selectedShop, setError, setSuccess, onShopUpdate }) {
  const [shopForm, setShopForm] = useState({
    shopName: '', shopDescription: '', address: '', city: '', phone: '', email: '',
    deliveryRange: '', logoUrl: '', bannerUrl: '',
  });
  const [savingShop, setSavingShop] = useState(false);

  useEffect(() => {
    if (!selectedShop) return;
    setShopForm({
      shopName: selectedShop.shopName || '', shopDescription: selectedShop.shopDescription || '',
      address: selectedShop.address || '', city: selectedShop.city || '',
      phone: selectedShop.phone || '', email: selectedShop.email || '',
      deliveryRange: selectedShop.deliveryRange || '', logoUrl: selectedShop.logoUrl || '',
      bannerUrl: selectedShop.bannerUrl || '',
    });
    setError('');
    setSuccess('');
  }, [selectedShop]);

  const handleShopSave = async () => {
    setSavingShop(true);
    setError('');
    setSuccess('');
    try {
      await shopsService.update(selectedShop.id, shopForm);
      if (onShopUpdate) await onShopUpdate();
      setSuccess('Información actualizada');
    } catch (e) {
      console.error(e);
      setError('Error al guardar');
    } finally {
      setSavingShop(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div>
        <label style={sectionTitle}>Nombre</label>
        <input style={smallInput} value={shopForm.shopName} onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Ciudad</label>
        <input style={smallInput} value={shopForm.city} onChange={(e) => setShopForm((p) => ({ ...p, city: e.target.value }))} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={sectionTitle}>Descripción</label>
        <textarea style={{ ...inputStyle, height: 'auto', minHeight: '70px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={shopForm.shopDescription} onChange={(e) => setShopForm((p) => ({ ...p, shopDescription: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Dirección</label>
        <input style={smallInput} value={shopForm.address} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Teléfono</label>
        <input style={smallInput} value={shopForm.phone} onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Email</label>
        <input style={smallInput} value={shopForm.email} onChange={(e) => setShopForm((p) => ({ ...p, email: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Cobertura (km)</label>
        <input style={smallInput} value={shopForm.deliveryRange} onChange={(e) => setShopForm((p) => ({ ...p, deliveryRange: e.target.value }))} />
      </div>
      <div>
        <label style={sectionTitle}>Logo</label>
        <ImageUploader folder="shops/logos" currentImageUrl={shopForm.logoUrl} onUploadComplete={(url) => setShopForm((p) => ({ ...p, logoUrl: url }))} label="Logo" aspectRatio="1/1" />
      </div>
      <div>
        <label style={sectionTitle}>Banner</label>
        <ImageUploader folder="shops/banners" currentImageUrl={shopForm.bannerUrl} onUploadComplete={(url) => setShopForm((p) => ({ ...p, bannerUrl: url }))} label="Banner" aspectRatio="3/1" />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={handleShopSave} disabled={savingShop} style={{ ...btnPrimary, fontSize: '13px', padding: '10px 28px', opacity: savingShop ? 0.7 : 1 }}>{savingShop ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  );
}

OwnerTabInfo.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
  onShopUpdate: PropTypes.func,
};
