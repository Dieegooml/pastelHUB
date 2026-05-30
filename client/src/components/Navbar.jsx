import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../styles/theme';
import { notificationsService } from '../services/notificationsService';

const TYPE_ICONS = {
  order_update: '🛵',
  new_review: '⭐',
  shop_approved: '✅',
  shop_rejected: '❌',
  shop_suspended: '🚫',
  report_resolved: '📋',
  new_order: '🆕',
  payment_confirmed: '💳',
};

const TYPE_LABELS_SHORT = {
  order_update: 'Estado de orden',
  new_review: 'Nueva reseña',
  shop_approved: 'Pastelería aprobada',
  shop_rejected: 'Pastelería rechazada',
  shop_suspended: 'Pastelería suspendida',
  report_resolved: 'Reporte resuelto',
  new_order: 'Nueva orden',
  payment_confirmed: 'Pago confirmado',
};

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const isAdmin = user?.roles?.includes('admin');
  const isOwner = user?.roles?.includes('owner');

  const loadUnread = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getUnreadCount(user.uid);
      setUnreadCount(res?.count ?? 0);
    } catch (e) { console.error(e); }
  }, [user?.uid]);

  const loadRecent = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await notificationsService.getUnreadByUser(user.uid);
      const list = Array.isArray(res) ? res : res?.data || [];
      setRecentNotifs(list.slice(0, 5));
    } catch (e) { console.error(e); }
  }, [user?.uid]);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  useEffect(() => {
    if (showDropdown) loadRecent();
  }, [showDropdown, loadRecent]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      try { await notificationsService.markAsRead(n.id); } catch (e) { console.error(e); }
    }
    setShowDropdown(false);
    loadUnread();
    navigate('/notifications');
  };

  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: '99px', border: active ? 'none' : `1px solid ${colors.border}`,
    fontSize: '13px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
    background: active ? colors.primary : colors.white,
    color: active ? '#fff' : colors.textSecondary,
    transition: 'all 0.2s ease',
  });

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '64px',
      background: colors.white, borderBottom: `1px solid ${colors.border}`,
      fontFamily: font.body,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        <img src="/favicon.png" alt="PastelHub" style={{ height: '32px', width: '32px', borderRadius: '6px' }} />
        <span style={{ fontFamily: font.heading, fontSize: '20px', fontWeight: 700, color: colors.primary }}>
          PastelHub
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => navigate('/')} style={btnStyle(location.pathname === '/')}>
          Inicio
        </button>

        <button onClick={() => navigate('/cart')} style={btnStyle(location.pathname === '/cart')}>
          Carrito
        </button>

        <button onClick={() => navigate('/my-orders')} style={btnStyle(location.pathname.startsWith('/my-orders'))}>
          Mis órdenes
        </button>

        <button onClick={() => navigate('/profile')} style={btnStyle(location.pathname === '/profile')}>
          Perfil
        </button>

        {isOwner && (
          <button onClick={() => navigate('/owner')} style={{
            ...btnStyle(location.pathname === '/owner'),
            background: location.pathname === '/owner' ? '#e65100' : colors.white,
            color: location.pathname === '/owner' ? '#fff' : colors.textSecondary,
            border: location.pathname === '/owner' ? 'none' : `1px solid ${colors.border}`,
          }}>
            Dueño
          </button>
        )}

        {isAdmin && (
          <button onClick={() => navigate('/admin')} style={{
            padding: '8px 16px', borderRadius: '99px',
            border: location.pathname.startsWith('/admin') ? 'none' : `1px solid ${colors.border}`,
            fontSize: '13px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
            background: location.pathname.startsWith('/admin') ? colors.accent : colors.white,
            color: location.pathname.startsWith('/admin') ? '#fff' : colors.textSecondary,
            transition: 'all 0.2s ease',
          }}>
            Administrar
          </button>
        )}

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={handleBellClick} style={{
            padding: '8px', borderRadius: '99px', border: `1px solid ${colors.border}`,
            fontSize: '18px', lineHeight: '1', cursor: 'pointer',
            background: colors.white, color: colors.text, transition: 'all 0.2s ease',
            position: 'relative',
          }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-6px',
                background: '#EF4444', color: '#fff',
                fontSize: '10px', fontWeight: 700,
                minWidth: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '99px', padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div ref={dropdownRef} style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '320px', background: colors.white,
              borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: `1px solid ${colors.border}`, overflow: 'hidden',
              zIndex: 1000,
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: `1px solid ${colors.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>Notificaciones</span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '11px', color: colors.textMuted,
                  }}>
                    {unreadCount} sin leer
                  </span>
                )}
              </div>

              {recentNotifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                  No hay notificaciones nuevas
                </div>
              ) : (
                recentNotifs.map((n) => (
                  <div key={n.id} onClick={() => handleNotifClick(n)} style={{
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: `1px solid ${colors.border}`,
                    background: n.isRead ? colors.white : '#fafffd',
                    transition: 'background 0.15s ease',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.grayLight}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? colors.white : '#fafffd'}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {TYPE_LABELS_SHORT[n.type] || n.type}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.message}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div onClick={() => { setShowDropdown(false); navigate('/notifications'); }} style={{
                padding: '10px 16px', textAlign: 'center', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, color: colors.accent,
                borderTop: `1px solid ${colors.border}`,
                transition: 'background 0.15s ease',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.grayLight}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.white}
              >
                Ver todas las notificaciones
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: '13px', color: colors.textMuted, margin: '0 4px' }}>
          {user?.email}
        </span>

        <button onClick={() => { signOut(auth); navigate('/login'); }}
          style={{
            padding: '6px 14px', borderRadius: '99px', border: 'none',
            fontSize: '12px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
            background: colors.errorBg, color: colors.error, transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
          onMouseLeave={(e) => e.target.style.background = colors.errorBg}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
