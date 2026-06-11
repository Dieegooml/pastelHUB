import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { supportService } from '../../services/supportService';
import { colors, font, inputStyle, textareaStyle, btnPrimary, animFadeIn } from '../../styles/theme';
import { useIsMobile } from '../../styles/useIsMobile';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export default function SupportNew() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    try {
      await supportService.createTicket({ subject: subject.trim(), priority, message: message.trim() });
      navigate('/support');
    } catch (e) { console.error(e); setError('Error al crear ticket'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgBeige }}>
      <Navbar />
      <div style={{ ...animFadeIn, maxWidth: '700px', margin: '0 auto', padding: isMobile ? '1rem' : '40px 2rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/support')} style={{ padding: '6px 12px', borderRadius: '99px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '13px', fontFamily: font.body, background: colors.white }}>← Volver</button>
          <h2 style={{ fontFamily: font.heading, fontSize: isMobile ? '22px' : '26px', fontWeight: 700, color: colors.primary, margin: 0 }}>Nuevo ticket</h2>
        </div>

        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: font.body, color: colors.text, marginBottom: '6px' }}>Asunto *</label>
            <input style={{ ...inputStyle, height: '42px', fontSize: '14px' }} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: Problema con mi pedido" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: font.body, color: colors.text, marginBottom: '6px' }}>Prioridad</label>
            <select style={{ ...inputStyle, height: '42px', fontSize: '14px' }} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: font.body, color: colors.text, marginBottom: '6px' }}>Mensaje *</label>
            <textarea style={{ ...textareaStyle, minHeight: '140px', fontSize: '14px', resize: 'vertical' }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe tu problema o consulta..." />
          </div>

          {error && (
            <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enviando...' : 'Enviar ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
