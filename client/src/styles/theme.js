/** @deprecated Use chakraTheme theme tokens instead */
// @deprecated Use chakraTheme.js instead
export const colors = {
  primary: '#2D1F1F',
  accent: '#1D9E75',
  bgBeige: '#F9F4EE',
  border: '#E8DDD5',
  white: '#FFFFFF',
  text: '#2D1F1F',
  textSecondary: '#888888',
  textMuted: '#999',
  error: '#EF4444',
  success: '#1D9E75',
  errorBg: '#FEF2F2',
  successBg: '#ECFDF5',
  grayBg: '#f3f4f6',
  grayLight: '#f9f9f9',
  tableStripe: '#fafafa',
  tableBorder: '#f0f0f0',
};

export const font = {
  heading: "'Playfair Display', serif",
  body: "'Inter', sans-serif",
};

export const inputStyle = {
  width: '100%',
  height: '48px',
  padding: '0 16px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: font.body,
  color: colors.text,
  background: colors.white,
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

export const textareaStyle = {
  ...inputStyle,
  height: 'auto',
  minHeight: '70px',
  padding: '12px 16px',
  resize: 'vertical',
  fontFamily: font.body,
};

export const btnPrimary = {
  padding: '10px 24px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '99px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: font.body,
  transition: 'all 0.25s ease',
};

export const btnDanger = {
  padding: '5px 12px',
  borderRadius: '99px',
  border: 'none',
  cursor: 'pointer',
  background: colors.errorBg,
  color: colors.error,
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: font.body,
  transition: 'all 0.2s ease',
};

export const btnGhost = {
  padding: '5px 12px',
  borderRadius: '99px',
  border: `1px solid ${colors.border}`,
  cursor: 'pointer',
  background: colors.white,
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: font.body,
  color: colors.text,
  transition: 'all 0.2s ease',
};

export const btnSmallPrimary = {
  padding: '6px 14px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '99px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: font.body,
};

export const btnSmallSecondary = {
  padding: '6px 14px',
  background: colors.grayBg,
  border: 'none',
  borderRadius: '99px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  fontFamily: font.body,
};

export const badge = (bg, color) => ({
  padding: '3px 12px',
  borderRadius: '99px',
  fontSize: '11px',
  fontWeight: 500,
  fontFamily: font.body,
  background: bg,
  color: color,
  whiteSpace: 'nowrap',
});

export const pageStyle = {
  padding: '2rem',
  maxWidth: '960px',
  margin: '0 auto',
  fontFamily: font.body,
  background: colors.bgBeige,
  minHeight: '100vh',
};

export const cardStyle = {
  background: colors.white,
  padding: '1.5rem',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  marginBottom: '2rem',
  border: `1px solid ${colors.border}`,
};

export const tableHeaderStyle = {
  padding: '12px 16px',
  fontSize: '11px',
  color: colors.textSecondary,
  fontWeight: 600,
  textTransform: 'uppercase',
  fontFamily: font.body,
  letterSpacing: '0.5px',
};

export const labelStyle = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#555',
  marginBottom: '6px',
  display: 'block',
  fontFamily: font.body,
};

export const statusTab = (active) => ({
  padding: '6px 16px',
  borderRadius: '99px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: font.body,
  background: active ? colors.primary : colors.white,
  color: active ? '#fff' : colors.textSecondary,
  border: active ? 'none' : `1px solid ${colors.border}`,
  transition: 'all 0.2s ease',
});

export const animationStyles = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes chatbotPulse { 0%, 100% { box-shadow: 0 4px 20px rgba(29,158,117,0.4); } 50% { box-shadow: 0 4px 28px rgba(29,158,117,0.55); } }
@keyframes chatPanelIn { from { opacity: 0; transform: scale(0.9) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes chatbotDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
`;

export const animFadeIn = { animation: 'fadeIn 0.3s ease both' };
export const animFadeInUp = { animation: 'fadeInUp 0.3s ease both' };
export const animFadeInLeft = { animation: 'fadeInLeft 0.3s ease both' };
export const animFadeInRight = { animation: 'fadeInRight 0.3s ease both' };
export const animScaleIn = { animation: 'scaleIn 0.3s ease both' };
export const animStagger = (delay) => ({ animation: 'fadeInUp 0.35s ease both', animationDelay: `${delay}s` });
