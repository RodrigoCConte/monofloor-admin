/**
 * Socket.io Client Service for Admin Panel
 * Handles real-time communication with the backend
 */

import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Socket instance
let socket: Socket | null = null;

// Connection status
export const isConnected = ref(false);

// Event types
export interface LocationUpdate {
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
}

export interface CheckinEvent {
  userId: string;
  userName: string;
  userPhoto: string | null;
  projectId: string;
  projectName: string;
  isIrregular: boolean;
  timestamp: Date;
}

export interface CheckoutEvent {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  hoursWorked: number;
  timestamp: Date;
}

export interface OutOfAreaEvent {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  distance: number;
  timestamp: Date;
}

export interface UserOfflineEvent {
  userId: string;
  userName: string;
  lastBatteryLevel: number | null;
  lastSeen: Date;
  shutdownReason: 'intentional' | 'low_battery' | 'unknown';
}

export interface BatteryCriticalEvent {
  userId: string;
  userName: string;
  batteryLevel: number;
  timestamp: Date;
}

// Event listeners storage
type EventCallback<T> = (data: T) => void;
const listeners: { [key: string]: EventCallback<any>[] } = {};

/**
 * Connect to Socket.io server
 */
export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
    isConnected.value = true;

    // Join admin room to receive updates
    socket?.emit('join:admin');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
    isConnected.value = false;
  });

  socket.on('connect_error', (error) => {
    console.log('🔌 Socket connection error:', error.message);
    isConnected.value = false;
  });

  // Forward events to registered listeners
  socket.on('location:update', (data: LocationUpdate) => {
    notifyListeners('location:update', data);
  });

  socket.on('checkin:new', (data: CheckinEvent) => {
    notifyListeners('checkin:new', data);
  });

  socket.on('checkout:done', (data: CheckoutEvent) => {
    notifyListeners('checkout:done', data);
  });

  socket.on('user:outOfArea', (data: OutOfAreaEvent) => {
    notifyListeners('user:outOfArea', data);
  });

  socket.on('user:backInArea', (data: OutOfAreaEvent) => {
    notifyListeners('user:backInArea', data);
  });

  socket.on('user:offline', (data: UserOfflineEvent) => {
    notifyListeners('user:offline', data);
  });

  socket.on('battery:critical', (data: BatteryCriticalEvent) => {
    notifyListeners('battery:critical', data);
  });

  return socket;
}

/**
 * Disconnect from Socket.io server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected.value = false;
  }
}

/**
 * Get socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Register a listener for an event
 */
export function onLocationUpdate(callback: EventCallback<LocationUpdate>): () => void {
  return addListener('location:update', callback);
}

export function onCheckin(callback: EventCallback<CheckinEvent>): () => void {
  return addListener('checkin:new', callback);
}

export function onCheckout(callback: EventCallback<CheckoutEvent>): () => void {
  return addListener('checkout:done', callback);
}

export function onOutOfArea(callback: EventCallback<OutOfAreaEvent>): () => void {
  return addListener('user:outOfArea', callback);
}

export function onBackInArea(callback: EventCallback<OutOfAreaEvent>): () => void {
  return addListener('user:backInArea', callback);
}

export function onUserOffline(callback: EventCallback<UserOfflineEvent>): () => void {
  return addListener('user:offline', callback);
}

export function onBatteryCritical(callback: EventCallback<BatteryCriticalEvent>): () => void {
  return addListener('battery:critical', callback);
}

/**
 * Helper to add listener and return unsubscribe function
 */
function addListener<T>(event: string, callback: EventCallback<T>): () => void {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Return unsubscribe function
  return () => {
    const eventListeners = listeners[event];
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  };
}

/**
 * Notify all listeners of an event
 */
function notifyListeners<T>(event: string, data: T): void {
  if (listeners[event]) {
    listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

/**
 * Join a specific project room for project-specific updates
 */
export function joinProject(projectId: string): void {
  if (socket?.connected) {
    socket.emit('join:project', projectId);
  }
}

/**
 * Leave a project room
 */
export function leaveProject(projectId: string): void {
  if (socket?.connected) {
    socket.emit('leave:project', projectId);
  }
}
