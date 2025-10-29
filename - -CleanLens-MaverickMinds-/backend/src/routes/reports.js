import express from 'express';
import Joi from 'joi';
import { requireAdmin } from '../index.js';

const createReportSchema = Joi.object({
  userId: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  imageUrl: Joi.string().uri().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().allow('').default(''),
  ward: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  urgency: Joi.string().valid('Low', 'Medium', 'High').default('Low'),
  // optional client-side timestamp
  timestamp: Joi.string().optional(),
});

export default function reportsRouterFactory({ store }) {
  const router = express.Router();

  // List reports with optional filters
  router.get('/', (req, res) => {
    const { status, q } = req.query;
    const items = store.listReports({ status, q });
    res.json(items);
  });

  // Basic stats
  router.get('/stats', (req, res) => {
    res.json(store.getStats());
  });

  // Get single report
  router.get('/:id', (req, res) => {
    const item = store.getReport(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  // Submit new report (simulates mobile app submission)
  router.post('/', (req, res) => {
    const { error, value } = createReportSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details });
    const created = store.createReport({ ...value });
    res.status(201).json(created);
  });

  // Update status (admin-only)
  router.patch('/:id/status', requireAdmin, (req, res) => {
    const next = String(req.body?.status || '');
    try {
      const updated = store.updateStatus(req.params.id, next);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}


