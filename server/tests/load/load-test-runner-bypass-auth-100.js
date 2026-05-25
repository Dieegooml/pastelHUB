const BASE = process.env.BASE_URL || 'http://localhost:3001';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
const RAMP_SECONDS = parseInt(process.env.RAMP_SECONDS || '20', 10);
const STEADY_SECONDS = parseInt(process.env.STEADY_SECONDS || '10', 10);
const RESULTS_FILE = process.env.RESULTS_FILE || 'load-test-results.json';

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

async function hit(endpoint, signal) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: { Authorization: 'Bearer test-load-token' },
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
  constructor(id) {
    this.id = id;
    this.active = false;
    this.abort = new AbortController();
  }

  async run(stopAt) {
    this.active = true;
    while (Date.now() < stopAt) {
      const ep = pickEndpoint();
      await hit(ep, this.abort.signal);
      await sleep(100 + Math.random() * 900);
    }
    this.active = false;
  }

  stop() {
    this.abort.abort();
    this.active = false;
  }
}

async function runLoadTest() {
  const now = Date.now();
  const rampEnd = now + RAMP_SECONDS * 1000;
  const steadyEnd = rampEnd + STEADY_SECONDS * 1000;
  const totalDurationMs = RAMP_SECONDS * 1000 + STEADY_SECONDS * 1000;
  const absoluteEnd = now + totalDurationMs;

  const users = [];

  console.log(`\n=== Load Test: ${CONCURRENCY} VUs, ramp ${RAMP_SECONDS}s, steady ${STEADY_SECONDS}s ===\n`);
  console.log(`Target: ${BASE}`);
  console.log(`Asegúrate de que el servidor esté corriendo con: npm run start:load-test\n`);

  const stageInterval = setInterval(() => {
    const elapsed = Math.min((Date.now() - now) / totalDurationMs, 1);
    const target = CONCURRENCY * Math.min(elapsed, 1);
    const diff = target - users.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const u = new UserSimulator(users.length);
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

  return summary;
}

runLoadTest().then(summary => {
  require('fs').writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));
  console.log(`\nResultados guardados en ${RESULTS_FILE}`);
  try {
    require('./load-report');
  } catch {
    console.log('Ejecuta: node tests/load-report.js  para generar el reporte HTML');
  }
}).catch(err => {
  console.error('Error en load test:', err);
  process.exit(1);
});
