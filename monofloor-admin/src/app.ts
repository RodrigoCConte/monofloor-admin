import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';

// Force rebuild: 2024-12-18T02:45:00Z
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin';
import { mobileRoutes } from './routes/mobile';
import proposalsRoutes from './routes/proposals.routes';

const app = express();

// CORS configuration - allow all origins for video processing
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle OPTIONS preflight explicitly
app.options('*', cors());

// Body parsing (increased limit for base64 images)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve video processor static files
app.use('/video-processor', express.static(path.join(__dirname, '../public/video-processor')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Monofloor Admin API',
    version: '1.0.0',
    status: 'online',
    docs: '/api',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/proposals', proposalsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

export { app };
