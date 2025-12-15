/**
 * Socket.io Service
 * Manages Socket.io instance and provides event emission functions
 */

import { Server } from 'socket.io';

let io: Server | null = null;

/**
 * Set the Socket.io server instance
 */
export function setSocketServer(server: Server): void {
  io = server;
}

/**
 * Get the Socket.io server instance
 */
export function getSocketServer(): Server | null {
  return io;
}

/**
 * Emit location update event to admin room
 */
export function emitLocationUpdate(data: {
  userId: string;
  userName: string;
  userPhoto: string | null;
  latitude: number;
  longitude: number;
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOutOfArea: boolean;
  distanceFromProject: number | null;
  currentProjectId: string | null;
  currentProjectName: string | null;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('location:update', data);
    if (data.currentProjectId) {
      io.to(`project:${data.currentProjectId}`).emit('location:update', data);
    }
  }
}

/**
 * Emit user offline event
 */
export function emitUserOffline(data: {
  userId: string;
  userName: string;
  lastBatteryLevel: number | null;
  lastSeen: Date;
  shutdownReason: 'intentional' | 'low_battery' | 'unknown';
}): void {
  if (io) {
    io.to('admin').emit('user:offline', data);
  }
}

/**
 * Emit out of area alert
 */
export function emitOutOfArea(data: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  distance: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('user:outOfArea', data);
    io.to(`project:${data.projectId}`).emit('user:outOfArea', data);
  }
}

/**
 * Emit back in area event
 */
export function emitBackInArea(data: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('user:backInArea', data);
    io.to(`project:${data.projectId}`).emit('user:backInArea', data);
  }
}

/**
 * Emit check-in event
 */
export function emitCheckin(data: {
  userId: string;
  userName: string;
  userPhoto: string | null;
  projectId: string;
  projectName: string;
  isIrregular: boolean;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('checkin:new', data);
    io.to(`project:${data.projectId}`).emit('checkin:new', data);
  }
}

/**
 * Emit checkout event
 */
export function emitCheckout(data: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  hoursWorked: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('checkout:done', data);
    io.to(`project:${data.projectId}`).emit('checkout:done', data);
  }
}

/**
 * Emit battery critical event
 */
export function emitBatteryCritical(data: {
  userId: string;
  userName: string;
  batteryLevel: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('battery:critical', data);
  }
}

/**
 * Emit lunch reminder to a specific user
 */
export function emitLunchReminder(data: {
  userId: string;
  userName: string;
  reminderNumber: number; // 1, 2, or 3 (12:00, 12:30, 13:00)
  timestamp: Date;
}): void {
  if (io) {
    // Send to the specific user's room
    io.to(`user:${data.userId}`).emit('lunch:reminder', data);
    // Also notify admin
    io.to('admin').emit('lunch:reminder', data);
  }
}

/**
 * Emit leaving area during lunch prompt
 */
export function emitLunchLeavingPrompt(data: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  distance: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('lunch:leavingPrompt', data);
  }
}

/**
 * Emit role evolution event (Pokemon style promotion notification)
 */
export function emitRoleEvolution(data: {
  userId: string;
  userName: string;
  oldRole: string;
  newRole: string;
  timestamp: Date;
}): void {
  if (io) {
    // Send to the specific user's room
    io.to(`user:${data.userId}`).emit('role:evolution', data);
    // Also notify admin
    io.to('admin').emit('role:evolution', data);
    console.log(`[Socket] Emitted role:evolution to user:${data.userId} - ${data.oldRole} -> ${data.newRole}`);
  }
}

/**
 * Emit event to all mobile users
 */
export function emitToMobile(event: string, data: any): void {
  if (io) {
    // Broadcast to all connected clients (mobile users will listen for this)
    io.emit(event, data);
    console.log(`[Socket] Emitted ${event} to all clients`);
  }
}

/**
 * Emit event to a specific user
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[Socket] Emitted ${event} to user:${userId}`);
  }
}

/**
 * Emit XP gained event to a user (triggers gamified XP animation)
 */
export function emitXPGained(data: {
  userId: string;
  userName: string;
  amount: number;
  reason?: string;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('xp:gained', data);
    // Also notify admin
    io.to('admin').emit('xp:gained', data);
    console.log(`[Socket] Emitted xp:gained to user:${data.userId} - +${data.amount} XP`);
  }
}

/**
 * Emit campaign winner event (triggers victory celebration animation)
 */
export function emitCampaignWinner(data: {
  userId: string;
  userName: string;
  campaignId: string;
  campaignName: string;
  position: number;
  xpReward: number;
  prize?: string;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('campaign:winner', data);
    // Also notify admin
    io.to('admin').emit('campaign:winner', data);
    console.log(`[Socket] Emitted campaign:winner to user:${data.userId} - ${data.position}º lugar em "${data.campaignName}"`);
  }
}

/**
 * Emit badge earned event (triggers badge celebration animation)
 */
export function emitBadgeEarned(data: {
  userId: string;
  userName: string;
  badgeId: string;
  badgeName: string;
  badgeIconUrl: string;
  badgeColor: string;
  badgeRarity: string;
  reason?: string;
  campaignId?: string;
  campaignName?: string;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('badge:earned', data);
    // Also notify admin
    io.to('admin').emit('badge:earned', data);
    console.log(`[Socket] Emitted badge:earned to user:${data.userId} - Badge "${data.badgeName}"`);
  }
}

/**
 * Emit notification to all connected mobile users
 * This will trigger a popup notification with optional video
 */
export function emitNotification(data: {
  id: string;
  title: string;
  message: string;
  videoUrl: string | null;
  videoDuration: number | null;
  xpReward: number;
}): void {
  if (io) {
    // Broadcast to all connected clients
    io.emit('notification:new', {
      ...data,
      timestamp: new Date(),
    });
    console.log(`[Socket] Emitted notification:new to all clients - "${data.title}"`);
  }
}

/**
 * Emit notification to a specific user
 */
export function emitNotificationToUser(userId: string, data: {
  id: string;
  title: string;
  message: string;
  videoUrl: string | null;
  videoDuration: number | null;
  xpReward: number;
}): void {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', {
      ...data,
      timestamp: new Date(),
    });
    console.log(`[Socket] Emitted notification:new to user:${userId} - "${data.title}"`);
  }
}
