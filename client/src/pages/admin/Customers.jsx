import { useEffect, useState, Fragment } from 'react';
import Navbar from '../../components/Navbar';
import AdminNav from './AdminNav';
import { colors, font, tableHeaderStyle, btnDanger, animStagger, animFadeIn, animFadeInLeft } from '../../styles/theme';
import { customersService } from '../../services/customersService';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState({});
  const [addresses, setAddresses] = useState({});
  const [addrLoading, setAddrLoading] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data?.data || []);
    } catch (e) { console.error(e); setError('Error al cargar clientes'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id) => {
    if (expanded[id]) {
      setExpanded((p) => ({ ...p, [id]: false }));
      return;
    }
    setExpanded((p) => ({ ...p, [id]: true }));
    if (!addresses[id]) {
      setAddrLoading((p) => ({ ...p, [id]: true }));
      try {
        const data = await customersService.getById(id);
        const addr = await customersService.getAddresses(id).catch(() => []);
        setAddresses((p) => ({ ...p, [id]: { customer: data, addresses: Array.isArray(addr) ? addr : [] } }));
      } catch (e) { console.error(e); } finally { setAddrLoading((p) => ({ ...p, [id]: false })); }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await customersService.delete(id); setSuccess('Cliente eliminado'); load(); }
    catch (e) { console.error(e); setError('Error al eliminar'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ ...animFadeIn, maxWidth: '1100px', margin: '0 auto', padding: '40px 2rem 2rem' }}>
        <h2 style={{ fontFamily: font.heading, fontSize: '28px', fontWeight: 700, color: colors.primary, margin: 0, marginBottom: '24px' }}>Clientes</h2>
        <div style={{ height: '3px', width: '60px', background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`, borderRadius: '99px', marginBottom: '1.2rem' }} />
        <div style={{ marginBottom: '16px' }}><AdminNav /></div>

        {success && <div style={{ background: colors.successBg, color: colors.success, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.success}` }}>{success}</div>}
        {error && <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', borderRadius: '8px', animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ ...animStagger(0.04), background: colors.white, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #efefef' }}>
            {customers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999', fontFamily: font.body, fontSize: '15px' }}>
                No hay clientes registrados
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: colors.grayLight, textAlign: 'left' }}>
                      <th style={tableHeaderStyle}>ID</th>
                      <th style={tableHeaderStyle}>Nombre</th>
                      <th style={tableHeaderStyle}>Email</th>
                      <th style={tableHeaderStyle}>Teléfono</th>
                      <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <Fragment key={c.id}>
                        <tr
                          style={{ ...animStagger(i * 0.03), borderTop: `1px solid ${colors.tableBorder}`, background: i % 2 === 0 ? colors.white : colors.tableStripe, transition: 'background 0.15s ease', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0ede8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableStripe; }}
                          onClick={() => toggleExpand(c.id)}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: colors.textSecondary }}>{c.id?.slice(0, 8)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: font.body }}>{c.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body, color: colors.textSecondary }}>{c.email || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: font.body }}>{c.phone || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} style={btnDanger}>Eliminar</button>
                          </td>
                        </tr>
                        {expanded[c.id] && (
                          <tr
                            style={{ ...animFadeIn, background: colors.grayLight }}
                          >
                            <td colSpan={5} style={{ padding: '16px 20px' }}>
                              {addrLoading[c.id] ? (
                                <div style={{ color: colors.textMuted, fontSize: '13px', fontFamily: font.body }}>Cargando...</div>
                              ) : addresses[c.id] ? (
                                <div>
                                  <div style={{ fontSize: '13px', fontFamily: font.body, color: colors.text, marginBottom: '8px' }}>
                                    <strong>Email:</strong> {addresses[c.id].customer?.email || '—'}<br />
                                    <strong>Teléfono:</strong> {addresses[c.id].customer?.phone || '—'}<br />
                                    <strong>Default Address ID:</strong> {addresses[c.id].customer?.defaultAddressId || '—'}
                                  </div>
                                  {addresses[c.id].addresses?.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: font.body, color: colors.primary, marginBottom: '6px' }}>Direcciones ({addresses[c.id].addresses.length})</div>
                                      {addresses[c.id].addresses.map((a) => (
                                        <div key={a.id} style={{ fontSize: '12px', fontFamily: font.body, color: colors.textSecondary, marginBottom: '4px', paddingLeft: '12px', borderLeft: `2px solid ${colors.accent}` }}>
                                          {a.street}, {a.city}{a.district ? `, ${a.district}` : ''}{a.reference ? ` — ${a.reference}` : ''}{a.isDefault ? ' ★' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
