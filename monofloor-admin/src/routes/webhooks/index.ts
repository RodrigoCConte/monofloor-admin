/**
 * Webhook Routes
 *
 * Aggregates all webhook routes for external integrations
 */

import { Router } from 'express';
import typeformRoutes from './typeform.routes';

const router = Router();

// Typeform webhooks
router.use('/typeform', typeformRoutes);

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhooks endpoint is working',
    timestamp: new Date().toISOString(),
    available: ['typeform'],
  });
});

export { router as webhookRoutes };
