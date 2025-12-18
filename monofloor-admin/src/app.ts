import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin';
import { mobileRoutes } from './routes/mobile';
import proposalsRoutes from './routes/proposals.routes';

const app = express();

// CORS configuration
const allowedOrigins = [
  config.cors.adminPanelUrl,
  config.cors.mobileAppUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://vt.monofloor.cloud',
  'http://vt.monofloor.cloud',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, file://)
    if (!origin || origin === 'null') return callback(null, true);

    // Allow file:// protocol (for local HTML files)
    if (origin && origin.startsWith('file://')) {
      return callback(null, true);
    }

    // Allow any localhost origin during development
    if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (config.server.nodeEnv === 'development') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

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
