<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { locationsApi } from '../api';
import { Loader } from '@googlemaps/js-api-loader';

const router = useRouter();
const authStore = useAuthStore();

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const markers = ref<Map<string, google.maps.Marker>>(new Map());
const infoWindow = ref<google.maps.InfoWindow | null>(null);
const loading = ref(true);
const error = ref('');
const lastUpdate = ref<Date | null>(null);
const refreshInterval = ref<number | null>(null);

// Stats
const onlineCount = ref(0);
const offlineCount = ref(0);
const selectedUser = ref<any>(null);

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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'AUXILIAR': return 'Auxiliar';
    case 'APLICADOR': return 'Aplicador';
    case 'APLICADOR_SENIOR': return 'Aplicador Senior';
    case 'LIDER_EQUIPE': return 'Lider de Equipe';
    default: return role;
  }
};

const initMap = async () => {
  if (!mapContainer.value) return;

  try {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    await loader.load();

    // Default center: Sao Paulo
    const defaultCenter = { lat: -23.5505, lng: -46.6333 };

    map.value = new google.maps.Map(mapContainer.value, {
      center: defaultCenter,
      zoom: 12,
      styles: [
        // Dark theme map styles
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }],
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }],
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }],
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }],
        },
      ],
    });

    infoWindow.value = new google.maps.InfoWindow();

    await loadLocations();

    // Auto-refresh every 30 seconds
    refreshInterval.value = window.setInterval(loadLocations, 30000);
  } catch (err: any) {
    error.value = err.message || 'Erro ao carregar mapa';
    console.error('Map init error:', err);
  } finally {
    loading.value = false;
  }
};

const createMarkerIcon = (isOnline: boolean) => {
  const color = isOnline ? '#22c55e' : '#ef4444';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
    </svg>
  `;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
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

      if (markers.value.has(markerData.id)) {
        // Update existing marker
        const marker = markers.value.get(markerData.id)!;
        marker.setPosition(position);
        marker.setIcon(createMarkerIcon(markerData.isOnline));
        (marker as any).userData = markerData;
      } else {
        // Create new marker
        const marker = new google.maps.Marker({
          position,
          map: map.value,
          icon: createMarkerIcon(markerData.isOnline),
          title: markerData.user.name,
        });

        (marker as any).userData = markerData;

        marker.addListener('click', () => {
          const userData = (marker as any).userData;
          selectedUser.value = userData;

          const content = `
            <div style="padding: 8px; min-width: 200px; color: #333;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                ${userData.user.name}
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                ${getRoleLabel(userData.user.role)}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${userData.isOnline ? '#22c55e' : '#ef4444'};"></span>
                <span style="font-size: 12px;">${userData.isOnline ? 'Online' : 'Offline'}</span>
              </div>
              ${userData.project ? `
                <div style="font-size: 12px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                  <div style="font-weight: 500; color: #333;">${userData.project.title}</div>
                  <div>${userData.project.cliente || ''}</div>
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #999; margin-top: 8px;">
                Visto: ${formatLastSeen(userData.lastSeen)}
              </div>
            </div>
          `;

          infoWindow.value?.setContent(content);
          infoWindow.value?.open(map.value, marker);
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
    bounds.extend(marker.getPosition()!);
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
            {{ authStore.user?.name?.charAt(0) || 'A' }}
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

      <!-- Sidebar with applicator list -->
      <div class="applicators-sidebar" v-if="markers.size > 0">
        <h3>Aplicadores</h3>
        <div class="applicator-list">
          <div
            v-for="[id, marker] in markers"
            :key="id"
            class="applicator-item"
            :class="{ online: (marker as any).userData?.isOnline }"
            @click="centerOnMarker(id)"
          >
            <div class="applicator-status">
              <span class="status-dot" :class="{ online: (marker as any).userData?.isOnline }"></span>
            </div>
            <div class="applicator-info">
              <span class="applicator-name">{{ (marker as any).userData?.user?.name }}</span>
              <span class="applicator-project">{{ (marker as any).userData?.project?.title || 'Sem projeto' }}</span>
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
</style>
