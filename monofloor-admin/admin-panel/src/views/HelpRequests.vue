<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { helpRequestsApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

const getPhotoUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}${photoUrl}`;
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const requests = ref<any[]>([]);
const loading = ref(true);
const filter = ref('PENDING');
const typeFilter = ref('all');

// Modal state
const showNotesModal = ref(false);
const currentRequestId = ref('');
const currentAction = ref<'resolve' | 'cancel' | 'progress'>('resolve');
const adminNotes = ref('');

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    if (typeFilter.value !== 'all') {
      params.type = typeFilter.value;
    }
    const response = await helpRequestsApi.getAll(params);
    requests.value = response.data.data?.requests || [];
  } catch (error) {
    console.error('Error loading help requests:', error);
  } finally {
    loading.value = false;
  }
};

const openActionModal = (id: string, action: 'resolve' | 'cancel' | 'progress') => {
  currentRequestId.value = id;
  currentAction.value = action;
  adminNotes.value = '';
  showNotesModal.value = true;
};

const executeAction = async () => {
  try {
    if (currentAction.value === 'resolve') {
      await helpRequestsApi.resolve(currentRequestId.value, adminNotes.value);
    } else if (currentAction.value === 'cancel') {
      await helpRequestsApi.cancel(currentRequestId.value, adminNotes.value);
    } else if (currentAction.value === 'progress') {
      await helpRequestsApi.updateStatus(currentRequestId.value, 'IN_PROGRESS', adminNotes.value);
    }
    showNotesModal.value = false;
    await loadRequests();
  } catch (error) {
    console.error('Error executing action:', error);
    alert('Erro ao processar solicitacao');
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': return 'var(--accent-green)';
    case 'PENDING': return 'var(--accent-orange)';
    case 'IN_PROGRESS': return 'var(--accent-blue)';
    case 'CANCELLED': return 'var(--accent-red)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'RESOLVED': return 'Resolvido';
    case 'PENDING': return 'Pendente';
    case 'IN_PROGRESS': return 'Em Progresso';
    case 'CANCELLED': return 'Cancelado';
    default: return status;
  }
};

const getTypeLabel = (type: string) => {
  return type === 'MATERIAL' ? 'Material' : 'Ajuda';
};

const getTypeColor = (type: string) => {
  return type === 'MATERIAL' ? 'var(--accent-blue)' : 'var(--accent-purple, #8b5cf6)';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getActionTitle = () => {
  switch (currentAction.value) {
    case 'resolve': return 'Resolver Solicitacao';
    case 'cancel': return 'Cancelar Solicitacao';
    case 'progress': return 'Marcar Em Progresso';
    default: return 'Acao';
  }
};

onMounted(() => {
  loadRequests();
});
</script>

<template>
  <div class="help-requests-page">
    <!-- Header -->
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
        <router-link to="/help-requests" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Ajuda/Material
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

    <!-- Filter Tabs -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button
          :class="{ active: filter === 'PENDING' }"
          @click="filter = 'PENDING'; loadRequests()"
        >
          Pendentes
        </button>
        <button
          :class="{ active: filter === 'IN_PROGRESS' }"
          @click="filter = 'IN_PROGRESS'; loadRequests()"
        >
          Em Progresso
        </button>
        <button
          :class="{ active: filter === 'RESOLVED' }"
          @click="filter = 'RESOLVED'; loadRequests()"
        >
          Resolvidos
        </button>
        <button
          :class="{ active: filter === 'CANCELLED' }"
          @click="filter = 'CANCELLED'; loadRequests()"
        >
          Cancelados
        </button>
        <button
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'; loadRequests()"
        >
          Todos
        </button>
      </div>
      <div class="type-filter">
        <label>Tipo:</label>
        <select v-model="typeFilter" @change="loadRequests()">
          <option value="all">Todos</option>
          <option value="MATERIAL">Material</option>
          <option value="HELP">Ajuda</option>
        </select>
      </div>
    </div>

    <!-- Content -->
    <div class="page-content">
      <div v-if="loading" class="loading">Carregando...</div>

      <div v-else-if="requests.length === 0" class="empty-state">
        Nenhuma solicitacao encontrada
      </div>

      <div v-else class="requests-list">
        <div v-for="request in requests" :key="request.id" class="request-card">
          <!-- Card Title -->
          <div class="card-title">
            <svg v-if="request.type === 'MATERIAL'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {{ request.type === 'MATERIAL' ? 'SOLICITACAO DE MATERIAL' : 'SOLICITACAO DE AJUDA' }}
            <span class="type-badge" :style="{ backgroundColor: getTypeColor(request.type) }">
              {{ getTypeLabel(request.type) }}
            </span>
          </div>

          <div class="request-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="getPhotoUrl(request.user?.photoUrl)" :src="getPhotoUrl(request.user?.photoUrl)" :alt="request.user?.name" />
                <span v-else>{{ getInitials(request.user?.name) }}</span>
              </div>
              <div class="user-details">
                <span class="user-name">{{ request.user?.name || 'Sem nome' }}</span>
                <span class="user-email">{{ request.user?.email }}</span>
                <span class="user-phone" v-if="request.user?.phone">{{ request.user.phone }}</span>
              </div>
            </div>
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(request.status) }">
              {{ getStatusLabel(request.status) }}
            </div>
          </div>

          <div class="request-body">
            <!-- Project Info -->
            <div class="info-row" v-if="request.project">
              <span class="label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Projeto:
              </span>
              <span class="value highlight">{{ request.project?.title || request.project?.cliente }}</span>
            </div>

            <!-- Material Details -->
            <div class="info-row" v-if="request.type === 'MATERIAL' && request.materialName">
              <span class="label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Material:
              </span>
              <span class="value">{{ request.materialName }}</span>
            </div>

            <div class="info-row" v-if="request.quantity">
              <span class="label">Quantidade:</span>
              <span class="value">{{ request.quantity }}</span>
            </div>

            <!-- Description -->
            <div class="description-box" v-if="request.description">
              <span class="label">Descricao:</span>
              <p class="description-text">{{ request.description }}</p>
            </div>

            <!-- Audio Transcription -->
            <div class="transcription-box" v-if="request.audioTranscription">
              <span class="label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Transcricao do Audio:
              </span>
              <p class="transcription-text">{{ request.audioTranscription }}</p>
            </div>

            <!-- Audio Player -->
            <div class="audio-player" v-if="request.audioUrl">
              <span class="label">Audio:</span>
              <audio controls :src="getPhotoUrl(request.audioUrl)" class="audio-control"></audio>
            </div>

            <!-- Video Player -->
            <div class="video-player" v-if="request.videoUrl">
              <span class="label">Video:</span>
              <video controls :src="getPhotoUrl(request.videoUrl)" class="video-control"></video>
            </div>

            <!-- Admin Notes -->
            <div class="admin-notes" v-if="request.adminNotes">
              <span class="label">Notas do Admin:</span>
              <p class="notes-text">{{ request.adminNotes }}</p>
            </div>

            <!-- Dates -->
            <div class="dates">
              <span class="date-item">
                <span class="label">Solicitado em:</span>
                <span class="value">{{ formatDate(request.createdAt) }}</span>
              </span>
              <span class="date-item" v-if="request.resolvedAt">
                <span class="label">Resolvido em:</span>
                <span class="value">{{ formatDate(request.resolvedAt) }}</span>
              </span>
              <span class="date-item" v-if="request.resolvedBy">
                <span class="label">Por:</span>
                <span class="value">{{ request.resolvedBy.name }}</span>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="request-actions" v-if="request.status === 'PENDING' || request.status === 'IN_PROGRESS'">
            <button
              v-if="request.status === 'PENDING'"
              class="btn-progress"
              @click="openActionModal(request.id, 'progress')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Em Progresso
            </button>
            <button class="btn-resolve" @click="openActionModal(request.id, 'resolve')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Resolver
            </button>
            <button class="btn-cancel" @click="openActionModal(request.id, 'cancel')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes Modal -->
    <div v-if="showNotesModal" class="modal-overlay" @click.self="showNotesModal = false">
      <div class="modal-content">
        <h3>{{ getActionTitle() }}</h3>
        <div class="form-group">
          <label>Notas (opcional):</label>
          <textarea v-model="adminNotes" placeholder="Adicione notas sobre esta acao..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showNotesModal = false">Cancelar</button>
          <button
            class="btn-primary"
            :class="{
              'btn-green': currentAction === 'resolve',
              'btn-blue': currentAction === 'progress',
              'btn-red': currentAction === 'cancel'
            }"
            @click="executeAction"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-requests-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
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

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.filter-tabs button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tabs button:hover {
  background: var(--bg-tertiary);
}

.filter-tabs button.active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #000000;
  font-weight: 600;
}

.type-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-filter label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.type-filter select {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
}

.page-content {
  padding: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.requests-list {
  display: grid;
  gap: 1rem;
}

.request-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--accent-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.card-title svg {
  color: var(--accent-gold);
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  margin-left: auto;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-secondary);
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
}

.user-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.user-phone {
  font-size: 0.75rem;
  color: var(--accent-blue);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.request-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-row .label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.info-row .value {
  font-size: 0.875rem;
}

.info-row .value.highlight {
  color: var(--accent-gold);
  font-weight: 600;
}

.description-box,
.transcription-box,
.admin-notes {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
}

.description-box .label,
.transcription-box .label,
.admin-notes .label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
}

.description-text,
.transcription-text,
.notes-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.transcription-box {
  border-left: 3px solid var(--accent-blue);
}

.admin-notes {
  border-left: 3px solid var(--accent-orange);
}

.audio-player,
.video-player {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.audio-player .label,
.video-player .label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.audio-control {
  width: 100%;
  max-width: 400px;
}

.video-control {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
}

.dates {
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
}

.date-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.date-item .label {
  color: var(--text-secondary);
}

.request-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-progress,
.btn-resolve,
.btn-cancel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-progress {
  background: var(--accent-blue);
  color: white;
}

.btn-progress:hover {
  background: #2563eb;
}

.btn-resolve {
  background: var(--accent-green);
  color: white;
}

.btn-resolve:hover {
  background: #16a34a;
}

.btn-cancel {
  background: var(--accent-red);
  color: white;
}

.btn-cancel:hover {
  background: #dc2626;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.form-group textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.btn-green {
  background: var(--accent-green);
}

.btn-blue {
  background: var(--accent-blue);
}

.btn-red {
  background: var(--accent-red);
}
</style>
