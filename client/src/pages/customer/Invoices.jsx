import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { colors, font, badge as badgeStyle, cardStyle } from '../../styles/theme';
import { invoicesService } from '../../services/invoicesService';

const STATUS_COLORS = {
  issued: { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled: { bg: '#fee2e2', color: '#ef4444' },
};

const STATUS_TRANS = { issued: 'Emitida', cancelled: 'Anulada' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await invoicesService.getAll();
        setInvoices(Array.isArray(res) ? res : res?.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const badge = (status) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.issued;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANS[status] || status}</span>;
  };

  const handleDownload = async (e, id) => {
    e.stopPropagation();
    setDownloading(id);
    try {
      await invoicesService.downloadPdf(id);
    } catch (err) {
      console.error('Error al descargar PDF:', err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Mis Boletas</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {['all', 'issued', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, fontFamily: font.body,
              background: filter === s ? colors.primary : colors.white,
              color: filter === s ? '#fff' : colors.textSecondary,
              border: filter === s ? 'none' : `1px solid ${colors.border}`,
              transition: 'all 0.2s ease',
            }}>
              {s === 'all' ? 'Todas' : STATUS_TRANS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>
              {filter === 'all' ? 'No tienes boletas aún' : `No hay boletas ${STATUS_TRANS[filter]?.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ ...cardStyle, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', marginBottom: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = colors.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = colors.border; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: colors.accent }}>{inv.invoiceNumber}</span>
                    <span style={{ fontFamily: font.body, fontSize: '13px', color: colors.text, fontWeight: 500 }}>{inv.shopName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: font.body, fontSize: '12px', color: colors.textMuted }}>{formatDate(inv.issueDate)}</span>
                    <span style={{ fontFamily: font.heading, fontSize: '16px', fontWeight: 700, color: colors.primary }}>S/ {(inv.total || 0).toFixed(2)}</span>
                    {badge(inv.status)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {inv.status === 'issued' && (
                    <button onClick={(e) => handleDownload(e, inv.id)} disabled={downloading === inv.id} style={{
                      padding: '6px 14px', background: colors.accent, color: '#fff', border: 'none',
                      borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: font.body,
                      opacity: downloading === inv.id ? 0.6 : 1,
                    }}>
                      {downloading === inv.id ? 'Descargando...' : 'Descargar PDF'}
                    </button>
                  )}
                  <span style={{ color: colors.textMuted, fontSize: '18px' }}>→</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
