<script setup lang="ts">
// @ts-nocheck - Disabling strict type checking for Google Maps API
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { locationsApi } from '../api';

// Mobile menu state
const mobileMenuOpen = ref(false);
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
const closeMobileMenu = () => { mobileMenuOpen.value = false; };
const handleResizeMobile = () => { if (window.innerWidth >= 768) mobileMenuOpen.value = false; };
// MarkerClusterer removed - using custom clustering logic instead
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

// =============================================
// TIMELINE MODE - Playback de localização
// =============================================
const timelineMode = ref(false);
const timelineLoading = ref(false);
const applicatorsList = ref<any[]>([]);
const selectedApplicator = ref<any>(null);
const timelineSearch = ref('');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const timelineData = ref<any>(null);
const timelineMarker = ref<google.maps.Marker | null>(null);
const timelinePath = ref<google.maps.Polyline | null>(null);

// Project markers for timeline mode
const projectsList = ref<any[]>([]);
const projectMarkers = ref<Map<string, google.maps.Marker>>(new Map());
const projectInfoWindow = ref<google.maps.InfoWindow | null>(null);

// Slider state
const sliderValue = ref(0);
const sliderMin = ref(0);
const sliderMax = ref(100);
const currentTime = ref<Date | null>(null);
const isPlaying = ref(false);
const playInterval = ref<number | null>(null);
const playbackSpeed = ref(1);

// Format time from milliseconds
const formatTime = (ms: number): string => {
  const date = new Date(ms);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Current time display
const currentTimeDisplay = computed(() => {
  if (!currentTime.value) return '--:--:--';
  return currentTime.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
});

// Load applicators list
const loadApplicatorsList = async () => {
  try {
    const response = await locationsApi.getApplicatorsList();
    applicatorsList.value = response.data.data.applicators;
  } catch (err) {
    console.error('Error loading applicators list:', err);
  }
};

// Filtered applicators list based on search
const filteredApplicatorsList = computed(() => {
  const search = timelineSearch.value.toLowerCase().trim();
  if (!search) return applicatorsList.value;
  return applicatorsList.value.filter((applicator) =>
    applicator.name.toLowerCase().includes(search)
  );
});

// Load projects with coordinates
const loadProjectsForMap = async () => {
  try {
    const response = await locationsApi.getProjectsForMap();
    projectsList.value = response.data.data.projects;
    createProjectMarkers();
  } catch (err) {
    console.error('Error loading projects for map:', err);
  }
};

// Create project markers on the map
const createProjectMarkers = () => {
  if (!map.value) return;

  // Initialize project info window if not exists
  if (!projectInfoWindow.value) {
    projectInfoWindow.value = new google.maps.InfoWindow();
  }

  // Clear existing project markers
  projectMarkers.value.forEach((marker) => marker.setMap(null));
  projectMarkers.value.clear();

  // Build set of users with active check-ins (to hide their individual markers)
  usersWithActiveCheckin.value.clear();
  projectsList.value.forEach((project: any) => {
    if (project.activeUsers) {
      project.activeUsers.forEach((u: any) => usersWithActiveCheckin.value.add(u.id));
    }
  });

  // Create markers for each project
  projectsList.value.forEach((project: any) => {
    if (!project.lat || !project.lng) return;

    // Green for active check-in, red for no check-in
    const hasActive = project.hasActiveCheckin;
    const userCount = project.activeUsers?.length || 0;
    const pinColor = hasActive ? '#22c55e' : '#ef4444';

    // Create custom icon with user count if there are active users
    let icon: google.maps.Symbol | google.maps.Icon;
    if (userCount > 0) {
      // Create a larger circle with the count
      icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 12 + Math.min(userCount * 2, 8), // Scale based on user count
      };
    } else {
      icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 10,
      };
    }

    // Check if projects should be visible based on current view mode
    const shouldShowProjects = mapViewMode.value === 'all' || mapViewMode.value === 'projects';

    const marker = new google.maps.Marker({
      position: { lat: project.lat, lng: project.lng },
      map: shouldShowProjects ? map.value as google.maps.Map : null,
      icon,
      label: userCount > 0 ? {
        text: String(userCount),
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
      } : undefined,
      title: project.title,
      zIndex: 500,
      visible: shouldShowProjects,
    });

    // Build info window content
    const statusColor = hasActive ? '#22c55e' : '#ef4444';
    const statusText = hasActive ? `${userCount} EM CAMPO` : 'SEM EQUIPE';
    const statusBg = hasActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    const activeUsersList = project.activeUsers?.length > 0
      ? project.activeUsers.map((u: any) => `<span style="background: rgba(34, 197, 94, 0.2); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #22c55e;">${u.name}</span>`).join(' ')
      : '';

    const content = `
      <div style="padding: 14px; min-width: 220px; background: #1a1a2e; border-radius: 10px; font-family: 'Inter', sans-serif; border: 2px solid ${statusColor}40;">
        <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 8px;">
          ${project.title}
        </div>

        <div style="display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; margin-bottom: 10px;">
          ${statusText}
        </div>

        ${activeUsersList ? `
          <div style="margin-bottom: 10px;">
            <div style="font-size: 10px; color: #8892b0; margin-bottom: 4px;">Em campo:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">${activeUsersList}</div>
          </div>
        ` : ''}

        ${project.cliente ? `
          <div style="font-size: 12px; color: #8892b0; margin-bottom: 4px;">
            <span style="color: #c9a962;">Cliente:</span> ${project.cliente}
          </div>
        ` : ''}

        ${project.endereco ? `
          <div style="font-size: 11px; color: #6b7280; line-height: 1.3;">
            ${project.endereco.substring(0, 60)}${project.endereco.length > 60 ? '...' : ''}
          </div>
        ` : ''}
      </div>
    `;

    // Show info window on hover (mouseover)
    marker.addListener('mouseover', () => {
      // Close any open info windows first
      infoWindow.value?.close();
      clusterInfoWindow.value?.close();
      projectInfoWindow.value?.setContent(content);
      projectInfoWindow.value?.open(map.value as google.maps.Map, marker);
    });

    // Hide info window on mouseout
    marker.addListener('mouseout', () => {
      projectInfoWindow.value?.close();
    });

    projectMarkers.value.set(project.id, marker);
  });

  // Apply visibility based on current mapViewMode
  const showProjects = mapViewMode.value === 'all' || mapViewMode.value === 'projects';
  projectMarkers.value.forEach((marker) => {
    marker.setVisible(showProjects);
    if (!showProjects) marker.setMap(null);
  });

  // After updating projects, rebuild clusterer with correct visible markers
  // (excludes users with active check-ins who are now shown in project markers)
  setupMarkerClusterer();
};

// Clear project markers
const clearProjectMarkers = () => {
  projectMarkers.value.forEach((marker) => marker.setMap(null));
  projectMarkers.value.clear();
  projectInfoWindow.value?.close();
};

// Load timeline data
const loadTimelineData = async () => {
  if (!selectedApplicator.value) return;
  timelineLoading.value = true;
  try {
    const response = await locationsApi.getTimeline(selectedApplicator.value.id, selectedDate.value);
    timelineData.value = response.data.data;

    // Use actual point timestamps as bounds (not the full day)
    if (timelineData.value.points && timelineData.value.points.length > 0) {
      const firstPoint = timelineData.value.points[0];
      const lastPoint = timelineData.value.points[timelineData.value.points.length - 1];
      sliderMin.value = firstPoint.timestampMs;
      sliderMax.value = lastPoint.timestampMs;
      sliderValue.value = firstPoint.timestampMs;
      currentTime.value = new Date(sliderMin.value);

      // Draw path and center map
      drawTimelinePath();
      map.value?.setCenter({ lat: firstPoint.lat, lng: firstPoint.lng });
      map.value?.setZoom(15);

      // Show initial marker
      updateTimelineMarker();
    } else if (timelineData.value.bounds) {
      // Fallback to day bounds if no points
      sliderMin.value = timelineData.value.bounds.startMs;
      sliderMax.value = timelineData.value.bounds.endMs;
      sliderValue.value = timelineData.value.bounds.startMs;
      currentTime.value = new Date(sliderMin.value);
    }
  } catch (err) {
    console.error('Error loading timeline:', err);
  } finally {
    timelineLoading.value = false;
  }
};

// Draw path on map
const drawTimelinePath = () => {
  if (timelinePath.value) timelinePath.value.setMap(null);
  if (!timelineData.value?.points?.length || !map.value) return;
  const pathCoords = timelineData.value.points.map((p: any) => ({ lat: p.lat, lng: p.lng }));
  timelinePath.value = new google.maps.Polyline({
    path: pathCoords,
    geodesic: true,
    strokeColor: '#c9a962',
    strokeOpacity: 0.7,
    strokeWeight: 3,
    map: map.value,
  });
};

// Interpolate position
const interpolatePosition = (timestamp: number): { lat: number; lng: number } | null => {
  if (!timelineData.value?.points?.length) return null;
  const points = timelineData.value.points;
  let before = null;
  let after = null;
  for (let i = 0; i < points.length; i++) {
    if (points[i].timestampMs <= timestamp) before = points[i];
    if (points[i].timestampMs >= timestamp && !after) { after = points[i]; break; }
  }
  if (!before && after) return { lat: after.lat, lng: after.lng };
  if (before && !after) return { lat: before.lat, lng: before.lng };
  if (!before && !after) return null;
  if (before.timestampMs === after.timestampMs) return { lat: before.lat, lng: before.lng };
  const ratio = (timestamp - before.timestampMs) / (after.timestampMs - before.timestampMs);
  return { lat: before.lat + (after.lat - before.lat) * ratio, lng: before.lng + (after.lng - before.lng) * ratio };
};

// Create circular photo marker icon using canvas
const createPhotoMarkerIcon = async (photoUrl: string | null): Promise<google.maps.Icon | google.maps.Symbol> => {
  if (!photoUrl) {
    // Fallback to circle marker
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 14,
      fillColor: '#c9a962',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    };
  }

  try {
    const fullUrl = getPhotoUrl(photoUrl);
    if (!fullUrl) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#c9a962',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      };
    }

    // Create canvas for circular photo
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        // Draw white border/background
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Create circular clipping path (slightly smaller for border effect)
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 3, 0, Math.PI * 2);
        ctx.clip();

        // Draw image
        ctx.drawImage(img, 3, 3, size - 6, size - 6);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          url: dataUrl,
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(size / 2, size / 2),
        });
      };

      img.onerror = () => {
        // Fallback on error
        resolve({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#c9a962',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        });
      };

      img.src = fullUrl;
    });
  } catch (err) {
    console.error('Error creating photo marker:', err);
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 14,
      fillColor: '#c9a962',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    };
  }
};

// Update timeline marker
const updateTimelineMarker = async () => {
  if (!map.value) return;
  const position = interpolatePosition(sliderValue.value);
  if (!position) return;
  currentTime.value = new Date(sliderValue.value);

  // Get user photo from timeline data
  const userPhoto = timelineData.value?.user?.photoUrl || selectedApplicator.value?.photoUrl;

  if (!timelineMarker.value) {
    // Create marker with photo icon
    const icon = await createPhotoMarkerIcon(userPhoto);
    timelineMarker.value = new google.maps.Marker({
      position,
      map: map.value,
      icon: icon as any,
      zIndex: 1000,
    });
  } else {
    timelineMarker.value.setPosition(position);
  }
};

// Playback controls
const togglePlayback = () => { isPlaying.value ? stopPlayback() : startPlayback(); };
const startPlayback = () => {
  if (!timelineData.value?.points?.length) return;
  isPlaying.value = true;
  const stepMs = 60000 * playbackSpeed.value;
  playInterval.value = window.setInterval(() => {
    sliderValue.value += stepMs;
    if (sliderValue.value >= sliderMax.value) { sliderValue.value = sliderMax.value; stopPlayback(); }
    updateTimelineMarker();
  }, 100);
};
const stopPlayback = () => { isPlaying.value = false; if (playInterval.value) { clearInterval(playInterval.value); playInterval.value = null; } };
const cyclePlaybackSpeed = () => { const speeds = [1, 2, 4, 8]; playbackSpeed.value = speeds[(speeds.indexOf(playbackSpeed.value) + 1) % speeds.length]; };

// Toggle timeline mode
const toggleTimelineMode = async () => {
  timelineMode.value = !timelineMode.value;
  if (timelineMode.value) {
    await loadApplicatorsList();
    // Hide all markers and clear custom clusters when entering timeline mode
    clusterMarkers.value.forEach((m) => m.setMap(null));
    clusterMarkers.value = [];
    markers.value.forEach((marker) => {
      marker.setMap(null);
      marker.setVisible(false);
    });
  } else {
    stopPlayback();
    selectedApplicator.value = null;
    timelineData.value = null;
    if (timelineMarker.value) { timelineMarker.value.setMap(null); timelineMarker.value = null; }
    if (timelinePath.value) { timelinePath.value.setMap(null); timelinePath.value = null; }
    // Restore markers visibility and clustering
    setupMarkerClusterer();
  }
};

// Select applicator
const selectApplicatorForTimeline = async (applicator: any) => {
  selectedApplicator.value = applicator;
  stopPlayback();
  await loadTimelineData();
};

watch(selectedDate, () => { if (selectedApplicator.value) loadTimelineData(); });

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
// markerClusterer removed - using custom clustering instead
const usersWithActiveCheckin = ref<Set<string>>(new Set());
const clusterInfoWindow = ref<google.maps.InfoWindow | null>(null);
const infoWindow = ref<google.maps.InfoWindow | null>(null);
const loading = ref(true);
const error = ref('');
const lastUpdate = ref<Date | null>(null);
const isFirstLoad = ref(true); // Controls initial map centering - prevents recentering on updates
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

// Stats - 3 states: emCampo (green), online (yellow), offline (red)
const emCampoCount = ref(0);
const onlineCount = ref(0);
const offlineCount = ref(0);
const selectedUser = ref<any>(null);

// Search and filter
const searchQuery = ref('');
const statusFilter = ref<'all' | 'emCampo' | 'online' | 'offline'>('all');
const mapViewMode = ref<'all' | 'applicators' | 'projects'>('all');

// Sidebar view toggle: 'equipe' or 'projetos'
const sidebarView = ref<'equipe' | 'projetos'>('equipe');

// Sidebar collapsed state (default: open)
const sidebarCollapsed = ref(false);

// Normalize string: remove accents and convert to lowercase
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Filtered projects list for sidebar
const filteredProjects = computed(() => {
  const query = normalizeString(searchQuery.value.trim());

  return projectsList.value.filter((project: any) => {
    const title = normalizeString(project.title || '');
    const cliente = normalizeString(project.cliente || '');
    const endereco = normalizeString(project.endereco || '');

    return !query ||
      title.includes(query) ||
      cliente.includes(query) ||
      endereco.includes(query);
  });
});

// Filtered markers list for sidebar
const filteredMarkers = computed(() => {
  const query = normalizeString(searchQuery.value.trim());
  const result: [string, google.maps.Marker][] = [];

  markers.value.forEach((marker, id) => {
    const userData = (marker as any).userData;
    if (!userData) return;

    const userName = normalizeString(userData.user?.name || '');
    const projectName = normalizeString(userData.project?.title || '');
    const roleName = normalizeString(userData.user?.role || '');

    // Check search match
    const matchesSearch = !query ||
      userName.includes(query) ||
      projectName.includes(query) ||
      roleName.includes(query);

    // Check status match
    let matchesStatus = true;
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === 'emCampo') {
        matchesStatus = userData.hasActiveCheckin === true;
      } else if (statusFilter.value === 'online') {
        matchesStatus = userData.isOnline && !userData.hasActiveCheckin;
      } else if (statusFilter.value === 'offline') {
        matchesStatus = !userData.isOnline && !userData.hasActiveCheckin;
      }
    }

    if (matchesSearch && matchesStatus) {
      result.push([id, marker]);
    }
  });

  return result;
});

// Toggle status filter
const toggleStatusFilter = (status: 'emCampo' | 'online' | 'offline') => {
  if (statusFilter.value === status) {
    statusFilter.value = 'all';
  } else {
    statusFilter.value = status;
  }
  applyFilters();
};

// Apply filters to map markers
const applyFilters = () => {
  const query = normalizeString(searchQuery.value.trim());

  // Apply to applicator markers on map
  markers.value.forEach((marker, id) => {
    const userData = (marker as any).userData;
    if (!userData) return;

    const userName = normalizeString(userData.user?.name || '');
    const projectName = normalizeString(userData.project?.title || '');

    // Check search match
    const matchesSearch = !query || userName.includes(query) || projectName.includes(query);

    // Check status match
    let matchesStatus = true;
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === 'emCampo') {
        matchesStatus = userData.hasActiveCheckin === true;
      } else if (statusFilter.value === 'online') {
        matchesStatus = userData.isOnline && !userData.hasActiveCheckin;
      } else if (statusFilter.value === 'offline') {
        matchesStatus = !userData.isOnline && !userData.hasActiveCheckin;
      }
    }

    // Check view mode
    const showApplicators = mapViewMode.value === 'all' || mapViewMode.value === 'applicators';

    const shouldShow = matchesSearch && matchesStatus && showApplicators;
    marker.setVisible(shouldShow);
    marker.setMap(shouldShow ? map.value : null);
  });

  // Apply to project markers
  const showProjects = mapViewMode.value === 'all' || mapViewMode.value === 'projects';
  projectMarkers.value.forEach((marker) => {
    marker.setVisible(showProjects);
    marker.setMap(showProjects ? map.value : null);
  });

  // Re-run clustering
  setupMarkerClusterer();
};

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
    await loadProjectsForMap();

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
    refreshInterval.value = window.setInterval(async () => {
      await loadLocations();
      await loadProjectsForMap();
      // Re-apply filters to respect current view mode after refresh
      applyFilters();
    }, 60000);
  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar mapa';
    console.error('Map init error:', err);
  } finally {
    loading.value = false;
  }
};

// Character types based on roles in the project
type CharacterType = 'lider' | 'aplicador_1' | 'aplicador_2' | 'aplicador_3' | 'lider_preparacao' | 'preparador' | 'auxiliar';

// Base URL for assets (handles /admin/ prefix in production)
const BASE_URL = import.meta.env.BASE_URL || '/';

// Character config with PNG icons, labels, and original dimensions for proper aspect ratio
const characterConfig: Record<CharacterType, { label: string; icon: string; color: string; width: number; height: number }> = {
  lider: { label: 'Líder', icon: `${BASE_URL}icons/lider.png`, color: '#FF6B35', width: 359, height: 289 },
  aplicador_1: { label: 'Aplicador 1', icon: `${BASE_URL}icons/aplicador-1.png`, color: '#9B5DE5', width: 250, height: 223 },
  aplicador_2: { label: 'Aplicador 2', icon: `${BASE_URL}icons/aplicador-2.png`, color: '#9B5DE5', width: 317, height: 212 },
  aplicador_3: { label: 'Aplicador 3', icon: `${BASE_URL}icons/aplicador-3.png`, color: '#9B5DE5', width: 411, height: 259 },
  lider_preparacao: { label: 'Líder Prep', icon: `${BASE_URL}icons/lider-preparacao.png`, color: '#3B82F6', width: 314, height: 262 },
  preparador: { label: 'Preparador', icon: `${BASE_URL}icons/preparador.png`, color: '#00D4FF', width: 281, height: 216 },
  auxiliar: { label: 'Ajudante', icon: `${BASE_URL}icons/ajudante.png`, color: '#8B7355', width: 187, height: 228 },
};

// Get character type based on role
const getCharacterType = (role: string, _name: string): CharacterType => {
  switch (role) {
    case 'LIDER':
      return 'lider';
    case 'APLICADOR_III':
      return 'aplicador_3';
    case 'APLICADOR_II':
      return 'aplicador_2';
    case 'APLICADOR_I':
      return 'aplicador_1';
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
  // Target height: 36px (smaller for individual markers)
  const targetHeight = 36;
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

    emCampoCount.value = data.emCampoCount || 0;
    onlineCount.value = data.onlineCount || 0;
    offlineCount.value = data.offlineCount || 0;
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
        // Create new marker - starts HIDDEN, clustering will decide visibility
        const marker = new google.maps.Marker({
          position,
          icon: createMarkerIcon(markerData.isOnline, userRole, userName),
          title: markerData.user.name,
          visible: false, // Start hidden - setupMarkerClusterer will show if needed
        });

        (marker as any).userData = markerData;

        marker.addListener('click', () => {
          const userData = (marker as any).userData;
          selectedUser.value = userData;
          const charType = getCharacterType(userData.user?.role || '', userData.user?.name || '');
          const config = characterConfig[charType];

          // 3-state status: Em Campo (green), Online (yellow), Offline (red)
          let statusColor = '#ef4444'; // red - offline
          let statusText = 'OFFLINE';
          let statusSubtext = '';

          if (userData.hasActiveCheckin) {
            statusColor = '#22c55e'; // green - em campo
            statusText = 'EM CAMPO';
            statusSubtext = 'trabalhando agora';
          } else if (userData.isOnline) {
            statusColor = '#eab308'; // yellow - online
            statusText = 'ONLINE';
            statusSubtext = 'sem check-in';
          }

          const statusBg = `${statusColor}20`;

          // Use PNG icon in popup instead of emoji
          const iconUrl = characterConfig[charType].icon;

          const content = `
            <div style="padding: 16px; min-width: 260px; background: #1a1a2e; border-radius: 12px; font-family: 'Inter', sans-serif; border: 2px solid ${statusColor}40;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 52px; height: 52px; border-radius: 12px; background: ${config.color}20; display: flex; align-items: center; justify-content: center; border: 2px solid ${config.color}; overflow: hidden;">
                  <img src="${iconUrl}" style="width: 44px; height: 44px; object-fit: contain;" />
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 15px; color: #fff; margin-bottom: 4px;">
                    ${userData.user.name}
                  </div>
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: ${config.color}20; color: ${config.color}; display: inline-block;">
                    ${config.label}
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${statusBg}; border-radius: 8px; margin-bottom: 12px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 10px ${statusColor};"></span>
                <span style="font-size: 13px; font-weight: 600; color: ${statusColor};">${statusText}</span>
                ${statusSubtext ? `<span style="font-size: 11px; color: #8892b0; margin-left: auto;">${statusSubtext}</span>` : ''}
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

          // Close any open info windows first
          clusterInfoWindow.value?.close();
          projectInfoWindow.value?.close();
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

    // Set up or update marker clustering
    // The clusterer will only show markers not in usersWithActiveCheckin
    setupMarkerClusterer();

    // Center map ONLY on first load - keep view fixed on subsequent updates
    if (isFirstLoad.value && data.markers.length > 0 && data.center) {
      map.value?.setCenter(data.center);
      isFirstLoad.value = false; // Never recenter automatically after first load
    }
  } catch (err: any) {
    console.error('Error loading locations:', err);
  }
};

// Update visibility of applicator markers based on check-in status
const updateApplicatorMarkerVisibility = () => {
  markers.value.forEach((marker, userId) => {
    const hasActiveCheckin = usersWithActiveCheckin.value.has(userId);
    // Hide marker if user has active check-in (they're shown in project marker)
    marker.setVisible(!hasActiveCheckin && !timelineMode.value);
  });
};

// Custom cluster markers (we manage these ourselves)
const clusterMarkers = ref<google.maps.Marker[]>([]);

// Calculate distance between two points in meters
const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Set up marker clustering for visible applicator markers
const setupMarkerClusterer = () => {
  if (!map.value) return;

  console.log('🔄 setupMarkerClusterer START. Clusters to clear:', clusterMarkers.value.length);

  // Clear custom cluster markers - AGGRESSIVELY remove from map
  while (clusterMarkers.value.length > 0) {
    const m = clusterMarkers.value.pop()!;
    console.log(`   Removing cluster from map (remaining: ${clusterMarkers.value.length})`);
    // Remove all event listeners first
    google.maps.event.clearInstanceListeners(m);
    // Hide it
    m.setVisible(false);
    // Remove from map
    m.setMap(null);
  }

  // Remove ALL markers from the map first and ensure they're invisible
  markers.value.forEach((marker) => {
    marker.setMap(null);
    marker.setVisible(false);
  });
  console.log('🔍 setupMarkerClusterer: All markers removed from map');

  // Initialize cluster info window if not exists
  if (!clusterInfoWindow.value) {
    clusterInfoWindow.value = new google.maps.InfoWindow();
  }

  // Skip clustering in timeline mode or when viewing only projects
  if (timelineMode.value) return;

  // If mapViewMode is 'projects', don't show any applicator markers
  if (mapViewMode.value === 'projects') {
    console.log('🔍 View mode is "projects" - hiding all applicator markers');
    return;
  }

  // Get only FILTERED markers for clustering (respects search and status filters)
  const query = normalizeString(searchQuery.value.trim());
  const allMarkers: google.maps.Marker[] = [];

  markers.value.forEach((marker) => {
    const userData = (marker as any).userData;
    if (!userData) return;

    const userName = normalizeString(userData.user?.name || '');
    const projectName = normalizeString(userData.project?.title || '');

    // Check search match
    const matchesSearch = !query || userName.includes(query) || projectName.includes(query);

    // Check status match
    let matchesStatus = true;
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === 'emCampo') {
        matchesStatus = userData.hasActiveCheckin === true;
      } else if (statusFilter.value === 'online') {
        matchesStatus = userData.isOnline && !userData.hasActiveCheckin;
      } else if (statusFilter.value === 'offline') {
        matchesStatus = !userData.isOnline && !userData.hasActiveCheckin;
      }
    }

    if (matchesSearch && matchesStatus) {
      allMarkers.push(marker);
    }
  });

  if (allMarkers.length === 0) {
    console.log('🔍 No markers match the current filters');
    return;
  }

  // Manual clustering based on distance (200 meters)
  const CLUSTER_RADIUS = 200; // meters
  const clustered: Set<google.maps.Marker> = new Set();
  const clusters: google.maps.Marker[][] = [];

  // Group markers into clusters based on distance
  for (const marker of allMarkers) {
    if (clustered.has(marker)) continue;

    const pos = marker.getPosition();
    if (!pos) continue;

    // Find all markers within CLUSTER_RADIUS of this marker
    const cluster: google.maps.Marker[] = [marker];
    clustered.add(marker);

    for (const other of allMarkers) {
      if (clustered.has(other)) continue;
      const otherPos = other.getPosition();
      if (!otherPos) continue;

      const distance = getDistanceInMeters(pos.lat(), pos.lng(), otherPos.lat(), otherPos.lng());
      if (distance <= CLUSTER_RADIUS) {
        cluster.push(other);
        clustered.add(other);
      }
    }

    clusters.push(cluster);
  }

  // Debug: log clustering results
  console.log('🔍 Clustering Debug:');
  console.log(`   Total markers: ${markers.value.size}`);
  console.log(`   Users with active check-in: ${usersWithActiveCheckin.value.size}`);
  console.log(`   Clusters formed: ${clusters.length}`);

  // Log positions for debugging distance issues
  allMarkers.forEach((m, idx) => {
    const pos = m.getPosition();
    const name = (m as any).userData?.user?.name || 'Unknown';
    console.log(`   📍 Marker ${idx + 1}: ${name} at (${pos?.lat().toFixed(6)}, ${pos?.lng().toFixed(6)})`);
  });

  // Log distances between first few markers to verify clustering
  if (allMarkers.length >= 2) {
    for (let i = 0; i < Math.min(3, allMarkers.length); i++) {
      for (let j = i + 1; j < Math.min(4, allMarkers.length); j++) {
        const pos1 = allMarkers[i].getPosition();
        const pos2 = allMarkers[j].getPosition();
        if (pos1 && pos2) {
          const dist = getDistanceInMeters(pos1.lat(), pos1.lng(), pos2.lat(), pos2.lng());
          const name1 = (allMarkers[i] as any).userData?.user?.name || 'Unknown';
          const name2 = (allMarkers[j] as any).userData?.user?.name || 'Unknown';
          console.log(`   📏 Distance ${name1} ↔ ${name2}: ${dist.toFixed(0)}m ${dist <= 200 ? '✅ WITHIN CLUSTER RANGE' : ''}`);
        }
      }
    }
  }

  clusters.forEach((c, i) => {
    const names = c.map(m => (m as any).userData?.user?.name || 'Unknown').join(', ');
    console.log(`   Cluster ${i + 1}: ${c.length} members [${names}]`);
  });

  // Now render clusters and individual markers
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      // Single marker - only show if they DON'T have an active check-in
      // (people with check-ins are shown in project pins)
      const userData = (cluster[0] as any).userData;
      const name = userData?.user?.name || 'Unknown';
      const odataId = userData?.id;

      // Find the userId from the markers Map
      let userId: string | undefined;
      markers.value.forEach((m, id) => {
        if (m === cluster[0]) userId = id;
      });

      if (userId && usersWithActiveCheckin.value.has(userId)) {
        console.log(`   ⏭️ Skipping individual (has check-in): ${name}`);
        cluster[0].setMap(null);
        cluster[0].setVisible(false);
      } else {
        console.log(`   ✅ Showing individual: ${name}`);
        cluster[0].setVisible(true);
        cluster[0].setMap(map.value);
      }
    } else {
      // Multiple markers - create cluster icon, hide individuals
      cluster.forEach((m) => {
        m.setMap(null);
        m.setVisible(false);
      });
      console.log(`   🔵 Creating cluster with ${cluster.length} members`);

      const centerLat = cluster.reduce((sum, m) => sum + (m.getPosition()?.lat() || 0), 0) / cluster.length;
      const centerLng = cluster.reduce((sum, m) => sum + (m.getPosition()?.lng() || 0), 0) / cluster.length;

      const size = 56 + Math.min(cluster.length * 2, 20);
      const clusterMarker = new google.maps.Marker({
        position: { lat: centerLat, lng: centerLng },
        map: map.value,
        icon: {
          url: '/grupo.png',
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(size / 2, size / 2),
        },
        label: {
          text: String(cluster.length),
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        zIndex: 1000,
      });

      // Store cluster data
      (clusterMarker as any).clusterMembers = cluster;

      // Add click handler
      clusterMarker.addListener('click', () => {
        const members = (clusterMarker as any).clusterMembers as google.maps.Marker[];
        if (!members || members.length === 0) return;

        const peopleList = members.map((m: google.maps.Marker) => {
          const userData = (m as any).userData;
          if (!userData) return null;
          const charType = getCharacterType(userData.user?.role || '', '');
          const config = characterConfig[charType];
          return {
            name: userData.user?.name || 'Desconhecido',
            role: config.label,
            roleColor: config.color,
            icon: config.icon,
            isOnline: userData.isOnline,
            project: userData.project?.title || 'Sem projeto',
          };
        }).filter(Boolean);

        const content = `
          <div style="padding: 16px; min-width: 280px; max-width: 320px; background: #1a1a2e; border-radius: 12px; font-family: 'Inter', sans-serif; border: 2px solid rgba(201, 169, 98, 0.4);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <img src="/grupo.png" style="width: 36px; height: 36px; object-fit: contain;" />
              <div>
                <div style="font-weight: 600; font-size: 15px; color: #fff;">Equipe Agrupada</div>
                <div style="font-size: 12px; color: #c9a962;">${peopleList.length} aplicadores</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto;">
              ${peopleList.map((p: any) => `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                  <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                    <img src="${p.icon}" style="width: 100%; height: 100%; object-fit: contain;" />
                    ${p.isOnline ? '<span style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #22c55e; border: 2px solid #1a1a2e; border-radius: 50%;"></span>' : ''}
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                      <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${p.roleColor}20; color: ${p.roleColor};">${p.role}</span>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.project}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        // Close any open info windows first
        infoWindow.value?.close();
        projectInfoWindow.value?.close();
        clusterInfoWindow.value?.setContent(content);
        clusterInfoWindow.value?.setPosition({ lat: centerLat, lng: centerLng });
        clusterInfoWindow.value?.open(map.value as google.maps.Map);
      });

      clusterMarkers.value.push(clusterMarker);

      // Log cluster creation
      const memberNames = cluster.map(m => (m as any).userData?.user?.name || 'Unknown').join(', ');
      console.log(`   🔵 Created cluster with ${cluster.length} members [${memberNames}]`);

      // Individual markers in cluster stay hidden (we already set them to null above)
    }
  }

  // FINAL SAFETY: Force hide ALL markers that are in multi-member clusters
  // This is a safeguard in case something went wrong above
  const markersInClusters = new Set<google.maps.Marker>();
  clusters.forEach((cluster) => {
    if (cluster.length > 1) {
      cluster.forEach((m) => markersInClusters.add(m));
    }
  });

  // Force hide all markers in clusters one more time
  markersInClusters.forEach((m) => {
    m.setMap(null);
    m.setVisible(false);
  });

  console.log(`🔍 Final safety: Force-hid ${markersInClusters.size} markers in clusters`);

  // Final verification
  const markersOnMap = Array.from(markers.value.values())
    .filter(m => m.getMap() !== null)
    .map(m => (m as any).userData?.user?.name);
  const markersVisible = Array.from(markers.value.values())
    .filter(m => m.getVisible())
    .map(m => (m as any).userData?.user?.name);

  console.log('🔍 ========== END CLUSTERING SUMMARY ==========');
  console.log(`   🔵 Cluster icons created: ${clusterMarkers.value.length}`);
  console.log(`   👤 Individual markers visible: ${markersVisible.length} [${markersVisible.join(', ')}]`);
  console.log(`   📍 Total applicators: ${markers.value.size}`);
  console.log(`   ✅ Users with check-in (shown in projects): ${usersWithActiveCheckin.value.size}`);
  console.log('================================================');

  // Verify after a short delay (to catch any async issues)
  setTimeout(() => {
    const afterMarkers = Array.from(markers.value.values())
      .filter(m => m.getMap() !== null)
      .map(m => (m as any).userData?.user?.name);
    const afterVisible = Array.from(markers.value.values())
      .filter(m => m.getVisible())
      .map(m => (m as any).userData?.user?.name);

    if (afterMarkers.length > 0 || afterVisible.length > 0) {
      console.warn('⚠️ PROBLEM: Markers appeared after clustering!');
      console.warn('   Map set:', afterMarkers);
      console.warn('   Visible:', afterVisible);

      // Force hide them again!
      markersInClusters.forEach((m) => {
        m.setMap(null);
        m.setVisible(false);
      });
    }
  }, 500);
};

const centerOnMarker = (userId: string) => {
  const marker = markers.value.get(userId);
  if (marker && map.value) {
    map.value.panTo(marker.getPosition()!);
    map.value.setZoom(15);
    google.maps.event.trigger(marker, 'click');
  }
};

const centerOnProject = (project: any) => {
  if (!map.value || !project.lat || !project.lng) return;

  // Pan to project location
  map.value.panTo({ lat: project.lat, lng: project.lng });
  map.value.setZoom(16);

  // Find and trigger click on the project marker
  const projectMarker = projectMarkers.value.get(project.id);
  if (projectMarker) {
    google.maps.event.trigger(projectMarker, 'mouseover');
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
  window.addEventListener('resize', handleResizeMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResizeMobile);
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }

  // Clear custom cluster markers
  clusterMarkers.value.forEach((m) => m.setMap(null));
  clusterMarkers.value = [];

  // Close cluster info window
  if (clusterInfoWindow.value) {
    clusterInfoWindow.value.close();
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
    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    <!-- Mobile Sidebar -->
    <aside class="mobile-sidebar" :class="{ open: mobileMenuOpen }">
      <div class="mobile-sidebar-header">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <button class="close-menu-btn" @click="closeMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <nav class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>Dashboard</router-link>
        <router-link to="/applicators" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Aplicadores</router-link>
        <router-link to="/projects" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Projetos</router-link>
        <router-link to="/reports" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Relatorios</router-link>
        <router-link to="/requests" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Solicitacoes</router-link>
        <router-link to="/campaigns" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Campanhas</router-link>
        <router-link to="/academy" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>Academia</router-link>
        <router-link to="/map" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>Mapa</router-link>
      </nav>
      <div class="mobile-sidebar-footer">
        <div class="mobile-user-info"><div class="user-avatar"><img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" /><span v-else>{{ getInitials(authStore.user?.name) }}</span></div><span class="user-name">{{ authStore.user?.name }}</span></div>
        <button @click="logout" class="mobile-logout-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sair</button>
      </div>
    </aside>

    <header class="header">
      <div class="header-left">
        <button class="hamburger-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav desktop-nav">
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
        <router-link to="/reports" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Relatorios
        </router-link>
        <router-link to="/requests" class="nav-link">
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
        <router-link to="/academy" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Academia
        </router-link>
        <router-link to="/map" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
        <router-link to="/scheduling" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Agenda
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
            <div
              class="stat-badge em-campo clickable"
              :class="{ active: statusFilter === 'emCampo' }"
              @click="toggleStatusFilter('emCampo')"
              title="Clique para filtrar"
            >
              <span class="stat-dot"></span>
              <span>{{ emCampoCount }} em campo</span>
            </div>
            <div
              class="stat-badge online clickable"
              :class="{ active: statusFilter === 'online' }"
              @click="toggleStatusFilter('online')"
              title="Clique para filtrar"
            >
              <span class="stat-dot"></span>
              <span>{{ onlineCount }} online</span>
            </div>
            <div
              class="stat-badge offline clickable"
              :class="{ active: statusFilter === 'offline' }"
              @click="toggleStatusFilter('offline')"
              title="Clique para filtrar"
            >
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
          <button @click="toggleTimelineMode" class="btn" :class="timelineMode ? 'btn-primary' : 'btn-secondary'">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ timelineMode ? 'Sair Timeline' : 'Timeline' }}
          </button>
          <button @click="loadLocations" class="btn btn-primary" v-if="!timelineMode">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <div class="map-container">
        <!-- Map view toggle -->
        <div class="map-view-toggle" v-if="!loading && !error">
          <button
            class="toggle-btn"
            :class="{ active: mapViewMode === 'all' }"
            @click="mapViewMode = 'all'; applyFilters()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <circle cx="15.5" cy="8.5" r="1.5"/>
              <circle cx="8.5" cy="15.5" r="1.5"/>
              <circle cx="15.5" cy="15.5" r="1.5"/>
            </svg>
            Todos
          </button>
          <button
            class="toggle-btn"
            :class="{ active: mapViewMode === 'applicators' }"
            @click="mapViewMode = 'applicators'; applyFilters()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Aplicadores
          </button>
          <button
            class="toggle-btn"
            :class="{ active: mapViewMode === 'projects' }"
            @click="mapViewMode = 'projects'; applyFilters()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Projetos
          </button>
        </div>

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

      <!-- Timeline Sidebar - when in timeline mode -->
      <div class="timeline-sidebar" v-if="timelineMode">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Timeline</span>
          </div>
        </div>

        <!-- Date picker -->
        <div class="timeline-date-picker">
          <label>Data</label>
          <input type="date" v-model="selectedDate" class="date-input" />
        </div>

        <!-- Applicator selection list -->
        <div class="timeline-applicator-list">
          <div class="list-header">Selecione um aplicador</div>

          <!-- Search input -->
          <div class="timeline-search-container">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              v-model="timelineSearch"
              placeholder="Buscar aplicador..."
              class="timeline-search-input"
            />
            <button
              v-if="timelineSearch"
              class="clear-search-btn"
              @click="timelineSearch = ''"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div v-if="filteredApplicatorsList.length === 0" class="empty-list">
            {{ timelineSearch ? 'Nenhum resultado encontrado' : 'Nenhum aplicador encontrado' }}
          </div>
          <div
            v-for="applicator in filteredApplicatorsList"
            :key="applicator.id"
            class="timeline-applicator-item"
            :class="{ selected: selectedApplicator?.id === applicator.id, online: applicator.isOnline }"
            @click="selectApplicatorForTimeline(applicator)"
          >
            <div class="applicator-avatar">
              <img
                v-if="getPhotoUrl(applicator.photoUrl)"
                :src="getPhotoUrl(applicator.photoUrl)!"
                :alt="applicator.name"
                class="avatar-img"
              />
              <span v-else>{{ getInitials(applicator.name) }}</span>
              <span v-if="applicator.isOnline" class="online-dot"></span>
            </div>
            <div class="applicator-details">
              <span class="applicator-name">{{ applicator.name }}</span>
              <span class="applicator-status" :class="{ online: applicator.isOnline }">
                {{ applicator.isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Slider Controls - at bottom of map -->
      <div class="timeline-controls" v-if="timelineMode && selectedApplicator">
        <div class="timeline-info">
          <div class="selected-user">
            <img
              v-if="getPhotoUrl(selectedApplicator.photoUrl)"
              :src="getPhotoUrl(selectedApplicator.photoUrl)!"
              :alt="selectedApplicator.name"
              class="user-avatar-small"
            />
            <span v-else class="user-avatar-small initials">{{ getInitials(selectedApplicator.name) }}</span>
            <span class="user-name-label">{{ selectedApplicator.name }}</span>
          </div>
          <div class="current-time-display">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ currentTimeDisplay }}</span>
          </div>
          <div class="points-count" v-if="timelineData">
            {{ timelineData.points?.length || 0 }} pontos
          </div>
        </div>

        <!-- No data message -->
        <div v-if="!timelineData || !timelineData.points?.length" class="no-data-message">
          <span>Sem registros de localização para esta data</span>
        </div>

        <!-- Slider - only show if we have data -->
        <div class="slider-container" v-if="timelineData && timelineData.points?.length > 0">
          <span class="time-label start">{{ formatTime(sliderMin) }}</span>
          <input
            type="range"
            v-model.number="sliderValue"
            :min="sliderMin"
            :max="sliderMax"
            class="timeline-slider"
            @input="updateTimelineMarker"
          />
          <span class="time-label end">{{ formatTime(sliderMax) }}</span>
        </div>

        <div v-if="timelineLoading" class="timeline-loading">
          <div class="mini-spinner"></div>
          <span>Carregando...</span>
        </div>
      </div>

      <!-- Sidebar with applicator/projects list - Waze style -->
      <div class="applicators-sidebar" :class="{ collapsed: sidebarCollapsed }" v-if="(markers.size > 0 || projectsList.length > 0) && !timelineMode">
        <!-- Sidebar header with collapse button -->
        <div class="sidebar-header-row">
          <div class="sidebar-header-title" v-if="!sidebarCollapsed">
            <span>{{ sidebarView === 'equipe' ? 'Equipe em Campo' : 'Projetos' }}</span>
          </div>
          <button class="sidebar-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expandir' : 'Recolher'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polyline v-if="sidebarCollapsed" points="9 18 15 12 9 6"/>
              <polyline v-else points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

        <!-- Sidebar content (hidden when collapsed) -->
        <div class="sidebar-content" v-show="!sidebarCollapsed">
          <!-- Toggle between Equipe and Projetos -->
          <div class="sidebar-view-toggle">
            <button
              class="sidebar-toggle-btn"
              :class="{ active: sidebarView === 'equipe' }"
              @click="sidebarView = 'equipe'; searchQuery = ''; statusFilter = 'all'"
            >
              <img src="/grupo.png" alt="Equipe" style="width: 20px; height: 20px; object-fit: contain;" />
              <span>Equipe</span>
              <span class="toggle-count">{{ markers.size }}</span>
            </button>
            <button
              class="sidebar-toggle-btn"
              :class="{ active: sidebarView === 'projetos' }"
              @click="sidebarView = 'projetos'; searchQuery = ''; statusFilter = 'all'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Projetos</span>
              <span class="toggle-count">{{ projectsList.length }}</span>
            </button>
          </div>

        <!-- Search box in sidebar -->
        <div class="sidebar-search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            @input="applyFilters"
            :placeholder="sidebarView === 'equipe' ? 'Buscar por nome...' : 'Buscar projeto...'"
            class="sidebar-search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''; applyFilters()" class="search-clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Status filter pills - only for Equipe view -->
        <div class="sidebar-status-filters" v-if="sidebarView === 'equipe'">
          <button
            class="status-pill em-campo"
            :class="{ active: statusFilter === 'emCampo' }"
            @click="toggleStatusFilter('emCampo')"
          >
            <span class="status-dot"></span>
            {{ emCampoCount }}
          </button>
          <button
            class="status-pill online"
            :class="{ active: statusFilter === 'online' }"
            @click="toggleStatusFilter('online')"
          >
            <span class="status-dot"></span>
            {{ onlineCount }}
          </button>
          <button
            class="status-pill offline"
            :class="{ active: statusFilter === 'offline' }"
            @click="toggleStatusFilter('offline')"
          >
            <span class="status-dot"></span>
            {{ offlineCount }}
          </button>
        </div>

        <!-- Filtered count for projetos view -->
        <div class="sidebar-filter-info" v-if="sidebarView === 'projetos' && searchQuery">
          <span>{{ filteredProjects.length }} de {{ projectsList.length }} projetos</span>
        </div>

        <!-- EQUIPE LIST -->
        <div class="applicator-list" v-if="sidebarView === 'equipe'">
          <div v-if="filteredMarkers.length === 0" class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Nenhum resultado encontrado</span>
          </div>
          <div
            v-for="[id, marker] in filteredMarkers"
            :key="id"
            class="applicator-item"
            :class="{
              online: (marker as any).userData?.isOnline,
              [getCharacterType((marker as any).userData?.user?.role || '', (marker as any).userData?.user?.name || '')]: true
            }"
            @click="centerOnMarker(id)"
          >
            <div class="character-avatar" :class="[{ online: (marker as any).userData?.isOnline || (marker as any).userData?.hasActiveCheckin, offline: !(marker as any).userData?.isOnline && !(marker as any).userData?.hasActiveCheckin }, getCharacterType((marker as any).userData?.user?.role || '', (marker as any).userData?.user?.name || '')]">
              <!-- PNG avatar icon -->
              <img
                :src="characterConfig[getCharacterType((marker as any).userData?.user?.role || '', '')].icon"
                :alt="characterConfig[getCharacterType((marker as any).userData?.user?.role || '', '')].label"
                class="avatar-icon"
                :class="{ offline: !(marker as any).userData?.isOnline && !(marker as any).userData?.hasActiveCheckin }"
              />
              <!-- Online indicator (green for em campo, yellow for online) -->
              <span v-if="(marker as any).userData?.hasActiveCheckin" class="online-indicator em-campo"></span>
              <span v-else-if="(marker as any).userData?.isOnline" class="online-indicator"></span>
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

        <!-- PROJETOS LIST -->
        <div class="projects-list" v-if="sidebarView === 'projetos'">
          <div v-if="filteredProjects.length === 0" class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Nenhum projeto encontrado</span>
          </div>
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="project-item"
            :class="{ 'has-team': project.hasActiveCheckin }"
            @click="centerOnProject(project)"
          >
            <div class="project-icon" :class="{ active: project.hasActiveCheckin }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span v-if="project.activeUsers?.length" class="project-user-count">{{ project.activeUsers.length }}</span>
            </div>
            <div class="project-info">
              <div class="project-title">{{ project.title }}</div>
              <div class="project-cliente" v-if="project.cliente">{{ project.cliente }}</div>
              <div class="project-status-row">
                <span
                  class="project-status-badge"
                  :class="project.hasActiveCheckin ? 'active' : 'empty'"
                >
                  {{ project.hasActiveCheckin ? `${project.activeUsers?.length || 0} em campo` : 'Sem equipe' }}
                </span>
              </div>
            </div>
            <div class="project-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
        </div><!-- end sidebar-content -->
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

.stat-badge.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.stat-badge.clickable:hover {
  background: var(--bg-card-hover);
  transform: translateY(-1px);
}

.stat-badge.clickable.active {
  border-width: 2px;
}

.stat-badge.em-campo.active {
  border-color: var(--accent-green);
  background: rgba(34, 197, 94, 0.1);
}

.stat-badge.online.active {
  border-color: #eab308;
  background: rgba(234, 179, 8, 0.1);
}

.stat-badge.offline.active {
  border-color: var(--accent-red);
  background: rgba(239, 68, 68, 0.1);
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stat-badge.em-campo .stat-dot {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.stat-badge.online .stat-dot {
  background: #eab308;
  box-shadow: 0 0 8px #eab308;
}

.stat-badge.offline .stat-dot {
  background: var(--accent-red);
  box-shadow: 0 0 8px var(--accent-red);
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

/* Map view toggle */
.map-view-toggle {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 4px;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: calc(var(--border-radius) - 4px);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.toggle-btn svg {
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
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

/* Sidebar header row with collapse button */
.sidebar-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sidebar-collapse-btn:hover {
  background: var(--bg-card-hover);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

/* Sidebar content wrapper */
.sidebar-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Collapsed sidebar state */
.applicators-sidebar.collapsed {
  width: 48px;
  padding: 12px 8px;
}

.applicators-sidebar.collapsed .sidebar-header-row {
  justify-content: center;
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* Sidebar view toggle */
.sidebar-view-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 4px;
}

.sidebar-toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: calc(var(--border-radius) - 4px);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-toggle-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.sidebar-toggle-btn.active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.toggle-count {
  font-size: 11px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
}

.sidebar-toggle-btn.active .toggle-count {
  background: rgba(0, 0, 0, 0.3);
}

/* Sidebar filter info */
.sidebar-filter-info {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
  text-align: center;
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

/* Sidebar search box */
.sidebar-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.sidebar-search .search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.sidebar-search-input {
  width: 100%;
  padding: 10px 32px 10px 34px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.sidebar-search-input::placeholder {
  color: var(--text-tertiary);
}

.sidebar-search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: var(--bg-card);
}

.sidebar-search .search-clear {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.sidebar-search .search-clear:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

/* Status filter pills in sidebar */
.sidebar-status-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.status-pill:hover {
  background: var(--bg-card-hover);
}

.status-pill .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pill.em-campo .status-dot {
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.status-pill.online .status-dot {
  background: #eab308;
  box-shadow: 0 0 6px #eab308;
}

.status-pill.offline .status-dot {
  background: var(--accent-red);
  box-shadow: 0 0 6px var(--accent-red);
}

.status-pill.active {
  border-width: 2px;
}

.status-pill.em-campo.active {
  border-color: var(--accent-green);
  background: rgba(34, 197, 94, 0.15);
  color: var(--accent-green);
}

.status-pill.online.active {
  border-color: #eab308;
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.status-pill.offline.active {
  border-color: var(--accent-red);
  background: rgba(239, 68, 68, 0.15);
  color: var(--accent-red);
}

/* No results message */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 13px;
}

.no-results svg {
  opacity: 0.5;
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
  background: #eab308;
  border: 2px solid var(--bg-card);
  border-radius: 50%;
  animation: pulse-online 1.5s ease-in-out infinite;
}

/* Em campo indicator (green, more prominent) */
.online-indicator.em-campo {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

@keyframes pulse-online {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(234, 179, 8, 0); }
}

@keyframes pulse-em-campo {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
  50% { opacity: 0.9; box-shadow: 0 0 12px rgba(34, 197, 94, 0.8); }
}

.online-indicator.em-campo {
  animation: pulse-em-campo 1.5s ease-in-out infinite;
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

/* =============================================
   TIMELINE MODE STYLES
   ============================================= */

.timeline-sidebar {
  position: absolute;
  top: 100px;
  right: 48px;
  width: 300px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  max-height: calc(100vh - 350px);
  overflow-y: auto;
  z-index: 10;
}

.timeline-date-picker {
  margin-bottom: 16px;
}

.timeline-date-picker label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.date-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.timeline-applicator-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-header {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.timeline-search-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-search-container .search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.timeline-search-input {
  width: 100%;
  padding: 10px 36px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.timeline-search-input::placeholder {
  color: var(--text-tertiary);
}

.timeline-search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: var(--bg-card);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.empty-list {
  padding: 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

.timeline-applicator-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-applicator-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-color);
}

.timeline-applicator-item.selected {
  border-color: var(--accent-primary);
  background: rgba(201, 169, 98, 0.1);
}

.timeline-applicator-item.online {
  border-color: rgba(34, 197, 94, 0.3);
}

.timeline-applicator-item.online.selected {
  border-color: var(--accent-primary);
}

.applicator-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
  overflow: visible;
  flex-shrink: 0;
}

.applicator-avatar .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.applicator-avatar .online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--accent-green);
  border: 2px solid var(--bg-card);
  border-radius: 50%;
}

.applicator-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.applicator-details .applicator-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.applicator-details .applicator-status {
  font-size: 12px;
  color: var(--text-tertiary);
}

.applicator-details .applicator-status.online {
  color: var(--accent-green);
}

/* Timeline Controls - Bottom Bar */
.timeline-controls {
  position: absolute;
  bottom: 48px;
  left: 48px;
  right: 340px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.timeline-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-small.initials {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #000;
}

.user-name-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.current-time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(201, 169, 98, 0.15);
  border: 1px solid rgba(201, 169, 98, 0.3);
  border-radius: var(--border-radius);
  color: var(--accent-primary);
  font-size: 18px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 50px;
  font-family: 'JetBrains Mono', monospace;
}

.time-label.start {
  text-align: right;
}

.time-label.end {
  text-align: left;
}

.timeline-slider {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  border-radius: 4px;
  cursor: pointer;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  cursor: grab;
  box-shadow: 0 2px 8px rgba(201, 169, 98, 0.4);
  transition: transform 0.2s;
}

.timeline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.timeline-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.timeline-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  cursor: grab;
  border: none;
  box-shadow: 0 2px 8px rgba(201, 169, 98, 0.4);
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  align-items: center;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000;
  transition: all 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(201, 169, 98, 0.4);
}

.speed-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.timeline-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.points-count {
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.no-data-message {
  padding: 16px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Timeline sidebar scrollbar */
.timeline-sidebar::-webkit-scrollbar {
  width: 6px;
}

.timeline-sidebar::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.timeline-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.timeline-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* =============================================
   PROJECTS LIST STYLES
   ============================================= */

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.project-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-color);
}

.project-item.has-team {
  border-color: rgba(34, 197, 94, 0.3);
}

.project-item.has-team:hover {
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.15);
}

.project-icon {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--bg-card);
  border-radius: 10px;
  color: var(--text-tertiary);
  transition: all 0.2s;
}

.project-icon svg {
  width: 24px;
  height: 24px;
}

.project-icon.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--accent-green);
}

.project-icon.active svg {
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.5));
}

.project-user-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent-green);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.project-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.project-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-cliente {
  font-size: 12px;
  color: var(--accent-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.project-status-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 6px;
}

.project-status-badge.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--accent-green);
}

.project-status-badge.empty {
  background: var(--bg-card);
  color: var(--text-tertiary);
}

.project-arrow {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  opacity: 0;
  transition: all 0.2s ease;
}

.project-item:hover .project-arrow {
  opacity: 1;
  color: var(--accent-primary);
  transform: translateX(2px);
}

.project-arrow svg {
  width: 100%;
  height: 100%;
}

/* Projects list scrollbar */
.projects-list::-webkit-scrollbar {
  width: 6px;
}

.projects-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.projects-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.projects-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* ===== MOBILE RESPONSIVE STYLES ===== */
.hamburger-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; border-radius: var(--border-radius); }
.hamburger-btn:hover { background-color: var(--bg-secondary); }
.mobile-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 998; }
.mobile-sidebar { display: none; position: fixed; top: 0; left: -280px; width: 280px; height: 100vh; background-color: var(--bg-card); border-right: 1px solid var(--border-color); z-index: 999; transition: left 0.3s ease; flex-direction: column; }
.mobile-sidebar.open { left: 0; }
.mobile-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.close-menu-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; border-radius: var(--border-radius); }
.close-menu-btn:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
.mobile-nav { flex: 1; padding: 16px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.mobile-nav-link { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--border-radius); text-decoration: none; color: var(--text-secondary); font-weight: 500; font-size: 15px; transition: all 0.2s; }
.mobile-nav-link:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
.mobile-nav-link.router-link-active { background-color: rgba(201, 169, 98, 0.15); color: var(--accent-primary); }
.mobile-sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border-color); }
.mobile-user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.mobile-user-info .user-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.mobile-logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; background-color: rgba(239, 68, 68, 0.1); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--border-radius); cursor: pointer; font-weight: 500; font-size: 14px; }
.mobile-logout-btn:hover { background-color: rgba(239, 68, 68, 0.2); }

@media (max-width: 768px) {
  .hamburger-btn { display: flex; }
  .mobile-overlay { display: block; }
  .mobile-sidebar { display: flex; }
  .desktop-nav { display: none !important; }
  .header-right { display: none; }
  .header { padding: 12px 16px; }
  .header-left { gap: 8px; }
  .header-logo { height: 28px; }
  .logo-badge { font-size: 9px; padding: 3px 6px; }
  .main { padding: 0; }
  .map-container { height: calc(100vh - 60px); }
  .sidebar { display: none; }
  .info-panel { position: fixed; bottom: 0; left: 0; right: 0; max-height: 50vh; border-radius: 16px 16px 0 0; z-index: 100; }
}
</style>
