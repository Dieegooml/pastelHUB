import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { colors, font } from '../../styles/theme';
import { shopsService } from '../../services/shopsService';
import OwnerTabInfo from './OwnerTabInfo';
import OwnerTabProducts from './OwnerTabProducts';
import OwnerTabOrders from './OwnerTabOrders';
import OwnerTabPromotions from './OwnerTabPromotions';
import OwnerTabSummary from './OwnerTabSummary';
import OwnerTabBoletas from './OwnerTabBoletas';

const TABS = ['info', 'products', 'orders', 'promotions', 'summary', 'boletas'];
const TAB_LABELS = { info: 'Información', products: 'Productos', orders: 'Órdenes', promotions: 'Promociones', summary: 'Resumen', boletas: 'Boletas' };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedShop = shops[selectedIdx];

  useEffect(() => {
    const load = async () => {
      try {
        const all = await shopsService.getAll();
        const owned = (all?.data || []).filter((s) => s.owner_id === user?.uid);
        setShops(owned);
      } catch (e) { console.error(e); setError(e.message || 'Error al cargar pastelerías'); } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const refreshShops = useCallback(async () => {
    try {
      const all = await shopsService.getAll();
      setShops((all?.data || []).filter((s) => s.owner_id === user?.uid));
    } catch (e) { console.error(e); setError(e.message || 'Error al recargar'); }
  }, [user?.uid]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 2rem' }}>
          {[1, 2].map((i) => <div key={i} style={{ height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', marginBottom: '16px', animation: 'shimmer 1.5s infinite' }} />)}
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '12px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>No tienes pastelerías registradas</p>
          <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontFamily: font.body }}>Solicita a un administrador que te asigne una pastelería</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '4px' }}>Panel de Dueño</h2>
        <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.textMuted, margin: '0 0 24px' }}>Administra tus pastelerías, productos y órdenes</p>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        {shops.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {shops.map((s, i) => (
              <button key={s.id} onClick={() => { setSelectedIdx(i); setTab('info'); }}
                style={{
                  padding: '8px 18px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px', fontWeight: selectedIdx === i ? 600 : 500,
                  fontFamily: font.body, border: selectedIdx === i ? 'none' : `1px solid ${colors.border}`,
                  background: selectedIdx === i ? colors.accent : colors.white,
                  color: selectedIdx === i ? '#fff' : colors.textSecondary, transition: 'all 0.2s ease',
                }}
              >{s.shopName}</button>
            ))}
          </div>
        )}

        {selectedShop && (
          <>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '8px 18px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 500,
                    fontFamily: font.body, border: 'none', background: tab === t ? colors.primary : 'transparent',
                    color: tab === t ? '#fff' : colors.textSecondary, transition: 'all 0.2s ease',
                  }}
                >{TAB_LABELS[t]}</button>
              ))}
            </div>

            {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}
            {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}

            {tab === 'info' && <OwnerTabInfo selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} onShopUpdate={refreshShops} />}
            {tab === 'products' && <OwnerTabProducts selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} />}
            {tab === 'orders' && <OwnerTabOrders selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} />}
            {tab === 'promotions' && <OwnerTabPromotions selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} />}
            {tab === 'summary' && <OwnerTabSummary selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} />}
            {tab === 'boletas' && <OwnerTabBoletas selectedShop={selectedShop} setError={setError} setSuccess={setSuccess} />}
          </>
        )}
      </motion.div>
    </div>
  );
}
