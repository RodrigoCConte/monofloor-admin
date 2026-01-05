/**
 * Socket.io Service
 * Manages Socket.io instance and provides event emission functions
 * Now also sends push notifications for all user-facing events
 */

import { Server } from 'socket.io';
import {
  sendPushToUser,
  sendRoleEvolutionPush,
  sendLunchReminderPush,
  sendGPSAutoCheckoutPush,
  sendXPBonusPush,
  sendXPPenaltyPush,
} from './push.service';

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
  // Also send push notification
  sendLunchReminderPush(data.userId, data.reminderNumber).catch(console.error);
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
  // Also send push notification
  sendRoleEvolutionPush(data.userId, data.oldRole, data.newRole).catch(console.error);
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
  // Also send push notification
  sendXPBonusPush(data.userId, data.amount, data.reason || 'XP ganho!').catch(console.error);
}

/**
 * Emit XP lost event to a user (triggers XP loss animation)
 */
export function emitXPLost(data: {
  userId: string;
  userName: string;
  amount: number;
  reason?: string;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('xp:lost', data);
    // Also notify admin
    io.to('admin').emit('xp:lost', data);
    console.log(`[Socket] Emitted xp:lost to user:${data.userId} - -${data.amount} XP`);
  }
  // Also send push notification
  sendXPPenaltyPush(data.userId, data.amount, 'Sistema', data.reason || 'XP perdido').catch(console.error);
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
  // Also send push notification
  sendPushToUser(data.userId, {
    title: 'Parabens! Voce ganhou!',
    body: `${data.position}º lugar na campanha "${data.campaignName}"${data.prize ? ` - ${data.prize}` : ''} (+${data.xpReward} XP)`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'campaign-winner',
    data: { type: 'campaign:winner', campaignId: data.campaignId, position: data.position },
    requireInteraction: true,
  }).catch(console.error);
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
  // Also send push notification
  sendPushToUser(data.userId, {
    title: 'Nova Conquista Desbloqueada!',
    body: `Voce ganhou a conquista "${data.badgeName}"${data.reason ? ` - ${data.reason}` : ''}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `badge-${data.badgeId}`,
    data: { type: 'badge:earned', badgeId: data.badgeId, badgeName: data.badgeName },
    requireInteraction: true,
  }).catch(console.error);
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
  // Also send push notification
  sendPushToUser(userId, {
    title: data.title,
    body: data.message,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `notification-${data.id}`,
    data: { type: 'notification:new', id: data.id, xpReward: data.xpReward },
  }).catch(console.error);
}

/**
 * Emit punctuality multiplier event to a user
 * Triggered when user does a punctual first check-in of the day
 */
export function emitPunctualityMultiplier(data: {
  userId: string;
  userName: string;
  multiplier: number;
  streak: number;
  xpEarned: number;
  xpBase: number;
  isPunctual: boolean;
  minutesLate: number;
  streakBroken: boolean;
  timestamp: Date;
}): void {
  if (io) {
    io.to(`user:${data.userId}`).emit('punctuality:multiplier', data);
    // Also notify admin
    io.to('admin').emit('punctuality:multiplier', data);
    console.log(`[Socket] Emitted punctuality:multiplier to user:${data.userId} - ${data.multiplier}x (${data.streak} dias)`);
  }
  // Also send push notification
  if (data.isPunctual) {
    sendPushToUser(data.userId, {
      title: `Pontualidade ${data.multiplier.toFixed(1)}x!`,
      body: `+${data.xpEarned} XP - ${data.streak} dias consecutivos`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: 'punctuality',
      data: { type: 'punctuality:multiplier', multiplier: data.multiplier, streak: data.streak },
    }).catch(console.error);
  } else if (data.streakBroken) {
    sendPushToUser(data.userId, {
      title: 'Sequencia Perdida',
      body: `Voce chegou ${data.minutesLate} minutos atrasado. Sua sequencia foi zerada.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: 'punctuality',
      data: { type: 'punctuality:broken', minutesLate: data.minutesLate },
    }).catch(console.error);
  }
}

/**
 * Emit task updated event to admin and project room
 * Triggered when a task status/progress changes via mobile app
 */
export function emitTaskUpdated(data: {
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  newStatus: string;
  newProgress: number;
  timestamp: Date;
}): void {
  if (io) {
    // Notify admin room
    io.to('admin').emit('task:updated', data);
    // Notify project room (for ProjectDetail.vue)
    io.to(`project:${data.projectId}`).emit('task:updated', data);
    console.log(`[Socket] Emitted task:updated for project:${data.projectId} - Task "${data.taskTitle}" -> ${data.newStatus} (${data.newProgress}%)`);
  }
}

/**
 * Emit GPS auto-checkout event to a user
 * Triggered when user has GPS off for 5+ minutes (10 confirmations)
 */
export function emitGPSAutoCheckout(data: {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  hoursWorked: number;
  reason: string;
  timestamp: Date;
}): void {
  if (io) {
    // Send to the specific user's room
    io.to(`user:${data.userId}`).emit('gps:autoCheckout', data);
    // Also notify admin
    io.to('admin').emit('gps:autoCheckout', data);
    console.log(`[Socket] Emitted gps:autoCheckout to user:${data.userId} - GPS off for 10+ minutes`);
  }
  // Also send push notification
  sendGPSAutoCheckoutPush(data.userId, data.projectName).catch(console.error);
}

/**
 * Emit proposal opened event
 * Triggered when a client opens a proposal HTML
 */
export function emitProposalOpened(data: {
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  sessionId: string;
  deviceType: string;
  timestamp: Date;
}): void {
  if (io) {
    // Notify admin room (all admins will receive)
    io.to('admin').emit('proposal:opened', data);
    console.log(`[Socket] Emitted proposal:opened - Cliente "${data.clientName}" abriu proposta (${data.deviceType})`);
  }
}

/**
 * Emit proposal viewing update (time spent)
 * Triggered periodically while client is viewing the proposal
 */
export function emitProposalViewing(data: {
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  sessionId: string;
  timeOnPage: number;
  scrollDepth: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('proposal:viewing', data);
    // Log only every 60 seconds to reduce noise
    if (data.timeOnPage % 60 === 0) {
      console.log(`[Socket] Emitted proposal:viewing - "${data.clientName}" ${data.timeOnPage}s na proposta`);
    }
  }
}

/**
 * Emit proposal closed event
 * Triggered when client closes the proposal (or stops viewing)
 */
export function emitProposalClosed(data: {
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  sessionId: string;
  totalTimeOnPage: number;
  maxScrollDepth: number;
  timestamp: Date;
}): void {
  if (io) {
    io.to('admin').emit('proposal:closed', data);
    console.log(`[Socket] Emitted proposal:closed - "${data.clientName}" fechou proposta após ${data.totalTimeOnPage}s`);
  }
}
