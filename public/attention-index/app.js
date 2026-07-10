const API_BASE = '/api/attention-index';

let chart = null;
let historyDays = 30;

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function formatNumber(n, decimals = 2) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatNumber(n)}%`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function setChangeClass(el, value) {
  el.classList.remove('positive', 'negative');
  if (value > 0) el.classList.add('positive');
  else if (value < 0) el.classList.add('negative');
}

function botRiskClass(score) {
  if (score < 0.2) return 'bot-low';
  if (score < 0.5) return 'bot-med';
  return 'bot-high';
}

async function loadDashboard() {
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');

  try {
    const [dashboard, snapshot, history, methodology, audit] = await Promise.all([
      fetchJson('/dashboard'),
      fetchJson('/snapshot'),
      fetchJson(`/history?days=${historyDays}`),
      fetchJson('/methodology'),
      fetchJson('/audit-trail?limit=20'),
    ]);

    statusPill.classList.add('live');
    statusText.textContent = 'Live';

    document.getElementById('index-value').textContent = formatNumber(dashboard.indexValue);
    const changeEl = document.getElementById('index-change');
    changeEl.querySelector('.change-value').textContent = formatPercent(dashboard.changePercent);
    setChangeClass(changeEl, dashboard.changePercent);

    const c24 = document.getElementById('change-24h');
    c24.textContent = formatPercent(dashboard.change24h);
    setChangeClass(c24, dashboard.change24h);

    const c7 = document.getElementById('change-7d');
    c7.textContent = formatPercent(dashboard.change7d);
    setChangeClass(c7, dashboard.change7d);

    document.getElementById('constituent-count').textContent = dashboard.activeConstituents;
    const anomalyEl = document.getElementById('anomaly-count');
    anomalyEl.textContent = dashboard.anomalyCount;
    if (dashboard.anomalyCount > 0) anomalyEl.classList.add('high');

    document.getElementById('last-calc').textContent = formatTime(dashboard.calculatedAt);
    const hashEl = document.getElementById('provenance-hash');
    hashEl.textContent = dashboard.dataProvenanceHash.slice(0, 12) + '…';
    hashEl.title = dashboard.dataProvenanceHash;

    document.getElementById('methodology-version').textContent = `v${dashboard.methodologyVersion}`;
    document.getElementById('footer-version').textContent = dashboard.methodologyVersion;

    renderAnomalyBanner(snapshot.anomalies);
    renderChart(history);
    renderSubIndices(dashboard.subIndices);
    renderConstituents(snapshot.constituents);
    renderMethodology(methodology);
    renderAudit(audit);
  } catch (err) {
    statusPill.classList.add('error');
    statusText.textContent = 'Offline — start API server';
    console.error(err);
  }
}

function renderAnomalyBanner(anomalies) {
  const banner = document.getElementById('anomaly-banner');
  if (!anomalies || anomalies.length === 0) {
    banner.classList.add('hidden');
    return;
  }

  const critical = anomalies.filter((a) => a.severity === 'critical' || a.severity === 'high');
  banner.classList.remove('hidden', 'critical');
  if (critical.length > 0) banner.classList.add('critical');

  banner.innerHTML = `<strong>${anomalies.length} anomaly alert${anomalies.length > 1 ? 's' : ''}</strong>: ${anomalies
    .slice(0, 3)
    .map((a) => a.description)
    .join(' · ')}${anomalies.length > 3 ? '…' : ''}`;
}

function renderChart(history) {
  const ctx = document.getElementById('index-chart').getContext('2d');
  const labels = history.map((h) =>
    new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );
  const values = history.map((h) => h.indexValue);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'ATTN',
          data: values,
          borderColor: '#6ee7b7',
          backgroundColor: 'rgba(110, 231, 183, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: history.length > 14 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1d28',
          borderColor: '#2a2e3d',
          borderWidth: 1,
          titleFont: { family: 'JetBrains Mono' },
          bodyFont: { family: 'JetBrains Mono' },
          callbacks: {
            label: (ctx) => ` ${formatNumber(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(42, 46, 61, 0.5)' },
          ticks: { color: '#8b92a8', maxTicksLimit: 8, font: { size: 10 } },
        },
        y: {
          grid: { color: 'rgba(42, 46, 61, 0.5)' },
          ticks: {
            color: '#8b92a8',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: (v) => formatNumber(v, 0),
          },
        },
      },
    },
  });
}

function renderSubIndices(subIndices) {
  const grid = document.getElementById('subindices-grid');
  grid.innerHTML = subIndices
    .map(
      (s) => `
    <div class="subindex-card">
      <div>
        <div class="subindex-symbol">${s.symbol}</div>
        <div class="subindex-sector">${s.sector} · ${s.constituentCount} stocks</div>
      </div>
      <div style="text-align:right">
        <div class="subindex-value">${formatNumber(s.indexValue)}</div>
        <div class="subindex-change ${s.changePercent >= 0 ? 'positive' : 'negative'}">${formatPercent(s.changePercent)}</div>
      </div>
    </div>`,
    )
    .join('');
}

function renderConstituents(constituents) {
  const tbody = document.getElementById('constituents-body');
  tbody.innerHTML = constituents
    .sort((a, b) => b.weight - a.weight)
    .map(
      (c) => `
    <tr>
      <td class="symbol">${c.symbol}</td>
      <td>${c.name}</td>
      <td class="sector">${c.sector}</td>
      <td class="platform">${c.platform}</td>
      <td class="num">${formatNumber(c.weight)}%</td>
      <td class="num">${formatNumber(c.adjustedScore, 3)}</td>
      <td class="num">${c.mentionVolume.toLocaleString()}</td>
      <td class="num">${formatNumber(c.engagementRate * 100, 1)}%</td>
      <td class="num ${botRiskClass(c.botScore)}">${formatNumber(c.botScore * 100, 0)}%</td>
      <td>${(c.anomalyFlags || []).map((f) => `<span class="flag">${f}</span>`).join('') || '—'}</td>
    </tr>`,
    )
    .join('');
}

function renderMethodology(m) {
  const el = document.getElementById('methodology-content');
  el.innerHTML = `
    <p>${m.description}</p>
    <h3>Raw Attention Score</h3>
    <p><code>${m.scoringFormula.rawScore}</code></p>
    <div class="weights">
      ${Object.entries(m.scoringFormula.weights)
        .map(([k, v]) => `<div class="weight-item">${k}: ${(v * 100).toFixed(0)}%</div>`)
        .join('')}
    </div>
    <h3>Quality Adjustments</h3>
    <ul>${m.scoringFormula.qualityAdjustments.map((q) => `<li>${q}</li>`).join('')}</ul>
    <h3>Index Calculation</h3>
    <p><code>${m.indexCalculation}</code></p>
    <h3>Rebalance Policy</h3>
    <p>${m.rebalancePolicy}</p>
    <h3>Regulatory Compliance</h3>
    <ul>${m.regulatoryCompliance.map((r) => `<li>${r}</li>`).join('')}</ul>
  `;
}

function renderAudit(events) {
  const list = document.getElementById('audit-list');
  if (!events.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem">No audit events yet.</p>';
    return;
  }
  list.innerHTML = events
    .map(
      (e) => `
    <div class="audit-item">
      <div class="audit-type">${e.eventType.replace(/_/g, ' ')}</div>
      <div class="audit-desc">${e.description}</div>
      <div class="audit-time">${formatTime(e.createdAt)}</div>
      ${e.provenanceHash ? `<div class="audit-hash">${e.provenanceHash.slice(0, 24)}…</div>` : ''}
    </div>`,
    )
    .join('');
}

document.querySelectorAll('.chart-tabs .tab').forEach((tab) => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.chart-tabs .tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    historyDays = Number(tab.dataset.days);
    try {
      const history = await fetchJson(`/history?days=${historyDays}`);
      renderChart(history);
    } catch (err) {
      console.error(err);
    }
  });
});

document.getElementById('btn-refresh').addEventListener('click', async () => {
  const btn = document.getElementById('btn-refresh');
  btn.disabled = true;
  btn.textContent = '↻ Calculating…';
  try {
    await fetchJson('/recalculate', { method: 'POST' });
    await loadDashboard();
  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = '↻ Recalculate';
  }
});

loadDashboard();
setInterval(loadDashboard, 60000);
