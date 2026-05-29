import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, font, selectStyle, badge, btnSmallPrimary, tableHeaderStyle } from '../../styles/theme';
import { ordersService } from '../../services/ordersService';
import { STATUS_TRANSLATIONS, STATUS_COLORS, ALL_STATUSES } from './ownerConstants';

export default function OwnerTabOrders({ selectedShop, setError, setSuccess }) {
  const [orders, setOrders] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({});

  useEffect(() => {
    if (!selectedShop?.id) return;
    ordersService.getByShop(selectedShop.id).then((data) => setOrders(data?.data || [])).catch(() => {});
  }, [selectedShop]);

  const handleOrderStatus = async (id) => {
    if (!statusUpdate[id]) return;
    try {
      await ordersService.updateStatus(id, statusUpdate[id]);
      setStatusUpdate((p) => ({ ...p, [id]: '' }));
      setSuccess('Estado actualizado');
      const data = await ordersService.getByShop(selectedShop.id);
      setOrders(data?.data || []);
    } catch { setError('Error al actualizar estado'); }
  };

  const statusBadge = (key) => {
    const c = STATUS_COLORS[key] || STATUS_COLORS.pending;
    return <span style={badge(c.bg, c.color)}>{STATUS_TRANSLATIONS[key] || key}</span>;
  };

  return (
    <div style={{ background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontFamily: font.body, fontSize: '14px' }}>No hay órdenes para esta pastelería</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: colors.grayLight, textAlign: 'left' }}>
              <th style={tableHeaderStyle}>Orden</th><th style={tableHeaderStyle}>Cliente</th><th style={tableHeaderStyle}>Total</th><th style={tableHeaderStyle}>Estado</th><th style={tableHeaderStyle}>Actualizar</th>
            </tr></thead>
            <tbody>
              {orders.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{o.id?.slice(0, 8)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{o.customer?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: colors.primary, fontFamily: font.body }}>S/ {(o.totals?.total || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(o.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select style={{ ...selectStyle, height: '32px', padding: '0 8px', fontSize: '11px', width: '120px' }}
                        value={statusUpdate[o.id] || ''} onChange={(e) => setStatusUpdate((s) => ({ ...s, [o.id]: e.target.value }))}>
                        <option value="">—</option>
                        {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_TRANSLATIONS[s]}</option>)}
                      </select>
                      <button onClick={() => handleOrderStatus(o.id)} style={btnSmallPrimary}>OK</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
