import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const requiredEnvVars = ['JWT_ADMIN_SECRET', 'JWT_MOBILE_SECRET', 'DATABASE_URL'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Setup key for initial admin creation (MUST be set in production)
  setupKey: process.env.ADMIN_SETUP_KEY || (isProduction ? '' : 'DEV_SETUP_KEY_2024'),

  // JWT - Secrets MUST be set via environment variables in production
  jwt: {
    admin: {
      secret: process.env.JWT_ADMIN_SECRET || (isProduction ? '' : 'dev-admin-secret-not-for-production'),
      expiresIn: '8h',
      refreshExpiresIn: '7d',
    },
    mobile: {
      secret: process.env.JWT_MOBILE_SECRET || (isProduction ? '' : 'dev-mobile-secret-not-for-production'),
      expiresIn: '30d',
      refreshExpiresIn: '90d',
    },
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    uploadDir: './uploads',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || '',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },

  // CORS
  cors: {
    adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:5173',
    mobileAppUrl: process.env.MOBILE_APP_URL || 'http://localhost:3000',
  },

  // Typeform
  typeform: {
    apiKey: process.env.TYPEFORM_API_KEY || '',
    formIds: {
      waitlist: 'uQwmO6L6',
      contrato: 'MR7zP9Sl',
    },
    pollingIntervalMs: 60000, // 1 minuto
  },
};
