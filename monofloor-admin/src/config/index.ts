import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwt: {
    admin: {
      secret: process.env.JWT_ADMIN_SECRET || 'admin-secret-change-this',
      expiresIn: '8h',
      refreshExpiresIn: '7d',
    },
    mobile: {
      secret: process.env.JWT_MOBILE_SECRET || 'mobile-secret-change-this',
      expiresIn: '30d',
      refreshExpiresIn: '90d',
    },
  },

  // Pipefy
  pipefy: {
    apiToken: process.env.PIPEFY_API_TOKEN || '',
    pipeId: process.env.PIPEFY_PIPE_ID || '306848975',
    endpoint: 'https://api.pipefy.com/graphql',
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
};
