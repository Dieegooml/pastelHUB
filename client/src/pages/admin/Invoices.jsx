import { useEffect, useState, Fragment, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { invoicesService } from '../../services/invoicesService';
import { colors, font, badge as themeBadge, tableHeaderStyle, selectStyle } from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const STATUSES = ['all', 'issued', 'cancelled'];
const STATUS_TRANS = { issued: 'Emitida', cancelled: 'Anulada' };
const STATUS_COLORS = { issued: { bg: '#e8f5e9', color: '#2e7d32' }, cancelled: { bg: '#fee2e2', color: '#ef4444' } };

const smallSelect = { ...selectStyle, height: '36px', padding: '0 12px', fontSize: '13px' };

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function Invoices() {
  const isMobile = useIsMobile(768);
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState({});
  const [orderId, setOrderId] = useState('');
  const [generating, setGenerating] = useState(false);

  const HEADERS = ['Boleta', 'Fecha', 'Pastelería', 'Cliente', 'Total', 'Estado', 'Acciones'];

  const load = async () => {
    try {
      setLoading(true);
      const res = filter === 'all' ? await invoicesService.getAll() : await invoicesService.getAll();
      let list = res?.data || [];
      if (filter !== 'all') list = list.filter((i) => i.status === filter);
      setInvoices(list);
    } catch (e) { setError('Error al cargar boletas'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleGenerate = async () => {
    if (!orderId.trim()) return;
    setGenerating(true);
    try {
      await invoicesService.generate(orderId.trim());
      setSuccess('Boleta generada correctamente');
      setOrderId('');
      load();
    } catch (e) { setError(e.response?.data?.error || 'Error al generar boleta'); } finally { setGenerating(false); }
  };

  const handleUpdateStatus = async (id) => {
    if (!newStatus[id]) return;
    try {
      await invoicesService.updateStatus(id, newStatus[id]);
      setNewStatus((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      load();
    } catch (e) { setError('Error al actualizar estado'); }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    const url = invoicesService.downloadPdf(id);
    window.open(token ? `${url}?token=${token}` : url, '_blank');
  };

  const statusBadge = (s) => {
    const c = STATUS_COLORS[s] || STATUS_COLORS.issued;
    return <span style={themeBadge(c.bg, c.color)}>{STATUS_TRANS[s] || s}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1rem 1rem 2rem' : '40px 2rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: colors.primary, margin: 0 }}>Boletas</h2>
          <span style={{ background: '#f0f0f0', color: colors.primary, padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, fontFamily: font.body }}>{invoices.length}</span>
        </div>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '24px' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</motion.div>}
        {error && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</motion.div>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'end', background: colors.white, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: font.body }}>Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Ingresa ID de orden" style={{
              height: '36px', padding: '0 12px', fontSize: '13px', fontFamily: font.body,
              border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.white,
              outline: 'none', minWidth: '200px',
            }} />
          </div>
          <button onClick={handleGenerate} disabled={generating || !orderId.trim()} style={{
            padding: '8px 20px', background: colors.accent, color: '#fff', border: 'none', borderRadius: '99px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: font.body,
            opacity: generating || !orderId.trim() ? 0.6 : 1,
          }}>{generating ? 'Generando...' : 'Generar boleta'}</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
              fontWeight: filter === s ? 600 : 500, fontFamily: font.body,
              border: filter === s ? 'none' : `1px solid #ddd`,
              background: filter === s ? colors.primary : 'transparent',
              color: filter === s ? '#fff' : '#666', transition: 'all 0.2s ease',
            }}>{s === 'all' ? 'Todas' : STATUS_TRANS[s]}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {invoices.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ color: '#999', fontSize: '15px', margin: 0, fontFamily: font.body }}>No hay boletas que mostrar</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                    {HEADERS.map((h) => <th key={h} style={tableHeaderStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={inv.id} style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: colors.accent }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: colors.textSecondary, fontFamily: font.body }}>{formatDate(inv.issueDate)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: font.body }}>{inv.shopName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: font.body }}>{inv.customerName}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, fontFamily: font.body, color: colors.primary }}>S/ {(inv.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>{statusBadge(inv.status)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {inv.status === 'issued' && (
                              <button onClick={() => handleDownload(inv.id)} style={{
                                padding: '4px 12px', background: colors.accent, color: '#fff', border: 'none',
                                borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body,
                              }}>PDF</button>
                            )}
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <select style={{ ...smallSelect, height: '30px', fontSize: '11px' }} value={newStatus[inv.id] || ''} onChange={(e) => setNewStatus((p) => ({ ...p, [inv.id]: e.target.value }))}>
                                <option value="">Anular</option>
                                <option value="cancelled">Anular</option>
                              </select>
                              <button onClick={() => handleUpdateStatus(inv.id)} disabled={!newStatus[inv.id]} style={{
                                padding: '4px 10px', background: colors.error, color: '#fff', border: 'none',
                                borderRadius: '99px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: font.body,
                                opacity: newStatus[inv.id] ? 1 : 0.5,
                              }}>OK</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
