import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const TARGET = (__ENV.TARGET_URL || 'http://localhost:3001').replace(/\/+$/, '');
const MAX_VUS = parseInt(__ENV.MAX_VUS || '1000', 10);
const STEADY_MINUTES = parseInt(__ENV.STEADY_MINUTES || '5', 10);
const QUICK = __ENV.QUICK === 'true';
const WITH_AUTH = __ENV.LOAD_TEST === 'true';
const REPORT_BUCKET = __ENV.REPORT_BUCKET || '';
const REPORT_DIR = __ENV.REPORT_DIR || '/tmp';

const endpoints = [
  { path: '/api/health',      name: 'Health Check'      },
  { path: '/api/products',    name: 'List Products'      },
  { path: '/api/shops',       name: 'List Shops'         },
  { path: '/api/users',       name: 'List Users'         },
  { path: '/api/orders',      name: 'List Orders'        },
  { path: '/api/reviews',     name: 'List Reviews'       },
  { path: '/api/payments',    name: 'List Payments'      },
  { path: '/api/notifications', name: 'List Notifications' },
  { path: '/api/reports',     name: 'List Reports'       },
  { path: '/api/customers',   name: 'List Customers'     },
];

const isHighLoad = MAX_VUS > 10000;

const stages = QUICK ? [
  { duration: '15s',  target: Math.min(MAX_VUS, 200)                     },
  { duration: '30s',  target: Math.min(MAX_VUS, Math.round(MAX_VUS * 0.3)) },
  { duration: '45s',  target: MAX_VUS                                     },
  { duration: `${Math.min(STEADY_MINUTES, 1)}m`, target: MAX_VUS           },
  { duration: '15s',  target: Math.round(MAX_VUS * 0.3)                  },
  { duration: '10s',  target: 0                                           },
] : [
  { duration: '30s',  target: Math.min(MAX_VUS, 200)                     },
  { duration: '60s',  target: Math.min(MAX_VUS, Math.round(MAX_VUS * 0.3)) },
  { duration: '120s', target: Math.min(MAX_VUS, Math.round(MAX_VUS * 0.6)) },
  { duration: '120s', target: MAX_VUS                                     },
  { duration: `${STEADY_MINUTES}m`, target: MAX_VUS                       },
  { duration: '60s',  target: Math.round(MAX_VUS * 0.3)                  },
  { duration: '30s',  target: 0                                           },
];

export const options = {
  stages,
  thresholds: {
    http_req_duration: isHighLoad ? ['p(95)<10000', 'p(99)<20000'] : ['p(95)<5000', 'p(99)<10000'],
    http_req_failed:   isHighLoad ? ['rate<0.05'] : ['rate<0.02'],
  },
  tags: {
    test_type: 'load',
    target: TARGET,
    max_vus: String(MAX_VUS),
  },
};

function pickEndpoint() {
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

function authHeaders() {
  if (!WITH_AUTH) return {};
  return { Authorization: 'Bearer load-test-token' };
}

export default function () {
  const ep = pickEndpoint();
  const url = `${TARGET}${ep.path}`;

  const res = http.get(url, { headers: authHeaders() });

  const statusOk = res.status >= 200 && res.status < 400;
  check(res, {
    [`${ep.name} ok`]: () => statusOk,
    [`${ep.name} <2s`]: () => res.timings.duration < 2000,
  });

  sleep(randomIntBetween(300, 1500) / 1000);
}

function fmtMs(ms) {
  return `${Number(ms).toFixed(1)}ms`;
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

function barW(ms, max) {
  return Math.min((ms / Math.max(max, 1)) * 100, 100);
}

function colorMs(ms) {
  if (ms < 200) return '#16a34a';
  if (ms < 500) return '#ca8a04';
  return '#dc2626';
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function handleSummary(data) {
  const { metrics } = data;
  const dur = metrics.http_req_duration;
  const failed = metrics.http_req_failed;
  const reqs = metrics.http_reqs;

  const totalReqs = reqs ? reqs.values.count : 0;
  const failRate = failed ? failed.values.rate : 0;
  const avgLat = dur ? dur.values.avg : 0;
  const p50Lat = dur ? dur.values.med : 0;
  const p95Lat = dur ? dur.values['p(95)'] : 0;
  const p99Lat = dur ? dur.values['p(99)'] : 0;
  const minLat = dur ? dur.values.min : 0;
  const maxLat = dur ? dur.values.max : 0;
  const throughput = reqs ? Math.round(reqs.values.rate) : 0;

  const maxBar = Math.max(avgLat, p50Lat, p95Lat, p99Lat, 1);

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `k6-report-${MAX_VUS}vus-${ts}.html`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PastelHub k6 — ${MAX_VUS} VUs</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;color:#111;padding:2rem 1rem}
    .container{max-width:960px;margin:0 auto}
    h1{font-size:1.5rem;margin-bottom:4px}
    .subtitle{color:#6b7280;font-size:.875rem;margin-bottom:1.5rem}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:1.5rem}
    .card{background:#fff;border-radius:8px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);text-align:center}
    .card-label{font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
    .card-value{font-size:1.5rem;font-weight:700;margin-top:4px}
    .card-value.green{color:#16a34a}.card-value.yellow{color:#ca8a04}.card-value.red{color:#dc2626}
    .section{background:#fff;border-radius:8px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);margin-bottom:1rem}
    .section h2{font-size:.9rem;color:#374151;margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse}
    td{padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:.875rem}
    tr:last-child td{border-bottom:none}
    .bar-wrap{display:flex;align-items:center;gap:8px}
    .bar{height:18px;border-radius:4px;flex:1;overflow:hidden;background:#e5e7eb}
    .bar-fill{height:100%;border-radius:4px;transition:width .3s}
    .bar-label{font-size:.75rem;color:#6b7280;min-width:60px;text-align:right}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:600px){.grid-2{grid-template-columns:1fr}}
    .footer{text-align:center;margin-top:2rem;font-size:.75rem;color:#9ca3af}
  </style>
</head>
<body>
<div class="container">
  <h1>🏪 PastelHub — k6 Load Test</h1>
  <p class="subtitle">${MAX_VUS} usuarios concurrentes · ${STEADY_MINUTES}min steady · destino: ${escapeHtml(TARGET)}</p>

  <div class="cards">
    <div class="card"><div class="card-label">Solicitudes</div><div class="card-value">${totalReqs}</div></div>
    <div class="card"><div class="card-label">Throughput</div><div class="card-value">${throughput} <span style="font-size:.8rem;font-weight:400;color:#6b7280">req/s</span></div></div>
    <div class="card"><div class="card-label">Fallos</div><div class="card-value ${failRate > 0.02 ? 'red' : 'green'}">${(failRate * 100).toFixed(1)}%</div></div>
    <div class="card"><div class="card-label">P95</div><div class="card-value ${p95Lat > 5000 ? 'red' : p95Lat > 2000 ? 'yellow' : 'green'}">${fmtMs(p95Lat)}</div></div>
    <div class="card"><div class="card-label">P99</div><div class="card-value ${p99Lat > 10000 ? 'red' : p99Lat > 5000 ? 'yellow' : 'green'}">${fmtMs(p99Lat)}</div></div>
  </div>

  <div class="grid-2">
    <div class="section">
      <h2>Latencia</h2>
      <table>
        <tr><td>Mínimo</td><td style="text-align:right;font-weight:600">${fmtMs(minLat)}</td></tr>
        <tr><td>Promedio</td><td style="text-align:right;font-weight:600;color:${colorMs(avgLat)}">${fmtMs(avgLat)}</td></tr>
        <tr><td>Mediana (P50)</td><td style="text-align:right;font-weight:600">${fmtMs(p50Lat)}</td></tr>
        <tr><td>P95</td><td style="text-align:right;font-weight:600;color:${colorMs(p95Lat)}">${fmtMs(p95Lat)}</td></tr>
        <tr><td>P99</td><td style="text-align:right;font-weight:600;color:${colorMs(p99Lat)}">${fmtMs(p99Lat)}</td></tr>
        <tr><td>Máximo</td><td style="text-align:right;font-weight:600;color:${colorMs(maxLat)}">${fmtMs(maxLat)}</td></tr>
      </table>
    </div>
    <div class="section">
      <h2>Barras de latencia</h2>
      <table>
        <tr><td>P50</td><td><div class="bar-wrap"><div class="bar"><div class="bar-fill" style="width:${barW(p50Lat, maxBar)}%;background:${colorMs(p50Lat)}"></div></div><span class="bar-label">${fmtMs(p50Lat)}</span></div></td></tr>
        <tr><td>P95</td><td><div class="bar-wrap"><div class="bar"><div class="bar-fill" style="width:${barW(p95Lat, maxBar)}%;background:${colorMs(p95Lat)}"></div></div><span class="bar-label">${fmtMs(p95Lat)}</span></div></td></tr>
        <tr><td>P99</td><td><div class="bar-wrap"><div class="bar"><div class="bar-fill" style="width:${barW(p99Lat, maxBar)}%;background:${colorMs(p99Lat)}"></div></div><span class="bar-label">${fmtMs(p99Lat)}</span></div></td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <h2>Umbrales (Thresholds)</h2>
    <table>
      <tr><td>http_req_duration — p(95) &lt; 5000ms</td><td style="text-align:right;color:${p95Lat < 5000 ? '#16a34a' : '#dc2626'};font-weight:600">${p95Lat < 5000 ? '✅ PASA' : '❌ FALLA'} (${fmtMs(p95Lat)})</td></tr>
      <tr><td>http_req_duration — p(99) &lt; 10000ms</td><td style="text-align:right;color:${p99Lat < 10000 ? '#16a34a' : '#dc2626'};font-weight:600">${p99Lat < 10000 ? '✅ PASA' : '❌ FALLA'} (${fmtMs(p99Lat)})</td></tr>
      <tr><td>http_req_failed — rate &lt; 2%</td><td style="text-align:right;color:${failRate < 0.02 ? '#16a34a' : '#dc2626'};font-weight:600">${failRate < 0.02 ? '✅ PASA' : '❌ FALLA'} (${pct(failRate)})</td></tr>
    </table>
  </div>

  <p class="footer">Generado el ${new Date().toLocaleString('es-PE')} · PastelHub k6 Load Test</p>
</div>
</body>
</html>`;

  const uploadScript = REPORT_BUCKET
    ? `echo '${escapeHtml(html)}' | gcloud storage cp - gs://${REPORT_BUCKET}/load-reports/${filename} --content-type=text/html`
    : '';

  return {
    [`${REPORT_DIR}/${filename}`]: html,
    stdout: `
══════════════════════════════════════════════════
  PastelHub k6 — ${MAX_VUS} VUs completado${QUICK ? ' (MODO RÁPIDO)' : ''}
══════════════════════════════════════════════════
  Solicitudes: ${totalReqs}
  Throughput:  ${throughput} req/s
  Fallos:      ${pct(failRate)}
  P95:         ${fmtMs(p95Lat)}
  P99:         ${fmtMs(p99Lat)}
  Reporte:     /tmp/${filename}
  ${REPORT_BUCKET ? `GCS: gs://${REPORT_BUCKET}/load-reports/${filename}` : '(subida a GCS: configurar REPORT_BUCKET)'}
══════════════════════════════════════════════════\n`,
  };
}