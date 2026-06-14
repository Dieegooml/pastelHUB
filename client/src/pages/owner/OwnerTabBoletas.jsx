import { useEffect, useState, useMemo } from 'react';
import { colors, font, badge as badgeStyle, animStagger, animFadeIn } from '../../styles/theme';
import { invoicesService } from '../../services/invoicesService';
import PropTypes from 'prop-types';

const STATUS_COLORS = { issued: { bg: '#e8f5e9', color: '#2e7d32' }, cancelled: { bg: '#fee2e2', color: '#ef4444' } };
const STATUS_TRANS = { issued: 'Emitida', cancelled: 'Anulada' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function OwnerTabBoletas({ selectedShop, setError, setSuccess }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!selectedShop?.id) return;
    const load = async () => {
      try {
        const res = await invoicesService.getByShop(selectedShop.id);
        setInvoices(Array.isArray(res) ? res : res?.data || []);
      } catch (e) {
        setError(e.response?.data?.error || 'Error al cargar boletas');
      } finally { setLoading(false); }
    };
    load();
  }, [selectedShop?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      await invoicesService.downloadPdf(id);
    } catch (err) {
      setError(err.message || 'Error al descargar PDF');
    } finally {
      setDownloading(null);
    }
  };

  const badge = (status) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.issued;
    return <span style={badgeStyle(c.bg, c.color)}>{STATUS_TRANS[status] || status}</span>;
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: colors.textMuted, fontFamily: font.body }}>Cargando boletas...</div>;
  }

  return (
    <div style={{ ...animFadeIn }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {['all', 'issued', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '5px 14px', borderRadius: '99px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500, fontFamily: font.body,
            background: filter === s ? colors.primary : colors.white,
            color: filter === s ? '#fff' : colors.textSecondary,
            border: filter === s ? 'none' : `1px solid ${colors.border}`,
            transition: 'all 0.2s ease',
          }}>{s === 'all' ? 'Todas' : STATUS_TRANS[s]}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', fontFamily: font.body, fontSize: '14px' }}>
          No hay boletas para esta pastelería
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((inv, i) => (
            <div key={inv.id} style={{
                ...animStagger(i * 0.03),
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: colors.white, borderRadius: '10px',
                border: `1px solid ${colors.border}`, transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = colors.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = colors.border; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: colors.accent }}>{inv.invoiceNumber}</span>
                  <span style={{ fontFamily: font.body, fontSize: '13px', color: colors.text, fontWeight: 500 }}>{inv.customerName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: font.body, fontSize: '12px', color: colors.textMuted }}>{formatDate(inv.issueDate)}</span>
                  <span style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 700, color: colors.primary }}>S/ {(inv.total || 0).toFixed(2)}</span>
                  {badge(inv.status)}
                </div>
              </div>
              {inv.status === 'issued' && (
                <button onClick={() => handleDownload(inv.id)} disabled={downloading === inv.id} style={{
                  padding: '6px 14px', background: colors.accent, color: '#fff', border: 'none',
                  borderRadius: '99px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: font.body,
                  opacity: downloading === inv.id ? 0.6 : 1,
                }}>
                  {downloading === inv.id ? '...' : 'PDF'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

OwnerTabBoletas.propTypes = {
  selectedShop: PropTypes.object,
  setError: PropTypes.func,
  setSuccess: PropTypes.func,
};
