import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import Tooltip from './Tooltip';
import { colors, font } from '../styles/theme';
import { notificationsService } from '../services/notificationsService';

const TYPE_ICONS = {
  order_update: '\u{1F6F5}',
  new_review: '\u{2B50}',
  shop_approved: '\u{2705}',
  shop_rejected: '\u{274C}',
  shop_suspended: '\u{1F6AB}',
  report_resolved: '\u{1F4CB}',
  new_order: '\u{1F195}',
  payment_confirmed: '\u{1F4B3}',
  review_approved: '\u{1F44D}',
  review_rejected: '\u{1F44E}',
};

export default function Navbar() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  const isAdmin = user?.roles?.includes('admin');
  const isOwner = user?.roles?.includes('owner');
  const isModerator = user?.roles?.includes('moderator');

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
    let interval = setInterval(loadUnread, 120000);
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        loadUnread();
        interval = setInterval(loadUnread, 120000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
      if (
        langRef.current && !langRef.current.contains(e.target)
      ) setShowLang(false);
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
          {t('nav.home')}
        </button>

        <button onClick={() => navigate('/cart')} style={btnStyle(location.pathname === '/cart')}>
          {t('nav.cart')}
        </button>

        <button onClick={() => navigate('/my-orders')} style={btnStyle(location.pathname.startsWith('/my-orders'))}>
          {t('nav.orders')}
        </button>

        <button onClick={() => navigate('/invoices')} style={btnStyle(location.pathname.startsWith('/invoices'))}>
          {t('nav.invoices')}
        </button>

        <button onClick={() => navigate('/support')} style={btnStyle(location.pathname.startsWith('/support'))}>
          {t('nav.support')}
        </button>

        <button onClick={() => navigate('/profile')} style={btnStyle(location.pathname === '/profile')}>
          {t('nav.profile')}
        </button>

        {isOwner && (
          <button onClick={() => navigate('/owner')} style={{
            ...btnStyle(location.pathname === '/owner'),
            background: location.pathname === '/owner' ? '#e65100' : colors.white,
            color: location.pathname === '/owner' ? '#fff' : colors.textSecondary,
            border: location.pathname === '/owner' ? 'none' : `1px solid ${colors.border}`,
          }}>
            {t('nav.owner')}
          </button>
        )}

        {isModerator && !isAdmin && (
          <button onClick={() => navigate('/moderator')} style={{
            padding: '8px 16px', borderRadius: '99px',
            border: location.pathname.startsWith('/moderator') || location.pathname === '/support' ? 'none' : `1px solid ${colors.border}`,
            fontSize: '13px', fontWeight: 500, fontFamily: font.body, cursor: 'pointer',
            background: location.pathname.startsWith('/moderator') || location.pathname === '/support' ? '#7c3aed' : colors.white,
            color: location.pathname.startsWith('/moderator') || location.pathname === '/support' ? '#fff' : colors.textSecondary,
            transition: 'all 0.2s ease',
          }}>
            {t('nav.moderate')}
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
            {t('nav.admin')}
          </button>
        )}

        <div ref={langRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowLang((p) => !p)} style={{
            padding: '8px 10px', borderRadius: '99px', border: `1px solid ${colors.border}`,
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            background: colors.white, color: colors.text,
            fontFamily: font.body, transition: 'all 0.2s ease',
          }}>
            {lang === 'es' ? 'ES' : 'EN'}
          </button>
          {showLang && (
            <div ref={langRef} style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: colors.white, borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: `1px solid ${colors.border}`, overflow: 'hidden',
              zIndex: 1001, minWidth: '110px',
            }}>
              {[
                { code: 'es', label: t('nav.spanish') },
                { code: 'en', label: t('nav.english') },
              ].map((l) => (
                <div key={l.code}
                  onClick={() => { setLang(l.code); setShowLang(false); }}
                  style={{
                    padding: '8px 14px', cursor: 'pointer',
                    fontSize: '13px', fontFamily: font.body,
                    background: lang === l.code ? '#f0fdf4' : colors.white,
                    color: lang === l.code ? '#1D9E75' : colors.text,
                    fontWeight: lang === l.code ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = lang === l.code ? '#f0fdf4' : colors.white}
                >
                  {l.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={bellRef} style={{ position: 'relative' }}>
          <Tooltip text="Notificaciones">
            <button onClick={handleBellClick} style={{
              padding: '8px', borderRadius: '99px', border: `1px solid ${colors.border}`,
              fontSize: '18px', lineHeight: '1', cursor: 'pointer',
              background: colors.white, color: colors.text, transition: 'all 0.2s ease',
              position: 'relative',
            }}>
              {'\u{1F514}'}
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
          </Tooltip>

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
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{t('notifications.title')}</span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '11px', color: colors.textMuted,
                  }}>
                    {unreadCount} {t('notifications.unread')}
                  </span>
                )}
              </div>

              {recentNotifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                  {t('notifications.noNotifications')}
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
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{TYPE_ICONS[n.type] || '\u{1F514}'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t(`notifications.types.${n.type}`, n.type)}
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
                {t('notifications.viewAll')}
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
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  );
}
