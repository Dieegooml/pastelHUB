const path = require('path');
const net = require('net');
const fs = require('fs');
const SERVER_DIR = path.resolve(__dirname, '..', '..');

const generalResults = [];
const authResults = [];

async function hit(base, url, headers = {}) {
  const start = performance.now();
  try {
    const res = await fetch(`${base}${url}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    const dur = performance.now() - start;
    return { status: res.status, duration: dur };
  } catch {
    return { status: 0, duration: 0 };
  }
}

async function hitPost(base, url, body = {}) {
  const start = performance.now();
  try {
    const res = await fetch(`${base}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const dur = performance.now() - start;
    return { status: res.status, duration: dur };
  } catch {
    return { status: 0, duration: 0 };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function generateHtml(results, title, limit) {
  const blockedAt = results.findIndex(r => r.status === 429);
  const total = results.length;
  const blocked = results.filter(r => r.status === 429).length;
  const allowed = total - blocked;
  const avgMs = (results.reduce((s, r) => s + r.duration, 0) / total).toFixed(1);

  const rows = results.map((r, i) => {
    const isBlocked = r.status === 429;
    const isLimit = i + 1 === limit;
    const color = isBlocked ? '#fef2f2' : isLimit ? '#fef9c3' : '#f0fdf4';
    const badge = isBlocked
      ? '<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">BLOQUEADO</span>'
      : isLimit
      ? '<span style="background:#ca8a04;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">LÍMITE</span>'
      : '<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">OK</span>';
    return `
          <tr style="background:${color}">
            <td style="padding:6px 12px;font-size:13px">#${String(i + 1).padStart(3)}</td>
            <td style="padding:6px 12px;font-size:13px;font-weight:600;color:${isBlocked ? '#dc2626' : '#16a34a'}">${r.status}</td>
            <td style="padding:6px 12px;font-size:13px">${r.duration.toFixed(0)}ms</td>
            <td style="padding:6px 12px">${badge}</td>
          </tr>`;
  }).join('');

  return `
    <div style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);margin-bottom:2rem;overflow:hidden">
      <div style="padding:1rem 1.5rem;border-bottom:2px solid #e5e7eb">
        <h2 style="margin:0;font-size:1.1rem">${title}</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:1rem 1.5rem;background:#f9fafb;border-bottom:1px solid #e5e7eb">
        <div><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Total</span><br><span style="font-size:1.3rem;font-weight:700">${total}</span></div>
        <div><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Permitidos</span><br><span style="font-size:1.3rem;font-weight:700;color:#16a34a">${allowed}</span></div>
        <div><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Bloqueados (429)</span><br><span style="font-size:1.3rem;font-weight:700;color:#dc2626">${blocked}</span></div>
        <div><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Tiempo promedio</span><br><span style="font-size:1.3rem;font-weight:700">${avgMs}ms</span></div>
      </div>
      <div style="overflow-x:auto;max-height:400px;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="position:sticky;top:0;background:#f3f4f6">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">#</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Status</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Tiempo</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb">Resultado</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>`;
}

const { spawn } = require('child_process');

function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['src/server.js'], {
      cwd: SERVER_DIR,
      env: { ...process.env, LOAD_TEST: 'true', PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error(`Server start timeout on port ${port}`));
      }
    }, 10000);

    const tryConnect = () => {
      const s = net.connect(port, 'localhost', () => {
        s.destroy();
        if (!started) {
          started = true;
          clearTimeout(timeout);
          resolve(proc);
        }
      });
      s.on('error', () => {
        s.destroy();
        if (!started) setTimeout(tryConnect, 200);
      });
    };

    proc.stdout.on('data', d => {
      const text = d.toString();
      if (text.includes('running on port') || text.includes('listening') || text.includes('puerto')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          resolve(proc);
        }
      }
    });

    proc.on('error', reject);
    tryConnect();
  });
}

async function testGeneralRateLimit(base) {
  console.log('\n🔹 Test: Límite general (100 req/5s) — GET /api/health\n');

  for (let i = 1; i <= 105; i++) {
    const result = await hit(base, '/api/health');
    generalResults.push(result);
    const icon = result.status === 429 ? '❌' : '✅';
    process.stdout.write(`  ${icon} Request #${i} → ${result.status} (${result.duration.toFixed(0)}ms)\n`);
    await sleep(40);
  }

  const firstBlock = generalResults.findIndex(r => r.status === 429);
  console.log(`\n  ➡ Primer bloqueo en request #${firstBlock + 1} (esperado: #101)\n`);
}

async function testAuthRateLimit(base) {
  console.log('\n🔹 Test: Límite de auth (10 req/5s) — POST /api/auth/sync\n');

  for (let i = 1; i <= 15; i++) {
    const result = await hitPost(base, '/api/auth/sync', {});
    authResults.push(result);
    const icon = result.status === 429 ? '❌' : '✅';
    process.stdout.write(`  ${icon} Request #${i} → ${result.status} (${result.duration.toFixed(0)}ms)\n`);
    await sleep(100);
  }

  const firstBlock = authResults.findIndex(r => r.status === 429);
  console.log(`\n  ➡ Primer bloqueo en request #${firstBlock + 1} (esperado: #11)\n`);
}

async function runTest(name, fn, port) {
  const base = `http://localhost:${port}`;
  console.log(`\n━━━ Iniciando: ${name} ━━━\n`);
  console.log(`  Puerto: ${port}`);
  console.log('  Levantando servidor...');
  const proc = await startServer(port);
  await sleep(1000);
  console.log('  ✅ Servidor listo\n');

  try {
    await fn(base);
  } catch (err) {
    console.error('  ❌ Error durante el test:', err.message);
  }

  console.log('  Deteniendo servidor...');
  proc.kill('SIGKILL');
  await sleep(500);
  try { proc.kill('SIGKILL'); } catch {}
  console.log('  ✅ Servidor detenido\n');
}

async function main() {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║   PastelHub - Rate Limit Test             ║`);
  console.log(`╚════════════════════════════════════════════╝`);

  const PORT_GENERAL = 3001;
  const PORT_AUTH = 3002;

  await runTest('Límite General (100 req/5s)', testGeneralRateLimit, PORT_GENERAL);
  await runTest('Límite de Auth (10 req/5s)', testAuthRateLimit, PORT_AUTH);

  const limitGeneral = generalResults.findIndex(r => r.status === 429) + 1;
  const limitAuth = authResults.findIndex(r => r.status === 429) + 1;

  const passedGeneral = limitGeneral === 101 ? '✅ PASA' : '❌ FALLA';
  const passedAuth = limitAuth === 11 ? '✅ PASA' : '❌ FALLA';

  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║   RESULTADOS                              ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
  console.log(`  Límite general: bloqueo en #${limitGeneral} (esperado: #101) ${passedGeneral}`);
  console.log(`  Límite auth:    bloqueo en #${limitAuth} (esperado: #11) ${passedAuth}\n`);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PastelHub - Rate Limit Test</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0 }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f3f4f6; color:#111; padding:2rem 1rem }
    .container { max-width:800px; margin:0 auto }
    h1 { font-size:1.5rem; margin-bottom:4px }
    .subtitle { color:#6b7280; font-size:0.875rem; margin-bottom:1.5rem }
    .summary { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:2rem }
    .summary-card { background:#fff; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.1) }
    .summary-card.pass { border-left:4px solid #16a34a }
    .summary-card.fail { border-left:4px solid #dc2626 }
    .summary-label { font-size:0.7rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em }
    .summary-value { font-size:1.1rem; font-weight:700; margin-top:4px }
    .summary-value.pass { color:#16a34a }
    .summary-value.fail { color:#dc2626 }
  </style>
</head>
<body>
  <div class="container">
    <h1> PastelHub — Rate Limit Test</h1>
    <p class="subtitle">Puertos: 3001 (general), 3002 (auth) · Ventana: 5 segundos (modo LOAD_TEST) · Servidores independientes</p>

    <div class="summary">
      <div class="summary-card ${passedGeneral === '✅ PASA' ? 'pass' : 'fail'}">
        <div class="summary-label">Límite general (100 req/5s)</div>
        <div class="summary-value ${passedGeneral === '✅ PASA' ? 'pass' : 'fail'}">${passedGeneral}</div>
        <div style="margin-top:6px;font-size:13px;color:#374151">Bloqueo en request #${limitGeneral} (esperado: #101)</div>
      </div>
      <div class="summary-card ${passedAuth === '✅ PASA' ? 'pass' : 'fail'}">
        <div class="summary-label">Límite de auth (10 req/5s)</div>
        <div class="summary-value ${passedAuth === '✅ PASA' ? 'pass' : 'fail'}">${passedAuth}</div>
        <div style="margin-top:6px;font-size:13px;color:#374151">Bloqueo en request #${limitAuth} (esperado: #11)</div>
      </div>
    </div>

    ${generateHtml(generalResults, 'Límite General — GET /api/health', 100)}
    ${generateHtml(authResults, 'Límite de Auth — POST /api/auth/sync', 10)}

    <p style="font-size:0.75rem;color:#9ca3af;text-align:center;margin-top:2rem">
      Generado el ${new Date().toLocaleString('es-PE')} · PastelHub Rate Limit Test
    </p>
  </div>
</body>
</html>`;

  fs.writeFileSync('rate-limit-test-report.html', html);
  console.log(`\nReporte HTML: rate-limit-test-report.html\n`);

  if (passedGeneral !== '✅ PASA' || passedAuth !== '✅ PASA') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
