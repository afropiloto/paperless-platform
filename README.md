# ATTN — Social Media Attention Index

The **ATTN Composite Index** is an S&P 500-style benchmark for measuring aggregate social media attention — built for [810](https://810.one) prediction markets on social attention outcomes.

## Quick start

```bash
npm install
npm run dev
```

- **Dashboard:** http://localhost:8101/
- **API:** http://localhost:8101/api/attention-index/dashboard

## What it does

- Scores attention across a diversified constituent basket (volume, engagement, reach, velocity)
- Applies quality adjustments (bot dampening, volume spike caps, liquidity floor)
- Computes a chain-linked Laspeyres index (base = 1,000)
- Detects anomalies for regulatory monitoring
- SHA-256 provenance hash + immutable audit trail on every calculation

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/attention-index/dashboard` | Ticker summary |
| `GET /api/attention-index/snapshot` | Full constituent breakdown |
| `GET /api/attention-index/history?days=30` | Chart data |
| `GET /api/attention-index/methodology` | Scoring methodology |
| `GET /api/attention-index/audit-trail` | Regulatory event log |
| `POST /api/attention-index/recalculate` | Manual refresh |

See [README details](./docs/METHODOLOGY.md) for the full scoring formula.

## Scripts

```bash
npm run dev      # Start with hot reload
npm start        # Production start
npm test         # Run scoring engine tests
npm run lint     # TypeScript check
```

## License

Private — 810
