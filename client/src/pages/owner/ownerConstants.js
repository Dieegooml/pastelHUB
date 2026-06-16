export const STATUS_TRANSLATIONS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  on_the_way: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado',
};
export const STATUS_COLORS = {
  pending: { bg: '#fff8e1', color: '#f59e0b' }, confirmed: { bg: '#e1f5ee', color: '#1D9E75' },
  preparing: { bg: '#e3f2fd', color: '#2196f3' }, on_the_way: { bg: '#fff3e0', color: '#e65100' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32' }, cancelled: { bg: '#fee2e2', color: '#ef4444' },
};
export const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
export const PROMO_TYPE_LABELS = { discount: 'Descuento', combo: 'Combo', bogo: '2x1' };

export const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return (d || '').slice(0, 10);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};
