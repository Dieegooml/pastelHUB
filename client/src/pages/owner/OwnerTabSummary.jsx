import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, font } from '../../styles/theme';
import { ordersService } from '../../services/ordersService';
import { STATUS_TRANSLATIONS, STATUS_COLORS } from './ownerConstants';

export default function OwnerTabSummary({ selectedShop, setError, setSuccess }) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!selectedShop?.id) return;
    setSummaryLoading(true);
    ordersService.getSummary(selectedShop.id, 90)
      .then((res) => setSummary(res || null))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selectedShop]);

  return (
    <div>
      {summaryLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '100px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : !summary || summary.totalOrders === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted, fontFamily: font.body }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <p style={{ fontSize: '15px', margin: 0 }}>No hay datos de ventas para mostrar en los últimos 90 días</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Ingresos totales', value: `S/ ${summary.totalRevenue.toFixed(2)}`, color: colors.accent },
              { label: 'Órdenes totales', value: summary.totalOrders, color: colors.primary },
              { label: 'Ticket promedio', value: `S/ ${summary.avgOrderValue.toFixed(2)}`, color: '#e65100' },
              { label: 'Hoy', value: `S/ ${summary.revenueToday.toFixed(2)}`, color: '#2196f3' },
              { label: 'Esta semana', value: `S/ ${summary.revenueThisWeek.toFixed(2)}`, color: '#7c3aed' },
              { label: 'Este mes', value: `S/ ${summary.revenueThisMonth.toFixed(2)}`, color: '#f59e0b' },
            ].map((card) => (
              <div key={card.label}
                style={{
                  background: colors.white, borderRadius: '12px', padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${card.color}`,
                }}
              >
                <div style={{ fontSize: '12px', color: colors.textMuted, fontFamily: font.body, marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: card.color, fontFamily: font.heading }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: '0 0 16px' }}>Ventas diarias (últimos {summary.dailySales?.length || 0} días)</h4>
              {summary.dailySales?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px', paddingBottom: '20px', overflowX: 'auto' }}>
                  {(() => {
                    const max = Math.max(...summary.dailySales.map((d) => d.revenue), 1);
                    return summary.dailySales.map((d, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
                        <div style={{
                          width: '20px', height: `${Math.max((d.revenue / max) * 140, 4)}px`,
                          background: `linear-gradient(180deg, ${colors.accent}, #145e46)`,
                          borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease',
                          position: 'relative',
                        }} title={`${d.date}: S/ ${d.revenue.toFixed(2)}`}>
                          <span style={{
                            position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '8px', whiteSpace: 'nowrap', color: colors.textMuted,
                          }}>
                            {d.revenue > 0 ? `S/${Math.round(d.revenue)}` : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: '7px', color: colors.textMuted, marginTop: '4px', transform: 'rotate(-45deg)', transformOrigin: 'left center', whiteSpace: 'nowrap' }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '13px' }}>Sin datos</div>
              )}
            </div>

            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: '0 0 16px' }}>Ingresos mensuales</h4>
              {summary.monthlyRevenue?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', paddingBottom: '20px' }}>
                  {(() => {
                    const max = Math.max(...summary.monthlyRevenue.map((m) => m.revenue), 1);
                    return summary.monthlyRevenue.map((m, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '100%', maxWidth: '50px', height: `${Math.max((m.revenue / max) * 140, 4)}px`,
                          background: `linear-gradient(180deg, #7c3aed, #5b21b6)`,
                          borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease',
                        }} title={`${m.month}: S/ ${m.revenue.toFixed(2)}`}>
                        </div>
                        <span style={{ fontSize: '9px', color: colors.textMuted, marginTop: '6px', whiteSpace: 'nowrap' }}>
                          {m.month}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '13px' }}>Sin datos</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: '0 0 16px' }}>Órdenes por estado</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(summary.ordersByStatus || {}).map(([status, count]) => {
                  const total = summary.totalOrders || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#999' };
                  return (
                    <div key={status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: font.body, marginBottom: '4px' }}>
                        <span style={{ color: colors.text }}>{STATUS_TRANSLATIONS[status] || status}</span>
                        <span style={{ color: colors.textSecondary }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: '0 0 16px' }}>Productos más vendidos</h4>
              {summary.topProducts?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const maxQty = Math.max(...summary.topProducts.map((p) => p.quantity), 1);
                    return summary.topProducts.map((p, i) => (
                      <div key={p.product_id || i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, fontFamily: font.body, width: '16px' }}>#{i + 1}</span>
                            <span style={{ fontSize: '13px', color: colors.text, fontFamily: font.body }}>{p.name}</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: colors.accent, fontFamily: font.body }}>{p.quantity} vendidos</span>
                        </div>
                        <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.quantity / maxQty) * 100}%`, background: `linear-gradient(90deg, ${colors.accent}, #145e46)`, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '13px' }}>Sin datos de productos</div>
              )}
            </div>
          </div>

          {summary.revenueByMethod && Object.keys(summary.revenueByMethod).length > 0 && (
            <div style={{ background: colors.white, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontFamily: font.heading, fontSize: '15px', fontWeight: 600, color: colors.primary, margin: '0 0 16px' }}>Ingresos por método de pago</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {Object.entries(summary.revenueByMethod).map(([method, amount]) => (
                  <div key={method} style={{ textAlign: 'center', padding: '16px', background: colors.grayLight, borderRadius: '10px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                      {method === 'yape' ? '📱' : method === 'plin' ? '📱' : method === 'card' ? '💳' : method === 'cash' ? '💵' : '❓'}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textMuted, fontFamily: font.body, marginBottom: '2px', textTransform: 'capitalize' }}>{method}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: colors.primary, fontFamily: font.heading }}>S/ {amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
