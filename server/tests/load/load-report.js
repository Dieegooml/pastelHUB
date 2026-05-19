const fs = require('fs');

const RESULTS_FILE = process.env.RESULTS_FILE || 'load-test-results.json';
const REPORT_FILE = process.env.REPORT_FILE || 'load-test-report.html';

let data;
try {
  data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
} catch {
  console.error(`No se encuentra ${RESULTS_FILE}. Ejecuta primero: npm run load-test`);
  process.exit(1);
}

function colorFor(ms) {
  const v = parseFloat(ms);
  if (v < 200) return '#16a34a';
  if (v < 500) return '#ca8a04';
  return '#dc2626';
}

function barWidth(ms, max) {
  return Math.min((parseFloat(ms) / Math.max(max, 1)) * 100, 100);
}

const allDurations = Object.values(data.endpoints).flatMap(e => [
  parseFloat(e.avgMs), parseFloat(e.p50Ms), parseFloat(e.p95Ms), parseFloat(e.p99Ms)
]);
const maxDur = Math.max(...allDurations, 1);

const epRows = Object.entries(data.endpoints).map(([path, ep]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${ep.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${ep.requests}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${colorFor(ep.avgMs)};font-weight:600">${ep.avgMs}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${ep.minMs}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${colorFor(ep.maxMs)}">${ep.maxMs}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${ep.p50Ms}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${colorFor(ep.p95Ms)};font-weight:600">${ep.p95Ms}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${colorFor(ep.p99Ms)}">${ep.p99Ms}ms</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${ep.errors > 0 ? '#dc2626' : '#16a34a'}">${ep.errors}</td>
          </tr>
`).join('');

const barRows = Object.entries(data.endpoints).map(([path, ep]) => `
          <tr>
            <td style="padding:6px 12px;font-size:13px;color:#374151;width:160px">${ep.name}</td>
            <td style="padding:6px 12px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="height:18px;background:#e5e7eb;border-radius:4px;flex:1;overflow:hidden">
                  <div style="height:100%;width:${barWidth(ep.p95Ms, maxDur)}%;background:${colorFor(ep.p95Ms)};border-radius:4px;transition:width 0.3s"></div>
                </div>
                <span style="font-size:12px;color:#6b7280;min-width:55px;text-align:right">p95 ${ep.p95Ms}ms</span>
              </div>
            </td>
          </tr>
`).join('');

const failRate = data.totalRequests > 0
  ? ((data.failedRequests / data.totalRequests) * 100).toFixed(1)
  : '0.0';

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PastelHub - Reporte de Carga</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0 }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f3f4f6; color:#111; padding:2rem 1rem }
    .container { max-width:960px; margin:0 auto }
    h1 { font-size:1.5rem; margin-bottom:4px }
    .subtitle { color:#6b7280; font-size:0.875rem; margin-bottom:1.5rem }
    .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:1.5rem }
    .card { background:#fff; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.1) }
    .card-label { font-size:0.75rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em }
    .card-value { font-size:1.5rem; font-weight:700; margin-top:4px }
    .card-value.green { color:#16a34a }
    .card-value.yellow { color:#ca8a04 }
    .card-value.red { color:#dc2626 }
    table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.1); margin-bottom:1.5rem }
    th { background:#f9fafb; font-size:0.75rem; color:#6b7280; text-transform:uppercase; letter-spacing:.05em; padding:10px 12px; text-align:right; border-bottom:2px solid #e5e7eb }
    th:first-child { text-align:left }
    .section-title { font-size:1rem; font-weight:600; margin-bottom:8px; color:#374151 }
    .bar-table { background:#fff; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.1); margin-bottom:1.5rem; padding:8px 0 }
    .status { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:600 }
    .status.ok { background:#dcfce7; color:#166534 }
    .status.warn { background:#fef9c3; color:#854d0e }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏪 PastelHub — Prueba de Carga</h1>
    <p class="subtitle">${data.concurrency} usuarios concurrentes · ${data.rampSeconds}s ramp · ${data.steadySeconds}s steady · ${data.baseUrl}</p>

    <div class="cards">
      <div class="card">
        <div class="card-label">Peticiones</div>
        <div class="card-value">${data.totalRequests}</div>
      </div>
      <div class="card">
        <div class="card-label">Fallos</div>
        <div class="card-value ${data.failedRequests > 0 ? 'red' : 'green'}">${data.failedRequests} (${failRate}%)</div>
      </div>
      <div class="card">
        <div class="card-label">Throughput</div>
        <div class="card-value">${data.throughput} <span style="font-size:0.75rem;font-weight:400;color:#6b7280">req/s</span></div>
      </div>
      <div class="card">
        <div class="card-label">Duración</div>
        <div class="card-value">${data.durationSec} <span style="font-size:0.75rem;font-weight:400;color:#6b7280">s</span></div>
      </div>
    </div>

    <div class="section-title">Resultados por endpoint</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Endpoint</th>
          <th>Req</th>
          <th>Avg</th>
          <th>Min</th>
          <th>Max</th>
          <th>P50</th>
          <th>P95</th>
          <th>P99</th>
          <th>Errores</th>
        </tr>
      </thead>
      <tbody>
        ${epRows}
      </tbody>
    </table>

    <div class="section-title">Distribución de latencia (P95)</div>
    <div class="bar-table">
      <table style="box-shadow:none;margin:0">
        <tbody>
          ${barRows}
        </tbody>
      </table>
    </div>

    <p style="font-size:0.75rem;color:#9ca3af;text-align:center;margin-top:2rem">
      Generado el ${new Date().toLocaleString('es-PE')} · PastelHub Load Test
    </p>
  </div>
</body>
</html>`;

fs.writeFileSync(REPORT_FILE, html);
console.log(`Reporte HTML generado: ${REPORT_FILE}`);
