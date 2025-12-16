<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { locationsApi } from '../api';
import {
  connectSocket,
  disconnectSocket,
  onLocationUpdate,
  onCheckin,
  onCheckout,
  onOutOfArea,
  onBackInArea,
  isConnected,
  type LocationUpdate,
} from '../services/socket';

const router = useRouter();
const authStore = useAuthStore();

// API URL for building photo URLs
const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

// Helper to get full photo URL
const getPhotoUrl = (photoUrl: string | null | undefined): string | null => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}${photoUrl}`;
};

// Get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const markers = ref<Map<string, google.maps.Marker>>(new Map());
const infoWindow = ref<google.maps.InfoWindow | null>(null);
const loading = ref(true);
const error = ref('');
const lastUpdate = ref<Date | null>(null);
const refreshInterval = ref<number | null>(null);

// Socket.io unsubscribe functions
let unsubscribeLocation: (() => void) | null = null;
let unsubscribeCheckin: (() => void) | null = null;
let unsubscribeCheckout: (() => void) | null = null;
let unsubscribeOutOfArea: (() => void) | null = null;
let unsubscribeBackInArea: (() => void) | null = null;

// Store additional marker data (battery, outOfArea)
const markerData = ref<Map<string, {
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOutOfArea: boolean;
  distanceFromProject: number | null;
}>>(new Map());

// Stats
const onlineCount = ref(0);
const offlineCount = ref(0);
const selectedUser = ref<any>(null);

// Handle real-time location update from Socket.io
const handleLocationUpdate = (data: LocationUpdate) => {
  const markerId = data.userId;

  // Update marker data
  markerData.value.set(markerId, {
    batteryLevel: data.batteryLevel,
    isCharging: data.isCharging,
    isOutOfArea: data.isOutOfArea,
    distanceFromProject: data.distanceFromProject,
  });

  // If marker exists, update position
  if (markers.value.has(markerId)) {
    const marker = markers.value.get(markerId)!;
    marker.setPosition({ lat: data.latitude, lng: data.longitude });

    // Update marker icon to show out-of-area status
    const userData = (marker as any).userData;
    if (userData) {
      userData.isOutOfArea = data.isOutOfArea;
      userData.batteryLevel = data.batteryLevel;
      userData.isCharging = data.isCharging;
      const userRole = userData.user?.role || '';
      const userName = userData.user?.name || '';
      marker.setIcon(createMarkerIcon(true, userRole, userName, data.isOutOfArea));
    }

    lastUpdate.value = new Date();
  }

  console.log(`📍 Real-time update: ${data.userName} at (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}) - Battery: ${data.batteryLevel}%`);
};

// Google Maps API key - should be in env
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const formatLastSeen = (date: string) => {
  const now = new Date();
  const seen = new Date(date);
  const diffMinutes = Math.floor((now.getTime() - seen.getTime()) / 60000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min atras`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atras`;
  return seen.toLocaleDateString('pt-BR');
};

// Battery indicator helpers
const getBatteryColor = (level: number | null | undefined): string => {
  if (level === null || level === undefined) return '#9ca3af'; // gray
  if (level > 50) return '#22c55e'; // green
  if (level > 20) return '#f59e0b'; // yellow/amber
  return '#ef4444'; // red
};

const getBatteryIcon = (level: number | null | undefined, isCharging: boolean | null | undefined): string => {
  if (isCharging) return '⚡';
  if (level === null || level === undefined) return '🔋';
  if (level > 50) return '🔋';
  if (level > 20) return '🔋';
  return '🪫';
};

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

const initMap = async () => {
  if (!mapContainer.value) return;

  try {
    await loadGoogleMapsScript();

    // Default center: Sao Paulo
    const defaultCenter = { lat: -23.5505, lng: -46.6333 };

    // Waze-inspired dark map style
    const wazeStyleDark = [
      // Base elements - very dark background
      { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },

      // Administrative
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
      { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c9a962' }] },
      { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#7c8594' }] },

      // POI - hide most, keep minimal
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3a2f' }, { visibility: 'on' }] },

      // Roads - Waze style with clear hierarchy
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

      // Highways - prominent yellow/gold like Waze
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#5c4d3c' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }, { weight: 1 }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#c9a962' }] },

      // Arterial roads - lighter gray
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#3d4a5c' }] },
      { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },

      // Local roads - subtle
      { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#2a3441' }] },
      { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },

      // Transit
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },

      // Water - dark blue
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1729' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },

      // Landscape
      { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1a2332' }] },
    ];

    map.value = new google.maps.Map(mapContainer.value, {
      center: defaultCenter,
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      styles: wazeStyleDark,
    } as google.maps.MapOptions);

    infoWindow.value = new google.maps.InfoWindow();

    await loadLocations();

    // Connect to Socket.io for real-time updates
    connectSocket();

    // Listen for real-time location updates
    unsubscribeLocation = onLocationUpdate(handleLocationUpdate);
    unsubscribeCheckin = onCheckin(() => loadLocations());
    unsubscribeCheckout = onCheckout(() => loadLocations());
    unsubscribeOutOfArea = onOutOfArea((data) => {
      console.log('User out of area:', data.userName, data.distance, 'm');
    });
    unsubscribeBackInArea = onBackInArea((data) => {
      console.log('User back in area:', data.userName);
    });

    // Fallback: refresh every 60 seconds in case socket disconnects
    refreshInterval.value = window.setInterval(loadLocations, 60000);
  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar mapa';
    console.error('Map init error:', err);
  } finally {
    loading.value = false;
  }
};

// Character types based on roles in the project
type CharacterType = 'lider' | 'aplicador_1' | 'aplicador_2' | 'aplicador_3' | 'lider_preparacao' | 'preparador' | 'auxiliar';

// Character config with PNG icons, labels, and original dimensions for proper aspect ratio
const characterConfig: Record<CharacterType, { label: string; icon: string; color: string; width: number; height: number }> = {
  lider: { label: 'Líder', icon: '/icons/lider.png', color: '#FF6B35', width: 359, height: 289 },
  aplicador_1: { label: 'Aplicador 1', icon: '/icons/aplicador-1.png', color: '#9B5DE5', width: 250, height: 223 },
  aplicador_2: { label: 'Aplicador 2', icon: '/icons/aplicador-2.png', color: '#9B5DE5', width: 317, height: 212 },
  aplicador_3: { label: 'Aplicador 3', icon: '/icons/aplicador-3.png', color: '#9B5DE5', width: 411, height: 259 },
  lider_preparacao: { label: 'Líder Prep', icon: '/icons/lider-preparacao.png', color: '#3B82F6', width: 314, height: 262 },
  preparador: { label: 'Preparador', icon: '/icons/preparador.png', color: '#00D4FF', width: 281, height: 216 },
  auxiliar: { label: 'Ajudante', icon: '/icons/ajudante.png', color: '#8B7355', width: 187, height: 228 },
};

// Get character type based on role
const getCharacterType = (role: string, _name: string): CharacterType => {
  switch (role) {
    case 'LIDER':
      return 'lider';
    case 'APLICADOR':
    case 'APLICADOR_1':
      return 'aplicador_1';
    case 'APLICADOR_2':
      return 'aplicador_2';
    case 'APLICADOR_3':
      return 'aplicador_3';
    case 'LIDER_PREPARACAO':
      return 'lider_preparacao';
    case 'PREPARADOR':
      return 'preparador';
    case 'AUXILIAR':
    case 'AJUDANTE':
    default:
      return 'auxiliar';
  }
};

// Create marker icon using PNG images directly with proper aspect ratio
const createMarkerIcon = (_isOnline: boolean, role?: string, _name?: string, _isOutOfArea?: boolean) => {
  const characterType = getCharacterType(role || '', '');
  const config = characterConfig[characterType];

  // Calculate scaled size maintaining aspect ratio
  // Target height: 48px, calculate width proportionally
  const targetHeight = 48;
  const aspectRatio = config.width / config.height;
  const scaledWidth = Math.round(targetHeight * aspectRatio);
  const scaledHeight = targetHeight;

  return {
    url: config.icon,
    scaledSize: new google.maps.Size(scaledWidth, scaledHeight),
    anchor: new google.maps.Point(Math.round(scaledWidth / 2), scaledHeight),
  };
};

const loadLocations = async () => {
  try {
    const response = await locationsApi.getMapData();
    const data = response.data.data;

    onlineCount.value = data.onlineCount;
    offlineCount.value = data.offlineCount;
    lastUpdate.value = new Date();

    // Update markers
    const currentIds = new Set<string>();

    data.markers.forEach((markerData: any) => {
      currentIds.add(markerData.id);

      const position = { lat: markerData.lat, lng: markerData.lng };
      const userRole = markerData.user?.role || '';
      const userName = markerData.user?.name || '';

      if (markers.value.has(markerData.id)) {
        // Update existing marker
        const marker = markers.value.get(markerData.id)!;
        marker.setPosition(position);
        marker.setIcon(createMarkerIcon(markerData.isOnline, userRole, userName));
        (marker as any).userData = markerData;
      } else {
        // Create new marker
        const marker = new google.maps.Marker({
          position,
          map: map.value as google.maps.Map,
          icon: createMarkerIcon(markerData.isOnline, userRole, userName),
          title: markerData.user.name,
        });

        (marker as any).userData = markerData;

        marker.addListener('click', () => {
          const userData = (marker as any).userData;
          selectedUser.value = userData;
          const charType = getCharacterType(userData.user?.role || '', userData.user?.name || '');
          const config = characterConfig[charType];

          // Colors based on character type (using new Waze config)
          const accentColor = userData.isOnline ? config.color : '#6b7280';
          const statusBg = userData.isOnline
            ? `rgba(${parseInt(config.color.slice(1, 3), 16)}, ${parseInt(config.color.slice(3, 5), 16)}, ${parseInt(config.color.slice(5, 7), 16)}, 0.15)`
            : 'rgba(107, 114, 128, 0.15)';

          // Use PNG icon in popup instead of emoji
          const iconUrl = characterConfig[charType].icon;

          const content = `
            <div style="padding: 16px; min-width: 260px; background: #1a1a2e; border-radius: 12px; font-family: 'Inter', sans-serif; border: 2px solid ${accentColor}40;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 52px; height: 52px; border-radius: 12px; background: ${statusBg}; display: flex; align-items: center; justify-content: center; border: 2px solid ${accentColor}; overflow: hidden;">
                  <img src="${iconUrl}" style="width: 44px; height: 44px; object-fit: contain;" />
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 15px; color: #fff; margin-bottom: 4px;">
                    ${userData.user.name}
                  </div>
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: ${statusBg}; color: ${accentColor}; display: inline-block;">
                    ${config.label}
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${statusBg}; border-radius: 8px; margin-bottom: 12px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${accentColor}; ${userData.isOnline ? 'box-shadow: 0 0 10px ' + accentColor + ';' : ''}"></span>
                <span style="font-size: 13px; font-weight: 600; color: ${accentColor};">${userData.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                ${userData.isOnline ? '<span style="font-size: 11px; color: #8892b0; margin-left: auto;">em campo agora</span>' : ''}
              </div>

              ${userData.project ? `
                <div style="padding: 12px; background: rgba(201, 169, 98, 0.1); border-radius: 8px; border-left: 3px solid #c9a962;">
                  <div style="font-size: 10px; color: #8892b0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">📍 Projeto Atual</div>
                  <div style="font-weight: 600; color: #fff; font-size: 14px;">${userData.project.title}</div>
                  ${userData.project.cliente ? `<div style="font-size: 12px; color: #c9a962; margin-top: 4px;">👤 ${userData.project.cliente}</div>` : ''}
                </div>
              ` : `
                <div style="padding: 12px; background: rgba(136, 146, 176, 0.1); border-radius: 8px; text-align: center;">
                  <span style="font-size: 12px; color: #8892b0;">📭 Sem projeto atribuido</span>
                </div>
              `}

              <div style="font-size: 11px; color: #5a6578; margin-top: 12px; text-align: center; padding-top: 8px; border-top: 1px solid #2d2d44;">
                🕐 ${formatLastSeen(userData.lastSeen)}
              </div>
            </div>
          `;

          infoWindow.value?.setContent(content);
          infoWindow.value?.open(map.value as google.maps.Map, marker);
        });

        markers.value.set(markerData.id, marker);
      }
    });

    // Remove markers that no longer exist
    markers.value.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markers.value.delete(id);
      }
    });

    // Center map on markers if first load and has markers
    if (data.markers.length > 0 && data.center) {
      // Only center on first load
      if (markers.value.size === data.markers.length) {
        map.value?.setCenter(data.center);
      }
    }
  } catch (err: any) {
    console.error('Error loading locations:', err);
  }
};

const centerOnMarker = (userId: string) => {
  const marker = markers.value.get(userId);
  if (marker && map.value) {
    map.value.panTo(marker.getPosition()!);
    map.value.setZoom(15);
    google.maps.event.trigger(marker, 'click');
  }
};

const fitAllMarkers = () => {
  if (!map.value || markers.value.size === 0) return;

  const bounds = new google.maps.LatLngBounds();
  markers.value.forEach((marker) => {
    const pos = marker.getPosition();
    if (pos) {
      bounds.extend({ lat: pos.lat(), lng: pos.lng() });
    }
  });
  map.value.fitBounds(bounds);
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }

  // Unsubscribe from Socket.io events
  if (unsubscribeLocation) unsubscribeLocation();
  if (unsubscribeCheckin) unsubscribeCheckin();
  if (unsubscribeCheckout) unsubscribeCheckout();
  if (unsubscribeOutOfArea) unsubscribeOutOfArea();
  if (unsubscribeBackInArea) unsubscribeBackInArea();

  // Disconnect from Socket.io
  disconnectSocket();
});
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Aplicadores
        </router-link>
        <router-link to="/projects" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projetos
        </router-link>
        <router-link to="/contributions" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/campaigns" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/map" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" />
            <span v-else>{{ getInitials(authStore.user?.name) }}</span>
          </div>
          <span class="user-name">{{ authStore.user?.name }}</span>
        </div>
        <button @click="logout" class="logout-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </header>

    <main class="main">
      <div class="page-header">
        <div class="page-title">
          <h2>Mapa de Equipes</h2>
          <p class="page-subtitle">Acompanhe a localizacao dos aplicadores em tempo real</p>
        </div>
        <div class="header-actions">
          <div class="stats-badges">
            <div class="stat-badge" :class="isConnected ? 'realtime' : 'disconnected'">
              <span class="stat-dot"></span>
              <span>{{ isConnected ? 'Tempo real' : 'Reconectando...' }}</span>
            </div>
            <div class="stat-badge online">
              <span class="stat-dot"></span>
              <span>{{ onlineCount }} online</span>
            </div>
            <div class="stat-badge offline">
              <span class="stat-dot"></span>
              <span>{{ offlineCount }} offline</span>
            </div>
          </div>
          <button @click="fitAllMarkers" class="btn btn-secondary" :disabled="markers.size === 0">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Ver Todos
          </button>
          <button @click="loadLocations" class="btn btn-primary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <div class="map-container">
        <div v-if="loading" class="map-loading">
          <div class="loading-spinner"></div>
          <span>Carregando mapa...</span>
        </div>

        <div v-else-if="error" class="map-error">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ error }}</p>
          <p v-if="!GOOGLE_MAPS_API_KEY" class="error-hint">
            Adicione VITE_GOOGLE_MAPS_API_KEY no arquivo .env
          </p>
        </div>

        <div ref="mapContainer" class="map"></div>

        <div v-if="lastUpdate" class="last-update">
          Atualizado: {{ lastUpdate.toLocaleTimeString('pt-BR') }}
        </div>
      </div>

      <!-- Sidebar with applicator list - Waze style -->
      <div class="applicators-sidebar" v-if="markers.size > 0">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <svg class="header-icon" viewBox="0 0 32 36" width="24" height="28">
              <!-- Waze-style header icon -->
              <circle cx="10" cy="33" r="2.5" fill="#1a1a2e"/>
              <circle cx="22" cy="33" r="2.5" fill="#1a1a2e"/>
              <ellipse cx="16" cy="18" rx="13" ry="13" fill="#FFD93D" stroke="#1a1a2e" stroke-width="2"/>
              <ellipse cx="11" cy="17" rx="2.5" ry="3" fill="white"/>
              <ellipse cx="21" cy="17" rx="2.5" ry="3" fill="white"/>
              <circle cx="12" cy="17.5" r="1.2" fill="#1a1a2e"/>
              <circle cx="22" cy="17.5" r="1.2" fill="#1a1a2e"/>
              <path d="M 11 23 Q 16 26 21 23" fill="none" stroke="#1a1a2e" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M 6 7 L 9 4 L 11 6 L 16 2 L 21 6 L 23 4 L 26 7 L 24 9 L 8 9 Z" fill="#FFD700" stroke="#1a1a2e" stroke-width="1"/>
            </svg>
            <span>Equipe em Campo</span>
          </div>
          <div class="sidebar-count">{{ markers.size }}</div>
        </div>
        <div class="applicator-list">
          <div
            v-for="[id, marker] in markers"
            :key="id"
            class="applicator-item"
            :class="{
              online: (marker as any).userData?.isOnline,
              [getCharacterType((marker as any).userData?.user?.role || '', (marker as any).userData?.user?.name || '')]: true
            }"
            @click="centerOnMarker(id)"
          >
            <div class="character-avatar" :class="[{ online: (marker as any).userData?.isOnline, offline: !(marker as any).userData?.isOnline }, getCharacterType((marker as any).userData?.user?.role || '', (marker as any).userData?.user?.name || '')]">
              <!-- PNG avatar icon -->
              <img
                :src="characterConfig[getCharacterType((marker as any).userData?.user?.role || '', '')].icon"
                :alt="characterConfig[getCharacterType((marker as any).userData?.user?.role || '', '')].label"
                class="avatar-icon"
                :class="{ offline: !(marker as any).userData?.isOnline }"
              />
              <!-- Online indicator -->
              <span v-if="(marker as any).userData?.isOnline" class="online-indicator"></span>
            </div>
            <div class="applicator-info">
              <div class="applicator-name-row">
                <span class="applicator-name">{{ (marker as any).userData?.user?.name }}</span>
                <!-- Battery indicator -->
                <span
                  v-if="(marker as any).userData?.batteryLevel !== null && (marker as any).userData?.batteryLevel !== undefined"
                  class="battery-indicator"
                  :style="{ color: getBatteryColor((marker as any).userData?.batteryLevel) }"
                  :title="`Bateria: ${(marker as any).userData?.batteryLevel}%${(marker as any).userData?.isCharging ? ' (carregando)' : ''}`"
                >
                  {{ getBatteryIcon((marker as any).userData?.batteryLevel, (marker as any).userData?.isCharging) }}
                  {{ (marker as any).userData?.batteryLevel }}%
                </span>
              </div>
              <span class="applicator-role" :class="getCharacterType((marker as any).userData?.user?.role || '', (marker as any).userData?.user?.name || '')">
                {{ characterConfig[getCharacterType((marker as any).userData?.user?.role || '', '')].label }}
              </span>
              <div class="applicator-project-row">
                <span class="applicator-project">{{ (marker as any).userData?.project?.title || 'Sem projeto' }}</span>
                <!-- Out of area badge -->
                <span
                  v-if="(marker as any).userData?.isOutOfArea"
                  class="out-of-area-badge"
                  title="Fora do raio de 200m do projeto"
                >
                  FORA DA ÁREA
                </span>
              </div>
            </div>
            <div class="applicator-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo {
  height: 32px;
  width: auto;
}

.logo-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-link.router-link-active {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
  overflow: hidden;
}

.user-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  color: var(--text-secondary);
  font-size: 14px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.main {
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.stats-badges {
  display: flex;
  gap: 12px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--text-primary);
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stat-badge.online .stat-dot {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.stat-badge.offline .stat-dot {
  background: var(--accent-red);
}

.stat-badge.realtime .stat-dot {
  background: var(--accent-blue);
  box-shadow: 0 0 8px var(--accent-blue);
  animation: pulse-realtime 1.5s ease-in-out infinite;
}

.stat-badge.realtime {
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-badge.disconnected .stat-dot {
  background: var(--accent-orange);
}

.stat-badge.disconnected {
  border-color: rgba(249, 115, 22, 0.3);
}

@keyframes pulse-realtime {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.map-container {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  height: calc(100vh - 220px);
  min-height: 500px;
}

.map {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-card);
  color: var(--text-secondary);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--accent-red);
}

.error-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.last-update {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  font-size: 12px;
  color: var(--text-secondary);
  z-index: 5;
}

.applicators-sidebar {
  position: absolute;
  top: 100px;
  right: 48px;
  width: 280px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  z-index: 5;
}

.applicators-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.applicator-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.applicator-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.applicator-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.applicator-item.online {
  border-color: rgba(34, 197, 94, 0.3);
}

.applicator-status {
  flex-shrink: 0;
}

.status-dot {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-red);
}

.status-dot.online {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.applicator-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.applicator-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicator-project {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicator-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.applicator-project-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.battery-indicator {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.out-of-area-badge {
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
  background: #ef4444;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: pulse-badge 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Waze-style sidebar elements */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-icon {
  flex-shrink: 0;
}

.sidebar-count {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 28px;
  text-align: center;
}

/* Character avatars - PNG icons */
.character-avatar {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.avatar-icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease, filter 0.2s ease;
}

.avatar-icon.offline {
  filter: grayscale(100%) opacity(60%) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.applicator-item:hover .avatar-icon {
  transform: scale(1.1);
}

.character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));
}

.online-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 2px solid var(--bg-card);
  border-radius: 50%;
  animation: pulse-online 1.5s ease-in-out infinite;
}

@keyframes pulse-online {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
}

/* Character-specific glow effects */
.applicator-item.lider .character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.5));
}
.applicator-item.lider { border-color: rgba(255, 107, 53, 0.3); }
.applicator-item.lider.online:hover {
  border-color: rgba(255, 107, 53, 0.5);
  box-shadow: 0 0 12px rgba(255, 107, 53, 0.15);
}

.applicator-item.aplicador_1 .character-avatar.online .avatar-icon,
.applicator-item.aplicador_2 .character-avatar.online .avatar-icon,
.applicator-item.aplicador_3 .character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(155, 93, 229, 0.5));
}
.applicator-item.aplicador_1,
.applicator-item.aplicador_2,
.applicator-item.aplicador_3 { border-color: rgba(155, 93, 229, 0.3); }
.applicator-item.aplicador_1.online:hover,
.applicator-item.aplicador_2.online:hover,
.applicator-item.aplicador_3.online:hover {
  border-color: rgba(155, 93, 229, 0.5);
  box-shadow: 0 0 12px rgba(155, 93, 229, 0.15);
}

.applicator-item.lider_preparacao .character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}
.applicator-item.lider_preparacao { border-color: rgba(59, 130, 246, 0.3); }
.applicator-item.lider_preparacao.online:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}

.applicator-item.preparador .character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
}
.applicator-item.preparador { border-color: rgba(0, 212, 255, 0.3); }
.applicator-item.preparador.online:hover {
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
}

.applicator-item.auxiliar .character-avatar.online .avatar-icon {
  filter: drop-shadow(0 0 8px rgba(139, 115, 85, 0.5));
}
.applicator-item.auxiliar { border-color: rgba(139, 115, 85, 0.3); }
.applicator-item.auxiliar.online:hover {
  border-color: rgba(139, 115, 85, 0.5);
  box-shadow: 0 0 12px rgba(139, 115, 85, 0.15);
}

/* Role badge styles - Waze colors */
.applicator-role {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 2px;
}

.applicator-role.lider {
  background: rgba(255, 107, 53, 0.15);
  color: #FF6B35;
}

.applicator-role.aplicador_1,
.applicator-role.aplicador_2,
.applicator-role.aplicador_3 {
  background: rgba(155, 93, 229, 0.15);
  color: #9B5DE5;
}

.applicator-role.lider_preparacao {
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
}

.applicator-role.preparador {
  background: rgba(0, 212, 255, 0.15);
  color: #00D4FF;
}

.applicator-role.auxiliar {
  background: rgba(139, 115, 85, 0.15);
  color: #8B7355;
}

.online-pulse {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 42px;
  border-radius: 50%;
  pointer-events: none;
}

.online-pulse::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid var(--accent-green);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0;
  }
}

.applicator-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.applicator-arrow {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  opacity: 0;
  transition: all 0.2s ease;
}

.applicator-item:hover .applicator-arrow {
  opacity: 1;
  color: var(--accent-primary);
  transform: translateX(2px);
}

.applicator-arrow svg {
  width: 100%;
  height: 100%;
}

/* Enhanced applicator item styles */
.applicator-item.online:hover {
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.15);
}

/* Custom scrollbar for sidebar */
.applicators-sidebar::-webkit-scrollbar {
  width: 6px;
}

.applicators-sidebar::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.applicators-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.applicators-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
