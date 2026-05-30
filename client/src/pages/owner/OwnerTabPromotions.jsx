import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, font, inputStyle, selectStyle, badge, btnSmallPrimary, btnGhost, btnDanger } from '../../styles/theme';
import { promotionsService } from '../../services/promotionsService';
import { smallInput, sectionTitle, formatDate, PROMO_TYPE_LABELS } from './ownerConstants';

const INITIAL_PROMO_FORM = {
  promoName: '', promoType: 'discount', promoDescription: '',
  discountPercentage: '', discountAmount: '',
  comboItems: '', comboPrice: '',
  productIds: '', startDate: '', endDate: '', isActive: true,
};

export default function OwnerTabPromotions({ selectedShop, setError, setSuccess }) {
  const [promotions, setPromotions] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editPromoId, setEditPromoId] = useState(null);
  const [promoForm, setPromoForm] = useState(INITIAL_PROMO_FORM);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (!selectedShop?.id) return;
    promotionsService.getByShopAll(selectedShop.id)
      .then((res) => setPromotions(Array.isArray(res) ? res : res?.data || []))
      .catch((e) => console.error(e));
  }, [selectedShop]);

  const resetPromoForm = () => {
    setPromoForm(INITIAL_PROMO_FORM);
    setEditPromoId(null);
    setShowPromoForm(false);
  };

  const handlePromoSave = async () => {
    if (!promoForm.promoName) { setError('Nombre requerido'); return; }
    setError('');
    setSuccess('');
    setPromoLoading(true);
    try {
      const payload = {
        shop_id: selectedShop.id,
        name: promoForm.promoName,
        type: promoForm.promoType,
        description: promoForm.promoDescription,
        discount_percentage: promoForm.discountPercentage ? Number(promoForm.discountPercentage) : null,
        discount_amount: promoForm.discountAmount ? Number(promoForm.discountAmount) : null,
        combo_items: promoForm.comboItems ? promoForm.comboItems.split(',').map((s) => s.trim()).map((pid) => ({ product_id: pid })) : [],
        combo_price: promoForm.comboPrice ? Number(promoForm.comboPrice) : null,
        product_ids: promoForm.productIds ? promoForm.productIds.split(',').map((s) => s.trim()) : [],
        start_date: promoForm.startDate || new Date().toISOString().slice(0, 10),
        end_date: promoForm.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        is_active: promoForm.isActive,
      };
      if (editPromoId) {
        await promotionsService.update(editPromoId, payload);
        setSuccess('Promoción actualizada');
      } else {
        await promotionsService.create(payload);
        setSuccess('Promoción creada');
      }
      resetPromoForm();
      const res = await promotionsService.getByShopAll(selectedShop.id);
      setPromotions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) { console.error(e); setError('Error al guardar promoción'); } finally { setPromoLoading(false); }
  };

  const handlePromoDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      await promotionsService.delete(id);
      setSuccess('Promoción eliminada');
      const res = await promotionsService.getByShopAll(selectedShop.id);
      setPromotions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  const handlePromoToggle = async (id) => {
    try {
      await promotionsService.toggle(id);
      const res = await promotionsService.getByShopAll(selectedShop.id);
      setPromotions(Array.isArray(res) ? res : res?.data || []);
    } catch (e) { console.error(e); setError('Error al cambiar estado'); }
  };

  const handleEditPromo = (p) => {
    setPromoForm({
      promoName: p.name || '',
      promoType: p.type || 'discount',
      promoDescription: p.description || '',
      discountPercentage: p.discount_percentage ?? '',
      discountAmount: p.discount_amount ?? '',
      comboItems: (p.combo_items || []).map((c) => c.product_id).join(', '),
      comboPrice: p.combo_price ?? '',
      productIds: (p.product_ids || []).join(', '),
      startDate: p.start_date ? p.start_date.slice(0, 10) : '',
      endDate: p.end_date ? p.end_date.slice(0, 10) : '',
      isActive: p.is_active !== false,
    });
    setEditPromoId(p.id);
    setShowPromoForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: font.body }}>{promotions.length} {promotions.length === 1 ? 'promoción' : 'promociones'}</span>
        <button onClick={() => { resetPromoForm(); setShowPromoForm(!showPromoForm); }} style={btnSmallPrimary}>{showPromoForm ? 'Cancelar' : '+ Nueva promoción'}</button>
      </div>

      {showPromoForm && (
        <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', marginBottom: '20px' }}>
          <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: 0, marginBottom: '14px' }}>{editPromoId ? 'Editar promoción' : 'Nueva promoción'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={sectionTitle}>Nombre *</label><input style={smallInput} value={promoForm.promoName} onChange={(e) => setPromoForm((p) => ({ ...p, promoName: e.target.value }))} /></div>
            <div><label style={sectionTitle}>Tipo</label><select style={{ ...selectStyle, height: '40px', fontSize: '13px' }} value={promoForm.promoType} onChange={(e) => setPromoForm((p) => ({ ...p, promoType: e.target.value }))}>
              {Object.entries(PROMO_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
            {promoForm.promoType === 'discount' && (
              <>
                <div><label style={sectionTitle}>% Descuento</label><input style={smallInput} type="number" step="0.01" min="0" max="100" value={promoForm.discountPercentage} onChange={(e) => setPromoForm((p) => ({ ...p, discountPercentage: e.target.value }))} /></div>
                <div><label style={sectionTitle}>Monto fijo S/</label><input style={smallInput} type="number" step="0.01" min="0" value={promoForm.discountAmount} onChange={(e) => setPromoForm((p) => ({ ...p, discountAmount: e.target.value }))} /></div>
              </>
            )}
            {promoForm.promoType === 'combo' && (
              <>
                <div><label style={sectionTitle}>IDs de productos (separados por coma)</label><input style={smallInput} value={promoForm.comboItems} onChange={(e) => setPromoForm((p) => ({ ...p, comboItems: e.target.value }))} /></div>
                <div><label style={sectionTitle}>Precio combo S/</label><input style={smallInput} type="number" step="0.01" min="0" value={promoForm.comboPrice} onChange={(e) => setPromoForm((p) => ({ ...p, comboPrice: e.target.value }))} /></div>
              </>
            )}
            <div style={{ gridColumn: '1 / -1' }}><label style={sectionTitle}>Descripción</label><textarea style={{ ...inputStyle, height: 'auto', minHeight: '50px', padding: '10px 14px', fontSize: '13px', resize: 'vertical' }} value={promoForm.promoDescription} onChange={(e) => setPromoForm((p) => ({ ...p, promoDescription: e.target.value }))} /></div>
            <div><label style={sectionTitle}>Inicio</label><input style={smallInput} type="date" value={promoForm.startDate} onChange={(e) => setPromoForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label style={sectionTitle}>Fin</label><input style={smallInput} type="date" value={promoForm.endDate} onChange={(e) => setPromoForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
            <div><label style={sectionTitle}>IDs de productos (vacío = todos)</label><input style={smallInput} value={promoForm.productIds} onChange={(e) => setPromoForm((p) => ({ ...p, productIds: e.target.value }))} /></div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontFamily: font.body, color: colors.text, cursor: 'pointer', marginTop: '24px' }}>
                <input type="checkbox" checked={promoForm.isActive} onChange={(e) => setPromoForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Activa
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={handlePromoSave} disabled={promoLoading} style={{ ...btnSmallPrimary, opacity: promoLoading ? 0.7 : 1 }}>{promoLoading ? 'Guardando...' : editPromoId ? 'Actualizar' : 'Crear promoción'}</button>
            <button onClick={resetPromoForm} style={btnGhost}>Cancelar</button>
          </div>
        </div>
      )}

      {promotions.length === 0 && !showPromoForm ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontFamily: font.body, fontSize: '14px' }}>No hay promociones para esta pastelería. Crea tu primera promoción.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {promotions.map((p) => {
            const now = new Date();
            const end = new Date(p.end_date);
            const expired = end < now;
            const active = p.is_active && !expired;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: colors.white, borderRadius: '12px', padding: '16px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: active ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 600, color: colors.primary }}>{p.name}</span>
                    <span style={badge(p.type === 'discount' ? '#e3f2fd' : p.type === 'combo' ? '#fce4ec' : '#fff3e0', colors.text)}>
                      {PROMO_TYPE_LABELS[p.type] || p.type}
                    </span>
                    {!p.is_active && <span style={badge('#fee2e2', '#ef4444')}>Inactiva</span>}
                    {expired && <span style={badge('#f3f4f6', '#999')}>Vencida</span>}
                    {active && <span style={badge('#d1fae5', '#1D9E75')}>Activa</span>}
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textSecondary, margin: '0 0 4px' }}>{p.description}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: colors.textMuted, fontFamily: font.body }}>
                    {p.discount_percentage != null && <span>{p.discount_percentage}% descuento</span>}
                    {p.discount_amount != null && <span>S/ {p.discount_amount.toFixed(2)} descuento</span>}
                    {p.combo_price != null && <span>Combo S/ {p.combo_price.toFixed(2)}</span>}
                    <span>{formatDate(p.start_date)} → {formatDate(p.end_date)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handlePromoToggle(p.id)} style={btnGhost}>
                    {p.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleEditPromo(p)} style={btnGhost}>Editar</button>
                  <button onClick={() => handlePromoDelete(p.id)} style={btnDanger}>Eliminar</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
