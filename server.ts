import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { AttentionIndexStore } from './src/attention-index.store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8101);

const app = express();
const store = new AttentionIndexStore();

app.use(express.json());

app.get('/api/attention-index/dashboard', (_req, res) => {
  res.json(store.getDashboardSummary());
});

app.get('/api/attention-index/snapshot', (_req, res) => {
  res.json(store.getLatestSnapshot());
});

app.get('/api/attention-index/history', (req, res) => {
  const days = Math.max(1, Number(req.query.days) || 30);
  res.json(store.getHistory(days));
});

app.get('/api/attention-index/constituents', (_req, res) => {
  res.json(store.getConstituents());
});

app.get('/api/attention-index/methodology', (_req, res) => {
  res.json(store.getMethodology());
});

app.get('/api/attention-index/audit-trail', (req, res) => {
  const limit = Math.max(1, Number(req.query.limit) || 50);
  res.json(store.getAuditTrail(limit));
});

app.post('/api/attention-index/recalculate', (_req, res) => {
  res.status(201).json(store.recalculate());
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ATTN Index running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/`);
});
