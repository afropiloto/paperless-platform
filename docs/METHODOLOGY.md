# ATTN — Social Media Attention Index

The **ATTN Composite Index** is a market-cap-style benchmark for measuring aggregate social media attention across a diversified constituent basket — analogous to the S&P 500 for equity markets.

## Dashboard

With the API server running, open:

**http://localhost:3001/attention-index/**

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attention-index/dashboard` | GET | Ticker summary with sub-indices and top movers |
| `/api/attention-index/snapshot` | GET | Latest calculation with full constituent breakdown |
| `/api/attention-index/history?days=30` | GET | Historical index values for charting |
| `/api/attention-index/constituents` | GET | Index basket constituents |
| `/api/attention-index/methodology` | GET | Transparent scoring methodology (regulatory) |
| `/api/attention-index/audit-trail` | GET | Immutable event log for monitoring |
| `/api/attention-index/recalculate` | POST | Trigger manual recalculation |

## Scoring Methodology (v1.0.0)

### Raw Attention Score

```
score = 0.35·log₁₀(1+V) + 0.25·E + 0.20·log₁₀(1+R) + 0.20·tanh(velocity)
```

- **V** — mention volume (24h)
- **E** — engagement rate [0, 1]
- **R** — unique reach (distinct authors)
- **velocity** — (Vₜ − Vₜ₋₁) / Vₜ₋₁

### Quality Adjustments

1. **Bot dampening** — score × (1 − botScore × 0.85)
2. **Volume spike cap** — when z-score > 3, apply √(excess) dampening
3. **Liquidity floor** — constituents below 100 mentions/day are proportionally down-weighted

### Index Calculation

Chain-linked Laspeyres with float-adjusted weighting:

```
Indexₜ = Indexₜ₋₁ × (1 + Σ(wᵢ × (scoreᵢₜ/scoreᵢₜ₋₁ − 1)))
```

Base value: **1,000** at inception.

### Sector Sub-Indices

- `ATTN-TECH` — Technology
- `ATTN-POL` — Politics
- `ATTN-CUL` — Culture & Entertainment
- `ATTN-ECON` — Economy & Finance
- `ATTN-HLT` — Health
- `ATTN-SPT` — Sports

## Regulatory & Monitoring Features

- **SHA-256 provenance hash** on every calculation snapshot
- **Immutable audit trail** for calculations, rebalances, anomalies, and methodology changes
- **Anomaly detection** with severity classification (volume spikes, bot activity, concentration risk)
- **Full constituent decomposition** — raw score, adjusted score, weight, and flags per topic
- **Platform attribution** — each constituent tagged with source platform
- **Hourly recalculation** via scheduled cron job

## Development

```bash
cd apps/attn-index
npm install
npm run dev
# Dashboard: http://localhost:8101/
# API:       http://localhost:8101/api/attention-index/dashboard
```
