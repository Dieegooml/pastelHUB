import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { colors, font, btnPrimary, inputStyle } from '../styles/theme';
import { paymentsService } from '../services/paymentsService';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';

const PAYMENT_METHODS = [
  { id: 'mercadopago', label: 'MercadoPago', icon: '🟡', desc: 'Tarjeta, transferencia o efectivo' },
  { id: 'card', label: 'Tarjeta', icon: '💳', desc: 'Débito o crédito' },
  { id: 'yape', label: 'Yape', icon: '📱', desc: 'Paga desde Yape' },
  { id: 'plin', label: 'Plin', icon: '📱', desc: 'Paga desde Plin' },
  { id: 'cash', label: 'Efectivo', icon: '💵', desc: 'Paga al recibir' },
];

function loadMercadoPagoScript() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) { resolve(window.MercadoPago); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error('Error cargando SDK de MercadoPago'));
    document.body.appendChild(script);
  });
}

function PaymentGateway({ orderIds, total, onSuccess, onError, onBack, email }) {

  const [method, setMethod] = useState('mercadopago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mpReady, setMpReady] = useState(false);
  const [preferenceId, setPreferenceId] = useState('');
  const [initPoint, setInitPoint] = useState('');

  const hasMpConfig = !!MP_PUBLIC_KEY;

  useEffect(() => {
    if (hasMpConfig) {
      loadMercadoPagoScript()
        .then(() => setMpReady(true))
        .catch(() => setMpReady(false));
    }
  }, [hasMpConfig]);

  useEffect(() => {
    if (mpReady && preferenceId && method === 'mercadopago') {
      try {
        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
        mp.checkout({
          preference: { id: preferenceId },
          render: { container: '#mp-checkout-container', label: 'Pagar con MercadoPago' },
        });
      } catch (e) {
        console.error('Error rendering MercadoPago checkout', e);
      }
    }
  }, [mpReady, preferenceId, method]);

  const handleCreatePreference = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentsService.createPreference({
        orderId: orderIds[0],
        backUrls: {
          success: `${window.location.origin}/my-orders`,
          failure: `${window.location.origin}/checkout`,
          pending: `${window.location.origin}/my-orders`,
        },
      });
      setPreferenceId(result.preferenceId);
      setInitPoint(result.initPoint);
      if (result.initPoint && !result.initPoint.startsWith('#')) {
        window.open(result.initPoint, '_blank');
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError('Error al conectar con MercadoPago');
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentsService.processGateway({
        orderId: orderIds[0],
        paymentMethod: method,
        amount: total,
        cardDetails: method === 'card' ? { last4: '4242', cardholderName: email || 'Cliente' } : undefined,
      });
      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.errorMessage || 'Pago rechazado');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError('Error al procesar el pago');
      setLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    if (preferenceId) return;
    await handleCreatePreference();
  };

  if (method === 'cash') {
    return (
      <div>
        <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '16px', marginBottom: '16px', borderLeft: `4px solid ${colors.accent}` }}>
          <p style={{ fontFamily: font.body, fontSize: '13px', color: colors.text, margin: 0, lineHeight: 1.6 }}>
            💵 Pagarás en efectivo al recibir tu pedido. No necesitas hacer nada ahora.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {onBack && <button onClick={onBack} style={{ ...btnPrimary, background: colors.border, color: colors.text, flex: 1 }}>Volver</button>}
          <button onClick={() => onSuccess({ success: true, method: 'cash', message: 'Pagarás en efectivo al recibir' })} style={{ ...btnPrimary, flex: 1 }}>Confirmar pedido</button>
        </div>
      </div>
    );
  }

  if (method === 'mercadopago') {
    const showMpButton = hasMpConfig && (mpReady || preferenceId);
    return (
      <div>
        <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.success}` }}>
          <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
            🟡 Paga con MercadoPago — tarjetas, transferencia o efectivo en agentes autorizados.
          </p>
        </div>
        {error && (
          <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
        )}
        {!showMpButton ? (
          <div>
            {!hasMpConfig && (
              <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.accent}` }}>
                <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  ⚡ Modo simulado: MercadoPago no está configurado. Se usará el gateway de prueba.
                </p>
              </div>
            )}
            <div id="mp-checkout-container" style={{ minHeight: '48px', marginBottom: '12px' }} />
            <button onClick={handleMercadoPago} disabled={loading} style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Conectando con MercadoPago...' : hasMpConfig ? 'Pagar con MercadoPago' : 'Simular pago MercadoPago'}
            </button>
          </div>
        ) : (
          <div>
            <div id="mp-checkout-container" style={{ minHeight: '48px', marginBottom: '12px' }} />
            {!hasMpConfig && (
              <button onClick={handleProcessPayment} disabled={loading} style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Procesando...' : `Pagar S/ ${total.toFixed(2)}`}
              </button>
            )}
          </div>
        )}
        <div style={{ marginTop: '8px' }}>
          {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: colors.accent, fontFamily: font.body, padding: 0 }}>← Otro método de pago</button>}
        </div>
      </div>
    );
  }

  if (method === 'yape' || method === 'plin') {
    const isYape = method === 'yape';
    return (
      <div>
        <div style={{ background: colors.white, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #efefef', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ width: '160px', height: '160px', background: isYape ? '#e83e8c' : '#3b82f6', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '120px', height: '120px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>{isYape ? '🔵' : '🟣'}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: font.heading, color: '#333' }}>{isYape ? 'YAPE' : 'PLIN'}</div>
              <div style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', marginTop: '2px' }}>PastelHub</div>
              <div style={{ fontSize: '8px', color: '#999', fontFamily: 'monospace' }}>S/ {total.toFixed(2)}</div>
            </div>
          </div>
          <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.textSecondary, margin: '0 0 6px' }}>1. Abre {isYape ? 'Yape' : 'Plin'}</p>
          <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.textSecondary, margin: '0 0 6px' }}>2. Escanea el código QR</p>
          <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.textSecondary, margin: '0' }}>3. Confirma el pago</p>
        </div>
        <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', borderLeft: `4px solid ${colors.accent}` }}>
          <p style={{ fontFamily: font.body, fontSize: '12px', color: colors.text, margin: 0, lineHeight: 1.5 }}>
            ⚡ Demo: Haz clic en "Confirmar pago" para simular.
          </p>
        </div>
        {error && (
          <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          {onBack && <button onClick={onBack} style={{ ...btnPrimary, background: colors.border, color: colors.text, flex: 1 }}>Volver</button>}
          <button onClick={handleProcessPayment} disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ background: colors.errorBg, color: colors.error, padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', fontFamily: font.body, borderLeft: `4px solid ${colors.error}` }}>{error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {PAYMENT_METHODS.map((pm) => (
          <div
            key={pm.id}
            onClick={() => setMethod(pm.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
              background: method === pm.id ? '#e8f5e9' : colors.white,
              border: method === pm.id ? `2px solid ${colors.success}` : `1.5px solid ${colors.border}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '24px', width: '36px', textAlign: 'center' }}>{pm.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font.heading, fontSize: '14px', fontWeight: 600, color: colors.text }}>{pm.label}</div>
              <div style={{ fontFamily: font.body, fontSize: '11px', color: colors.textMuted }}>{pm.desc}</div>
            </div>
            {method === pm.id && <div style={{ color: colors.success, fontSize: '18px' }}>✓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

PaymentGateway.propTypes = {
  orderIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  total: PropTypes.number.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onBack: PropTypes.func,
  email: PropTypes.string,
};

export default PaymentGateway;
