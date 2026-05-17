import React, { useState } from 'react';

export default function RateLimitDemo() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('general');

  const styles = {
    container: {
      padding: '30px',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      margin: '20px',
      maxWidth: '900px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#1D9E75',
    },
    controls: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1D9E75',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    requestList: {
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      maxHeight: '500px',
      overflowY: 'auto',
      padding: '10px',
    },
    requestItem: {
      padding: '10px',
      marginBottom: '5px',
      borderRadius: '4px',
      fontSize: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    successRequest: {
      backgroundColor: '#e8f5e9',
      borderLeft: '4px solid #4caf50',
    },
    blockedRequest: {
      backgroundColor: '#ffebee',
      borderLeft: '4px solid #f44336',
    },
    statusCode: {
      fontWeight: 'bold',
      padding: '2px 8px',
      borderRadius: '3px',
      marginRight: '10px',
    },
    statusSuccess: {
      backgroundColor: '#4caf50',
      color: 'white',
    },
    statusBlocked: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    headers: {
      fontSize: '11px',
      color: '#666',
      marginTop: '5px',
      paddingLeft: '10px',
      borderLeft: '2px solid #999',
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px',
      marginTop: '20px',
    },
    statBox: {
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '4px',
      textAlign: 'center',
      border: '1px solid #ddd',
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1D9E75',
    },
    statLabel: {
      fontSize: '12px',
      color: '#666',
      marginTop: '5px',
    },
  };

  const simulateRequests = async () => {
    setLoading(true);
    setRequests([]);

    const limit = testType === 'general' ? 105 : 12;
    const maxAllowed = testType === 'general' ? 100 : 10;

    for (let i = 1; i <= limit; i++) {
      const isAllowed = i <= maxAllowed;
      const status = isAllowed ? 200 : 429;
      const remaining = Math.max(0, maxAllowed - i);

      setRequests(prev => [...prev, {
        id: i,
        status,
        isAllowed,
        remaining,
        timestamp: new Date().toLocaleTimeString(),
      }]);

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setLoading(false);
  };

  const totalRequests = requests.length;
  const successRequests = requests.filter(r => r.isAllowed).length;
  const blockedRequests = requests.filter(r => !r.isAllowed).length;

  return (
    <div style={styles.container}>
      <div style={styles.title}>🛡️ Rate Limiting Demo</div>

      <div style={styles.controls}>
        <button
          style={styles.button}
          onClick={() => {
            setTestType('general');
            setRequests([]);
          }}
          disabled={loading}
        >
          Probar Límite General (100/15min)
        </button>
        <button
          style={styles.button}
          onClick={() => {
            setTestType('auth');
            setRequests([]);
          }}
          disabled={loading}
        >
          Probar Límite Auth (10/15min)
        </button>
        <button
          style={styles.button}
          onClick={simulateRequests}
          disabled={loading}
        >
          {loading ? 'Simulando...' : 'Iniciar Simulación'}
        </button>
      </div>

      {requests.length > 0 && (
        <>
          <div style={styles.requestList}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  ...styles.requestItem,
                  ...(req.isAllowed ? styles.successRequest : styles.blockedRequest),
                }}
              >
                <div style={{ flex: 1 }}>
                  <div>
                    <span style={{ marginRight: '10px' }}>Request #{req.id}</span>
                    <span
                      style={{
                        ...styles.statusCode,
                        ...(req.isAllowed ? styles.statusSuccess : styles.statusBlocked),
                      }}
                    >
                      {req.status} {req.isAllowed ? 'OK' : 'TOO MANY REQUESTS'}
                    </span>
                  </div>
                  <div style={styles.headers}>
                    RateLimit-Remaining: {req.remaining} | Time: {req.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.stats}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{totalRequests}</div>
              <div style={styles.statLabel}>Total Requests</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, color: '#4caf50' }}>
                {successRequests}
              </div>
              <div style={styles.statLabel}>Permitidos ✓</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, color: '#f44336' }}>
                {blockedRequests}
              </div>
              <div style={styles.statLabel}>Bloqueados ✗</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
