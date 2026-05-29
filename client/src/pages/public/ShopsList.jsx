import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { shopsService } from '../../services/shopsService';
import Navbar from '../../components/Navbar';
import { colors, font } from '../../styles/theme';

const STATUS_CONFIG = {
  approved:  { bg: '#e1f5ee', color: '#1D9E75', label: 'Aprobado' },
  pending:   { bg: '#fff8e1', color: '#f59e0b', label: 'Pendiente' },
  rejected:  { bg: '#fee2e2', color: '#ef4444', label: 'Rechazado' },
  suspended: { bg: '#f3f4f6', color: '#6b7280', label: 'Suspendido' },
};

const BANNER_PLACEHOLDERS = [
  'linear-gradient(135deg, #2D1F1F 0%, #1D9E75 100%)',
  'linear-gradient(135deg, #1D9E75 0%, #F9F4EE 100%)',
  'linear-gradient(135deg, #E8DDD5 0%, #2D1F1F 100%)',
  'linear-gradient(135deg, #F9F4EE 0%, #1D9E75 100%)',
  'linear-gradient(135deg, #2D1F1F 0%, #E8DDD5 100%)',
  'linear-gradient(135deg, #1D9E75 0%, #2D1F1F 100%)',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

function SkeletonCard() {
  return (
    <div style={{
      background: colors.white, borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ height: '160px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '1.2rem 1.5rem 1.5rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0e0e0', marginTop: '-48px', marginBottom: '12px', border: '3px solid white', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '20px', width: '60%', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '14px', width: '40%', background: '#e0e0e0', borderRadius: '4px', marginBottom: '12px', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '12px', width: '100%', background: '#e0e0e0', borderRadius: '4px', marginBottom: '4px', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '12px', width: '80%', background: '#e0e0e0', borderRadius: '4px', marginBottom: '16px', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '28px', width: '90px', background: '#e0e0e0', borderRadius: '99px', animation: 'shimmer 1.5s infinite' }} />
      </div>
    </div>
  );
}

export default function ShopsList() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await shopsService.getAll();
        setShops(data?.data || []);
      } catch {
        setError('Error al cargar las pastelerías');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const approved = shops.filter(s => s.approvalStatus === 'approved');
    if (!search.trim()) return approved;
    const q = search.toLowerCase();
    return approved.filter(s =>
      (s.shopName || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.shopDescription || s.description || '').toLowerCase().includes(q)
    );
  }, [shops, search]);

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${colors.primary} 0%, #1a6b4f 50%, ${colors.accent} 100%)`,
        padding: '4rem 2rem 5rem',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '10%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{
              fontFamily: font.heading, fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700, color: '#fff', margin: '0 0 12px',
              lineHeight: 1.15,
            }}>
              Descubre las mejores <br />
              <span style={{ color: '#F9F4EE', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)', textUnderlineOffset: '8px' }}>
                pastelerías artesanales
              </span>
            </h1>
            <p style={{
              fontFamily: font.body, fontSize: '16px', color: 'rgba(255,255,255,0.75)',
              maxWidth: '520px', lineHeight: 1.6, margin: '0 0 2rem',
            }}>
              Explora una selección de las mejores pastelerías locales. Encuentra tu postre favorito y ordénalo con un clic.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              borderRadius: '14px', padding: '6px 6px 6px 16px',
              maxWidth: '500px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <input
                placeholder="Buscar por nombre, ciudad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  padding: '14px 0', fontSize: '14px', fontFamily: font.body,
                  color: '#fff', outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: '8px', padding: '6px 10px',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#fff',
                  }}
                >✕</button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        maxWidth: '1100px', margin: '-1.5rem auto 2rem', padding: '0 1.5rem',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '24px',
          background: colors.white, borderRadius: '16px',
          padding: '1rem 1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.primary, fontFamily: font.body, lineHeight: 1.2 }}>
              {shops.filter(s => s.approvalStatus === 'approved').length}
            </div>
            <div style={{ fontSize: '12px', color: colors.textSecondary, fontFamily: font.body }}>
              pastelerías activas
            </div>
          </div>
          {filtered.length !== shops.filter(s => s.approvalStatus === 'approved').length && (
            <div style={{ fontSize: '13px', color: colors.textMuted, fontFamily: font.body }}>
              {filtered.length} resultados para "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: '1100px', margin: '0 auto 1rem', padding: '0 1.5rem' }}>
          <p style={{
            color: colors.error, fontFamily: font.body, fontSize: '14px',
            background: colors.errorBg, padding: '12px 16px', borderRadius: '8px',
            borderLeft: `3px solid ${colors.error}`,
          }}>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 3rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem',
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem', color: colors.textMuted, fontFamily: font.body,
          maxWidth: '1100px', margin: '0 auto',
        }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: colors.primary, margin: '0 0 6px' }}>
            {search ? 'Sin resultados' : 'No hay pastelerías disponibles'}
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            {search ? `No encontramos nada para "${search}"` : 'Vuelve pronto para descubrir nuevas opciones'}
          </p>
        </div>
      ) : (
        /* Cards Grid */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 3rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem',
          }}
        >
          {filtered.map((shop, index) => {
            const sc = STATUS_CONFIG[shop.approvalStatus] || STATUS_CONFIG.pending;
            const bannerBg = BANNER_PLACEHOLDERS[index % BANNER_PLACEHOLDERS.length];
            return (
              <motion.div
                key={shop.id}
                variants={cardVariants}
                onClick={() => navigate(`/shops/${shop.id}`)}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                style={{
                  background: colors.white, borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
              >
                {/* Banner */}
                <div style={{
                  position: 'relative', height: '160px', overflow: 'hidden',
                  background: bannerBg,
                }}>
                  {shop.bannerUrl ? (
                    <img src={shop.bannerUrl} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : null}
                  {/* Status badge on banner */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                  }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '99px',
                      fontSize: '11px', fontWeight: 600,
                      fontFamily: font.body,
                      background: sc.bg, color: sc.color,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative' }}>
                  {/* Logo avatar */}
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    overflow: 'hidden', marginTop: '-36px', marginBottom: '12px',
                    border: '3px solid white',
                    background: colors.bgBeige,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}>
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    {!shop.logoUrl && '🏪'}
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontFamily: font.heading, fontSize: '20px', fontWeight: 700,
                    color: colors.primary, margin: '0 0 4px',
                  }}>
                    {shop.shopName}
                  </h3>

                  {/* City & Rating */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '13px', color: colors.textSecondary, fontFamily: font.body,
                    marginBottom: '10px', flexWrap: 'wrap',
                  }}>
                    <span>📍</span>
                    <span>{shop.city}</span>
                    {shop.rating !== undefined && shop.rating > 0 && (
                      <>
                        <span style={{ margin: '0 4px', color: colors.border }}>·</span>
                        <span style={{ color: '#f59e0b' }}>
                          {'★'.repeat(Math.round(shop.rating))} {'☆'.repeat(5 - Math.round(shop.rating))}
                          <span style={{ color: colors.textSecondary, marginLeft: '4px', fontSize: '12px' }}>{shop.rating.toFixed(1)}</span>
                        </span>
                      </>
                    )}
                    {shop.phone && (
                      <>
                        <span style={{ margin: '0 4px', color: colors.border }}>·</span>
                        <span>📞 {shop.phone}</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {(shop.shopDescription || shop.description) && (
                    <p style={{
                      fontSize: '13px', color: '#555', fontFamily: font.body,
                      lineHeight: 1.6, margin: '0 0 16px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {shop.shopDescription || shop.description}
                    </p>
                  )}

                  {/* Categories chips */}
                  {shop.categories && shop.categories.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {shop.categories.slice(0, 3).map((cat, i) => (
                        <span key={i} style={{
                          padding: '3px 10px', borderRadius: '99px',
                          background: colors.bgBeige, color: colors.primary,
                          fontSize: '11px', fontWeight: 500, fontFamily: font.body,
                        }}>
                          {typeof cat === 'string' ? cat : cat.name || ''}
                        </span>
                      ))}
                      {shop.categories.length > 3 && (
                        <span style={{
                          padding: '3px 10px', borderRadius: '99px',
                          background: colors.bgBeige, color: colors.textMuted,
                          fontSize: '11px', fontFamily: font.body,
                        }}>
                          +{shop.categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom row */}
                  {shop.address && (
                    <div style={{
                      fontSize: '12px', color: colors.textMuted, fontFamily: font.body,
                      paddingTop: '12px', borderTop: `1px solid ${colors.border}`,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ fontSize: '12px' }}>📍</span>
                      <span>{shop.address}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
