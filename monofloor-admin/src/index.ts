import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { config } from './config';
import { PrismaClient } from '@prisma/client';
import { setSocketServer } from './services/socket.service';
import { startLunchScheduler } from './services/lunch-scheduler.service';

const prisma = new PrismaClient();

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Register Socket.io instance with socket service
setSocketServer(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join admin room for receiving updates
  socket.on('join:admin', () => {
    socket.join('admin');
    console.log(`👤 Admin joined: ${socket.id}`);
  });

  // Join specific project room
  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    console.log(`📍 Joined project ${projectId}: ${socket.id}`);
  });

  // Join user-specific room for receiving personal notifications (mobile app)
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`📱 Mobile user joined: ${userId} (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

async function main() {
  try {
    // Log environment info for debugging Railway deployment
    console.log('🔍 Environment:', process.env.NODE_ENV);
    console.log('🔍 PORT from env:', process.env.PORT);
    console.log('🔍 Config port:', config.port);

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server with Socket.io
    // Railway requires binding to 0.0.0.0, not localhost
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    httpServer.listen(config.port, host, () => {
      console.log(`🚀 Server running on ${host}:${config.port}`);
      console.log(`🔌 Socket.io enabled`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);

      // Start lunch reminder scheduler
      startLunchScheduler();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();

export { prisma, io };
