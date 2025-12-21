import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { config } from './config';
import { PrismaClient } from '@prisma/client';
import { setSocketServer } from './services/socket.service';
import { startLunchScheduler } from './services/lunch-scheduler.service';
import { videoJobWorker, cleanupOldJobs } from './services/video-job-worker.service';
import { processScheduledReminders } from './services/report-reminder.service';
import { processScheduledLunchAlerts, cleanupOldLunchAlerts } from './services/lunch-alert.service';
import { processAllDailyWorktime } from './services/worktime.service';

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

      // Start video job worker
      videoJobWorker.start();
      console.log('🎬 Video Job Worker started');

      // Cleanup old jobs every 30 minutes
      setInterval(cleanupOldJobs, 30 * 60 * 1000);
      console.log('🗑️ Cleanup scheduler started (every 30 min)');

      // Process report reminders every minute
      setInterval(async () => {
        try {
          await processScheduledReminders();
        } catch (error) {
          console.error('❌ Error processing report reminders:', error);
        }
      }, 60 * 1000);
      console.log('📋 Report reminder scheduler started (every 1 min)');

      // Process lunch break alerts every minute
      setInterval(async () => {
        try {
          await processScheduledLunchAlerts();
        } catch (error) {
          console.error('❌ Error processing lunch alerts:', error);
        }
      }, 60 * 1000);
      console.log('🍽️ Lunch alert scheduler started (every 1 min)');

      // Cleanup old lunch alerts every hour
      setInterval(async () => {
        try {
          await cleanupOldLunchAlerts();
        } catch (error) {
          console.error('❌ Error cleaning up lunch alerts:', error);
        }
      }, 60 * 60 * 1000);

      // Schedule daily worktime calculation at 23:59
      const scheduleDailyWorktimeProcessing = () => {
        const now = new Date();
        const nextRun = new Date(now);
        nextRun.setHours(23, 59, 0, 0);

        // If it's already past 23:59 today, schedule for tomorrow
        if (now >= nextRun) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        const msUntilRun = nextRun.getTime() - now.getTime();

        setTimeout(async () => {
          console.log('⏰ Running daily worktime calculation...');
          try {
            const today = new Date();
            await processAllDailyWorktime(today);
            console.log('✅ Daily worktime calculation completed');
          } catch (error) {
            console.error('❌ Error in daily worktime calculation:', error);
          }

          // Schedule next run
          scheduleDailyWorktimeProcessing();
        }, msUntilRun);

        console.log(`⏰ Daily worktime calculation scheduled for ${nextRun.toISOString()}`);
      };

      scheduleDailyWorktimeProcessing();

      // Schedule absence detection at 20:00 daily (after work hours)
      const scheduleAbsenceDetection = () => {
        const now = new Date();
        const nextRun = new Date(now);
        nextRun.setHours(20, 0, 0, 0);

        // If it's already past 20:00 today, schedule for tomorrow
        if (now >= nextRun) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        const msUntilRun = nextRun.getTime() - now.getTime();

        setTimeout(async () => {
          try {
            console.log('🔍 Running daily absence detection...');
            const { detectUnreportedAbsences } = await import('./services/absence.service');
            await detectUnreportedAbsences(new Date());
            console.log('✅ Absence detection completed');
          } catch (error) {
            console.error('❌ Error in absence detection:', error);
          }

          // Schedule next run
          scheduleAbsenceDetection();
        }, msUntilRun);

        console.log(`👤 Absence detection scheduled for ${nextRun.toISOString()}`);
      };

      scheduleAbsenceDetection();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  videoJobWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  videoJobWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Keep process alive with periodic heartbeat log
setInterval(() => {
  console.log(`💓 Heartbeat at ${new Date().toISOString()}`);
}, 60000);

main();

export { prisma, io };
