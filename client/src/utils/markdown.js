function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#1D9E75;text-decoration:underline">$1</a>');
}

function parseLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('### ')) return `<h3 style="font-size:14px;font-weight:600;margin:8px 0 4px">${parseInline(trimmed.slice(4))}</h3>`;
  if (trimmed.startsWith('## ')) return `<h2 style="font-size:15px;font-weight:700;margin:8px 0 4px">${parseInline(trimmed.slice(3))}</h2>`;
  if (trimmed.startsWith('# ')) return `<h1 style="font-size:16px;font-weight:700;margin:8px 0 4px">${parseInline(trimmed.slice(2))}</h1>`;
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return `<li style="margin-left:12px;list-style:disc">${parseInline(trimmed.slice(2))}</li>`;
  if (/^\d+\.\s/.test(trimmed)) return `<li style="margin-left:12px;list-style:decimal">${parseInline(trimmed.replace(/^\d+\.\s/, ''))}</li>`;
  return `<p style="margin:2px 0;line-height:1.5">${parseInline(trimmed)}</p>`;
}

export function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let inCode = false;
  let codeBuf = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += `<pre style="background:#1f2937;color:#f3f4f6;padding:10px;border-radius:8px;font-size:12px;overflow-x:auto;margin:4px 0"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`;
        codeBuf = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.trim() === '') { html += '<br/>'; continue; }
    html += parseLine(line);
  }
  if (inCode && codeBuf.length) {
    html += `<pre style="background:#1f2937;color:#f3f4f6;padding:10px;border-radius:8px;font-size:12px;overflow-x:auto;margin:4px 0"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`;
  }
  return html;
}
