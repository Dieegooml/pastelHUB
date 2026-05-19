require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const SERVER_DIR = path.resolve(__dirname, '..', '..');

const CONCURRENCY = 100;
const RAMP_SECONDS = parseInt(process.env.RAMP_SECONDS || '10', 10);
const STEADY_SECONDS = parseInt(process.env.STEADY_SECONDS || '20', 10);
const RESULTS_FILE = process.env.RESULTS_FILE || 'load-test-results-real-auth.json';
const REPORT_FILE = process.env.REPORT_FILE || 'load-test-report-real-auth.html';

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;
const PORT = 3003;

const BASE = `http://localhost:${PORT}`;

const endpoints = [
  { path: '/api/health',               method: 'GET',    name: 'Health Check'            },
  { path: '/api/products',             method: 'GET',    name: 'List Products'            },
  { path: '/api/shops',                method: 'GET',    name: 'List Shops'               },
  { path: '/api/users',                method: 'GET',    name: 'List Users'               },
  { path: '/api/orders',               method: 'GET',    name: 'List Orders'              },
  { path: '/api/reviews',              method: 'GET',    name: 'List Reviews'             },
  { path: '/api/payments',             method: 'GET',    name: 'List Payments'            },
  { path: '/api/notifications',        method: 'GET',    name: 'List Notifications'       },
  { path: '/api/reports',              method: 'GET',    name: 'List Reports'             },
  { path: '/api/customers',            method: 'GET',    name: 'List Customers'           },
];

const results = new Map();
endpoints.forEach(e => results.set(e.path, { durations: [], statuses: [], errors: [] }));

let completedRequests = 0;
let failedRequests = 0;

function pickEndpoint() {
  return endpoints[(Math.random() * endpoints.length) | 0];
}

async function hit(endpoint, token, signal) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const dur = performance.now() - start;
    const r = results.get(endpoint.path);
    r.durations.push(dur);
    r.statuses.push(res.status);
    completedRequests++;
    return dur;
  } catch (err) {
    if (err.name === 'AbortError') return;
    const r = results.get(endpoint.path);
    r.errors.push(err.message);
    failedRequests++;
    completedRequests++;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

class UserSimulator {
  constructor(id, token) {
    this.id = id;
    this.token = token;
    this.active = false;
    this.abort = new AbortController();
  }

  async run(stopAt) {
    this.active = true;
    while (Date.now() < stopAt) {
      const ep = pickEndpoint();
      await hit(ep, this.token, this.abort.signal);
      await sleep(100 + Math.random() * 900);
    }
    this.active = false;
  }

  stop() {
    this.abort.abort();
    this.active = false;
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['src/server.js'], {
      cwd: SERVER_DIR,
      env: { ...process.env, LOAD_TEST_REAL_AUTH: 'true', PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) { proc.kill(); reject(new Error('Server start timeout')); }
    }, 15000);

    const tryConnect = () => {
      const s = net.connect(PORT, 'localhost', () => {
        s.destroy();
        if (!started) { started = true; clearTimeout(timeout); resolve(proc); }
      });
      s.on('error', () => { if (!started) setTimeout(tryConnect, 200); });
    };

    proc.stdout.on('data', d => {
      if (d.toString().includes('puerto')) {
        if (!started) { started = true; clearTimeout(timeout); resolve(proc); }
      }
    });

    proc.on('error', reject);
    tryConnect();
  });
}

async function generateReport(summary) {
  const totalOk = endpoints.reduce((s, ep) => s + (summary.endpoints[ep.path]?.ok || 0), 0);
  const totalFail = endpoints.reduce((s, ep) => s + (summary.endpoints[ep.path]?.fail || 0), 0);
  const totalErrors = endpoints.reduce((s, ep) => s + (summary.endpoints[ep.path]?.errors || 0), 0);

  const rows = endpoints.map(ep => {
    const r = summary.endpoints[ep.path];
    if (!r || !r.requests) return '';
    const failRate = r.requests ? ((r.fail / r.requests) * 100).toFixed(1) : '0.0';
    const bar = r.requests ? (r.avgMs / Math.max(...endpoints.map(e => summary.endpoints[e.path]?.avgMs || 0)) * 100) : 0;
    return `
      <tr>
        <td style="padding:8px 12px">${ep.name}</td>
        <td style="padding:8px 12px;text-align:right">${r.requests}</td>
        <td style="padding:8px 12px;text-align:right;color:#16a34a">${r.ok}</td>
        <td style="padding:8px 12px;text-align:right;color:${r.fail > 0 ? '#dc2626' : '#16a34a'}">${r.fail} (${failRate}%)</td>
        <td style="padding:8px 12px;text-align:right">${r.avgMs}ms</td>
        <td style="padding:8px 12px;text-align:right">${r.p50Ms}ms</td>
        <td style="padding:8px 12px;text-align:right">${r.p95Ms}ms</td>
        <td style="padding:8px 12px;text-align:right">${r.p99Ms}ms</td>
        <td style="padding:8px 12px">
          <div style="background:#e5e7eb;height:20px;border-radius:4px;overflow:hidden;min-width:80px">
            <div style="background:#6366f1;height:100%;width:${Math.min(bar, 100)}%;border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PastelHub - Load Test (Auth Real)</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0 }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f3f4f6; color:#111; padding:2rem 1rem }
    .container { max-width:960px; margin:0 auto }
    h1 { font-size:1.5rem; margin-bottom:4px }
    .subtitle { color:#6b7280; font-size:0.875rem; margin-bottom:1.5rem }
    .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:2rem }
    .card { background:#fff; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.1); text-align:center }
    .card-label { font-size:0.7rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em }
    .card-value { font-size:1.5rem; font-weight:700; margin-top:4px }
    table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.1) }
    th { padding:10px 12px; text-align:left; font-size:11px; color:#6b7280; text-transform:uppercase; background:#f9fafb; border-bottom:2px solid #e5e7eb }
    td { padding:10px 12px; border-bottom:1px solid #e5e7eb; font-size:13px }
    tr:last-child td { border-bottom:none }
    .footer { text-align:center; margin-top:2rem; font-size:0.75rem; color:#9ca3af }
    .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600 }
  </style>
</head>
<body>
  <div class="container">
    <h1> PastelHub — Load Test (Auth Real)</h1>
    <p class="subtitle">${CONCURRENCY} VUs · ${RAMP_SECONDS}s ramp · ${STEADY_SECONDS}s steady · Puerto ${PORT}</p>

    <div class="cards">
      <div class="card"><div class="card-label">Total Requests</div><div class="card-value">${summary.totalRequests}</div></div>
      <div class="card"><div class="card-label">Throughput</div><div class="card-value">${summary.throughput} <span style="font-size:.8rem;font-weight:400">req/s</span></div></div>
      <div class="card"><div class="card-label">OK</div><div class="card-value" style="color:#16a34a">${totalOk}</div></div>
      <div class="card"><div class="card-label">Fallas</div><div class="card-value" style="color:#dc2626">${totalFail}</div></div>
      <div class="card"><div class="card-label">Errores de red</div><div class="card-value">${totalErrors}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th style="text-align:right">Req</th>
          <th style="text-align:right">OK</th>
          <th style="text-align:right">Fail</th>
          <th style="text-align:right">Avg</th>
          <th style="text-align:right">P50</th>
          <th style="text-align:right">P95</th>
          <th style="text-align:right">P99</th>
          <th>Latencia</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p class="footer">
      Generado el ${new Date().toLocaleString('es-PE')} · Auth real habilitado · Ventanas 5s
    </p>
  </div>
</body>
</html>`;

  fs.writeFileSync(REPORT_FILE, html);
  console.log(`\nReporte HTML: ${REPORT_FILE}`);
}

async function main() {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║  PastelHub - Load Test (Auth Real)        ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);

  if (!API_KEY) {
    console.error('❌ Falta FIREBASE_WEB_API_KEY');
    console.error('   Configúrala como variable de entorno o en el script de npm.\n');
    process.exit(1);
  }
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('❌ Faltan TEST_USER_EMAIL y/o TEST_USER_PASSWORD');
    process.exit(1);
  }

  console.log(`Authenticando ${TEST_EMAIL} en Firebase...`);
  let idToken;
  try {
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
      }
    );
    const firebaseData = await firebaseRes.json();
    if (!firebaseData.idToken) {
      console.error('❌ Error al autenticar:', firebaseData.error?.message || JSON.stringify(firebaseData));
      process.exit(1);
    }
    idToken = firebaseData.idToken;
    console.log(`✅ Token obtenido (expira en ${firebaseData.expiresIn}s)\n`);
  } catch (e) {
    console.error('❌ Error de red al conectar con Firebase Auth:', e.message);
    process.exit(1);
  }

  console.log('Levantando servidor en puerto 3003...');
  const proc = await startServer();
  await sleep(1000);
  console.log('✅ Servidor listo\n');

  const now = Date.now();
  const rampEnd = now + RAMP_SECONDS * 1000;
  const steadyEnd = rampEnd + STEADY_SECONDS * 1000;
  const totalDurationMs = RAMP_SECONDS * 1000 + STEADY_SECONDS * 1000;
  const absoluteEnd = now + totalDurationMs;

  const users = [];
  console.log(`=== ${CONCURRENCY} VUs, ramp ${RAMP_SECONDS}s, steady ${STEADY_SECONDS}s ===\n`);

  const stageInterval = setInterval(() => {
    const elapsed = Math.min((Date.now() - now) / totalDurationMs, 1);
    const target = CONCURRENCY * Math.min(elapsed, 1);
    const diff = target - users.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const u = new UserSimulator(users.length, idToken);
        users.push(u);
        u.run(absoluteEnd);
      }
    }
  }, 200);

  await sleep(totalDurationMs + 1500);
  clearInterval(stageInterval);
  users.forEach(u => u.stop());
  await sleep(500);

  const totalTime = (Date.now() - now) / 1000;

  console.log(`\n=== Resultados ===\n`);
  console.log(`Usuarios concurrentes: ${CONCURRENCY}`);
  console.log(`Duración total: ${totalTime.toFixed(1)}s`);
  console.log(`Peticiones completadas: ${completedRequests}`);
  console.log(`Fallos: ${failedRequests} (${(failedRequests / Math.max(completedRequests, 1) * 100).toFixed(1)}%)`);
  console.log(`Throughput: ${(completedRequests / totalTime).toFixed(1)} req/s\n`);

  const summary = {
    baseUrl: BASE,
    concurrency: CONCURRENCY,
    rampSeconds: RAMP_SECONDS,
    steadySeconds: STEADY_SECONDS,
    durationSec: totalTime.toFixed(1),
    totalRequests: completedRequests,
    failedRequests,
    throughput: (completedRequests / totalTime).toFixed(1),
    authMode: 'real',
    endpoints: {},
  };

  endpoints.forEach(ep => {
    const r = results.get(ep.path);
    const ok = r.statuses.filter(s => s < 400).length;
    const fail = r.statuses.filter(s => s >= 400).length;
    const dur = r.durations;
    summary.endpoints[ep.path] = {
      name: ep.name,
      requests: dur.length,
      ok,
      fail,
      errors: r.errors.length,
      avgMs: dur.length ? (dur.reduce((a, b) => a + b, 0) / dur.length).toFixed(1) : 0,
      minMs: dur.length ? Math.min(...dur).toFixed(1) : 0,
      maxMs: dur.length ? Math.max(...dur).toFixed(1) : 0,
      p50Ms: percentile(dur, 50).toFixed(1),
      p95Ms: percentile(dur, 95).toFixed(1),
      p99Ms: percentile(dur, 99).toFixed(1),
    };
    console.log(`${ep.name.padEnd(22)} ${String(dur.length).padStart(6)} req  |  avg=${percentile(dur, 50).toFixed(0).padStart(5)}ms  p95=${percentile(dur, 95).toFixed(0).padStart(5)}ms  fallos=${String(r.errors.length).padStart(3)}`);
  });

  process.stdout.write('\nDeteniendo servidor...');
  proc.kill('SIGKILL');
  await sleep(500);
  console.log(' ✅\n');

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));
  console.log(`Resultados guardados en ${RESULTS_FILE}`);
  await generateReport(summary);

  const totalFailCount = endpoints.reduce((s, ep) => s + (summary.endpoints[ep.path]?.fail || 0), 0);
  if (totalFailCount > 0) {
    console.log(`\n⚠ ${totalFailCount} respuestas con status >= 400 (revisar reporte HTML para detalles)\n`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
