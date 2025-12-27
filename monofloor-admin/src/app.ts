import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';

// Force rebuild: 2024-12-21T01:15:00Z - PostgreSQL file storage
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin';
import { mobileRoutes } from './routes/mobile';
import { webhookRoutes } from './routes/webhooks';
import proposalsRoutes from './routes/proposals.routes';
import filesRoutes from './routes/files.routes';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// CORS configuration - whitelist allowed origins
const allowedOrigins = [
  config.cors.adminPanelUrl,
  config.cors.mobileAppUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:3001',
  // Production URLs
  'https://monofloor.com.br',
  'https://app.monofloor.com.br',
  'https://admin.monofloor.com.br',
  'https://devoted-wholeness-production.up.railway.app',
  // Hostinger VPS URLs
  'https://admin.monofloor.cloud',
  'https://app.monofloor.cloud',
  'http://app.monofloor.cloud:8081',
  // Capacitor iOS/Android native apps
  'capacitor://monofloor.app',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
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

// Serve admin panel static files (Vue.js build)
const adminPanelPath = path.join(__dirname, '../admin-panel/dist');
app.use('/admin', express.static(adminPanelPath));

// Handle admin panel SPA routing (all /admin/* routes serve index.html)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminPanelPath, 'index.html'));
});

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
app.use('/api/webhooks', webhookRoutes);

// File serving from PostgreSQL database
app.use('/files', filesRoutes);

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
