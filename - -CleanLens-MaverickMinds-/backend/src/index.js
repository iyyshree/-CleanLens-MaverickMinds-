import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportsRouterFactory from './routes/reports.js';
import { createMemoryStore } from './store/memoryStore.js';

dotenv.config();

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

// Middlewares
app.use(cors({ origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'clean-lens-backend' });
});

// Simple admin auth middleware for privileged routes
export function requireAdmin(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(501).json({ error: 'Admin API key not configured' });
  }
  const key = req.header('X-Admin-Api-Key');
  if (key && key === ADMIN_API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Create store (in-memory by default). Could be swapped for Firestore/Mongo adapter.
const store = createMemoryStore();

// Routes
app.use('/api/reports', reportsRouterFactory({ store }));

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Clean Lens backend listening on http://localhost:${PORT}`);
});


