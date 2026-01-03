<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { requestsApi, contributionsApi, helpRequestsApi, absencesApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

// Mobile menu state
const mobileMenuOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

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

interface UnifiedRequest {
  id: string;
  type: 'CONTRIBUTION' | 'ABSENCE' | 'HELP_REQUEST' | 'MATERIAL_REQUEST';
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    role: string;
    phone?: string;
  };
  project?: {
    id: string;
    title: string;
    cliente?: string;
    endereco?: string;
  };
  details: Record<string, any>;
  reviewedAt?: string;
  reviewedBy?: { id: string; name: string };
}

const requests = ref<UnifiedRequest[]>([]);
const loading = ref(true);
const typeFilter = ref('all');
const counts = ref({ contributions: 0, helpRequests: 0, materialRequests: 0, absences: 0, total: 0 });

// Modal state for help requests actions
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
    if (typeFilter.value !== 'all') {
      params.type = typeFilter.value;
    }
    const response = await requestsApi.getAll(params);
    requests.value = response.data.data?.requests || [];
  } catch (error) {
    console.error('Error loading requests:', error);
  } finally {
    loading.value = false;
  }
};

const loadCounts = async () => {
  try {
    const response = await requestsApi.getCounts();
    counts.value = response.data.data;
  } catch (error) {
    console.error('Error loading counts:', error);
  }
};

// Contribution actions
const approveContribution = async (id: string) => {
  try {
    await contributionsApi.approve(id);
    await loadRequests();
    await loadCounts();
  } catch (error) {
    console.error('Error approving contribution:', error);
    alert('Erro ao aprovar solicitacao');
  }
};

const rejectContribution = async (id: string) => {
  if (confirm('Tem certeza que deseja rejeitar esta solicitacao?')) {
    try {
      await contributionsApi.reject(id);
      await loadRequests();
      await loadCounts();
    } catch (error) {
      console.error('Error rejecting contribution:', error);
      alert('Erro ao rejeitar solicitacao');
    }
  }
};

// Absence actions
const acknowledgeAbsence = async (id: string) => {
  try {
    await absencesApi.acknowledge(id);
    await loadRequests();
    await loadCounts();
  } catch (error) {
    console.error('Error acknowledging absence:', error);
    alert('Erro ao marcar ciencia da falta');
  }
};

// Help request actions
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
    await loadCounts();
  } catch (error) {
    console.error('Error executing action:', error);
    alert('Erro ao processar solicitacao');
  }
};

// Type helpers
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'CONTRIBUTION': return 'user-plus';
    case 'ABSENCE': return 'calendar-x';
    case 'HELP_REQUEST': return 'help-circle';
    case 'MATERIAL_REQUEST': return 'package';
    default: return 'file';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'CONTRIBUTION': return 'INCLUSAO EM PROJETO';
    case 'ABSENCE': return 'AVISO DE FALTA';
    case 'HELP_REQUEST': return 'SOLICITACAO DE AJUDA';
    case 'MATERIAL_REQUEST': return 'SOLICITACAO DE MATERIAL';
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'CONTRIBUTION': return 'var(--accent-gold)';
    case 'ABSENCE': return 'var(--accent-red)';
    case 'HELP_REQUEST': return 'var(--accent-purple, #8b5cf6)';
    case 'MATERIAL_REQUEST': return 'var(--accent-blue)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusColor = (status: string) => {
  if (status.includes('PENDING')) return 'var(--accent-orange)';
  if (status.includes('APPROVED') || status.includes('RESOLVED') || status.includes('CONFIRMED')) return 'var(--accent-green)';
  if (status.includes('REJECTED') || status.includes('CANCELLED') || status.includes('DENIED')) return 'var(--accent-red)';
  if (status.includes('PROGRESS')) return 'var(--accent-blue)';
  return 'var(--text-tertiary)';
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pendente';
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Rejeitado';
    case 'RESOLVED': return 'Resolvido';
    case 'IN_PROGRESS': return 'Em Progresso';
    case 'CANCELLED': return 'Cancelado';
    case 'CONFIRMED': return 'Confirmado';
    case 'UNREPORTED_PENDING': return 'Aguardando Resposta';
    case 'UNREPORTED_CONFIRMED': return 'Falta Confirmada';
    case 'UNREPORTED_DENIED': return 'Negada';
    case 'UNREPORTED_EXPIRED': return 'Expirada';
    default: return status;
  }
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

const formatAbsenceDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
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

// Check if request needs action
const needsAction = (request: UnifiedRequest) => {
  if (request.type === 'CONTRIBUTION' && request.status === 'PENDING') return true;
  if ((request.type === 'HELP_REQUEST' || request.type === 'MATERIAL_REQUEST') &&
      (request.status === 'PENDING' || request.status === 'IN_PROGRESS')) return true;
  // Absence needs action if not yet acknowledged by admin
  if (request.type === 'ABSENCE' && !request.details?.acknowledgedAt) return true;
  return false;
};

onMounted(() => {
  loadRequests();
  loadCounts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="requests-page">
    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Mobile Sidebar -->
    <aside class="mobile-sidebar" :class="{ open: mobileMenuOpen }">
      <div class="mobile-sidebar-header">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <button class="close-menu-btn" @click="closeMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <nav class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Aplicadores
        </router-link>
        <router-link to="/projects" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projetos
        </router-link>
        <router-link to="/reports" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Relatorios
        </router-link>
        <router-link to="/requests" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/campaigns" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/academy" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Academia
        </router-link>
        <router-link to="/map" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
      </nav>
      <div class="mobile-sidebar-footer">
        <div class="mobile-user-info">
          <div class="user-avatar">
            <img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" />
            <span v-else>{{ getInitials(authStore.user?.name) }}</span>
          </div>
          <span class="user-name">{{ authStore.user?.name }}</span>
        </div>
        <button @click="logout" class="mobile-logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>

    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="hamburger-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
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
          <span v-if="counts.total > 0" class="nav-badge">{{ counts.total }}</span>
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

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button
          :class="{ active: typeFilter === 'all' }"
          @click="typeFilter = 'all'; loadRequests()"
        >
          Todas
          <span class="count-badge" v-if="counts.total > 0">{{ counts.total }}</span>
        </button>
        <button
          :class="{ active: typeFilter === 'CONTRIBUTION' }"
          @click="typeFilter = 'CONTRIBUTION'; loadRequests()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Inclusao
          <span class="count-badge" v-if="counts.contributions > 0">{{ counts.contributions }}</span>
        </button>
        <button
          :class="{ active: typeFilter === 'ABSENCE' }"
          @click="typeFilter = 'ABSENCE'; loadRequests()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="9" y1="14" x2="15" y2="20"/>
            <line x1="15" y1="14" x2="9" y2="20"/>
          </svg>
          Faltas
          <span class="count-badge" v-if="counts.absences > 0">{{ counts.absences }}</span>
        </button>
        <button
          :class="{ active: typeFilter === 'HELP_REQUEST' }"
          @click="typeFilter = 'HELP_REQUEST'; loadRequests()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Ajuda
          <span class="count-badge" v-if="counts.helpRequests > 0">{{ counts.helpRequests }}</span>
        </button>
        <button
          :class="{ active: typeFilter === 'MATERIAL_REQUEST' }"
          @click="typeFilter = 'MATERIAL_REQUEST'; loadRequests()"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          Material
          <span class="count-badge" v-if="counts.materialRequests > 0">{{ counts.materialRequests }}</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="page-content">
      <div v-if="loading" class="loading">Carregando...</div>

      <div v-else-if="requests.length === 0" class="empty-state">
        Nenhuma solicitacao encontrada
      </div>

      <div v-else class="requests-list">
        <div v-for="request in requests" :key="request.id" class="request-card" :class="{ 'has-action': needsAction(request) }">
          <!-- Card Title -->
          <div class="card-title" :style="{ borderColor: getTypeColor(request.type) }">
            <!-- Icon based on type -->
            <svg v-if="request.type === 'CONTRIBUTION'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <svg v-else-if="request.type === 'ABSENCE'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="9" y1="14" x2="15" y2="20"/>
              <line x1="15" y1="14" x2="9" y2="20"/>
            </svg>
            <svg v-else-if="request.type === 'HELP_REQUEST'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <span :style="{ color: getTypeColor(request.type) }">{{ getTypeLabel(request.type) }}</span>
            <span class="type-badge" :style="{ backgroundColor: getTypeColor(request.type) }">
              {{ request.type === 'CONTRIBUTION' ? 'Projeto' : request.type === 'ABSENCE' ? 'Falta' : request.type === 'HELP_REQUEST' ? 'Ajuda' : 'Material' }}
            </span>
          </div>

          <div class="request-header">
            <div class="user-info-card">
              <div class="user-avatar-card">
                <img v-if="getPhotoUrl(request.user?.photoUrl)" :src="getPhotoUrl(request.user?.photoUrl)!" :alt="request.user?.name" />
                <span v-else>{{ getInitials(request.user?.name) }}</span>
              </div>
              <div class="user-details">
                <span class="user-name-card">{{ request.user?.name || 'Sem nome' }}</span>
                <span class="user-email">{{ request.user?.email }}</span>
                <span v-if="request.user?.phone" class="user-phone">{{ request.user.phone }}</span>
              </div>
            </div>
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(request.status) }">
              {{ getStatusLabel(request.status) }}
            </div>
          </div>

          <div class="request-body">
            <!-- CONTRIBUTION specific content -->
            <template v-if="request.type === 'CONTRIBUTION'">
              <div class="projects-section">
                <div class="project-row requested">
                  <div class="project-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Projeto Solicitado:
                  </div>
                  <div class="project-value">{{ request.project?.title || request.project?.cliente || 'Sem nome' }}</div>
                </div>
                <div class="project-row current">
                  <div class="project-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Projeto Atual (check-in):
                  </div>
                  <div class="project-value" :class="{ 'no-project': !request.details?.currentProject }">
                    {{ request.details?.currentProject ? (request.details.currentProject.title || request.details.currentProject.cliente) : 'Sem check-in ativo' }}
                  </div>
                </div>
              </div>
              <div class="project-address" v-if="request.project?.endereco">
                <span class="label">Endereco:</span>
                <span class="value">{{ request.project?.endereco }}</span>
              </div>
              <div class="description" v-if="request.details?.description">
                <span class="label">Motivo:</span>
                <span class="value">{{ request.details.description }}</span>
              </div>
            </template>

            <!-- ABSENCE specific content -->
            <template v-else-if="request.type === 'ABSENCE'">
              <div class="absence-info">
                <div class="absence-date-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div class="absence-date-text">
                    <span class="label">Data da Falta:</span>
                    <span class="value highlight-date">{{ formatAbsenceDate(request.details?.absenceDate) }}</span>
                  </div>
                </div>
                <div class="info-row" v-if="request.details?.reason">
                  <span class="label">Motivo:</span>
                  <span class="value">{{ request.details.reason }}</span>
                </div>
                <div class="info-row" v-if="request.project">
                  <span class="label">Projeto Escalado:</span>
                  <span class="value highlight">{{ request.project.title || request.project.cliente }}</span>
                </div>
                <div class="scheduled-tasks" v-if="request.details?.scheduledTasks?.length > 0">
                  <span class="label">Tarefas do dia:</span>
                  <ul class="tasks-list">
                    <li v-for="(task, idx) in request.details.scheduledTasks" :key="idx">
                      {{ task.title }} <span class="task-project">- {{ task.project }}</span>
                    </li>
                  </ul>
                </div>
                <div class="penalty-info" v-if="request.details?.xpPenalty > 0 || request.details?.multiplierReset">
                  <span class="penalty-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Penalidade: -{{ request.details.xpPenalty }} XP
                    <span v-if="request.details.multiplierReset">(Multiplicador resetado)</span>
                  </span>
                </div>
                <div class="no-penalty-info" v-else-if="request.details?.wasAdvanceNotice">
                  <span class="no-penalty-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aviso com antecedencia - Sem penalidade
                  </span>
                </div>
                <div class="unreported-info" v-if="request.details?.isUnreported">
                  <span class="unreported-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Falta detectada automaticamente
                  </span>
                </div>
                <div class="acknowledged-info" v-if="request.details?.acknowledgedAt">
                  <span class="acknowledged-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Admin ciente em {{ formatDate(request.details.acknowledgedAt) }}
                  </span>
                </div>
              </div>
            </template>

            <!-- HELP_REQUEST / MATERIAL_REQUEST specific content -->
            <template v-else>
              <div class="info-row" v-if="request.project">
                <span class="label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Projeto:
                </span>
                <span class="value highlight">{{ request.project?.title || request.project?.cliente }}</span>
              </div>
              <div class="info-row" v-if="request.type === 'MATERIAL_REQUEST' && request.details?.materialName">
                <span class="label">Material:</span>
                <span class="value">{{ request.details.materialName }}</span>
              </div>
              <div class="info-row" v-if="request.details?.quantity">
                <span class="label">Quantidade:</span>
                <span class="value">{{ request.details.quantity }}</span>
              </div>
              <div class="description-box" v-if="request.details?.description">
                <span class="label">Descricao:</span>
                <p class="description-text">{{ request.details.description }}</p>
              </div>
              <div class="transcription-box" v-if="request.details?.audioTranscription">
                <span class="label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  Transcricao:
                </span>
                <p class="transcription-text">{{ request.details.audioTranscription }}</p>
              </div>
              <div class="audio-player" v-if="request.details?.audioUrl">
                <span class="label">Audio:</span>
                <audio controls :src="getPhotoUrl(request.details.audioUrl)" class="audio-control"></audio>
              </div>
              <div class="video-player" v-if="request.details?.videoUrl">
                <span class="label">Video:</span>
                <video controls :src="getPhotoUrl(request.details.videoUrl)" class="video-control"></video>
              </div>
              <div class="admin-notes" v-if="request.details?.adminNotes">
                <span class="label">Notas do Admin:</span>
                <p class="notes-text">{{ request.details.adminNotes }}</p>
              </div>
            </template>

            <!-- Dates (all types) -->
            <div class="dates">
              <span class="date-item">
                <span class="label">Criado em:</span>
                <span class="value">{{ formatDate(request.createdAt) }}</span>
              </span>
              <span class="date-item" v-if="request.reviewedAt">
                <span class="label">Revisado em:</span>
                <span class="value">{{ formatDate(request.reviewedAt) }}</span>
              </span>
              <span class="date-item" v-if="request.reviewedBy">
                <span class="label">Por:</span>
                <span class="value">{{ request.reviewedBy.name }}</span>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="request-actions" v-if="needsAction(request)">
            <!-- CONTRIBUTION actions -->
            <template v-if="request.type === 'CONTRIBUTION' && request.status === 'PENDING'">
              <button class="btn-approve" @click="approveContribution(request.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Aprovar
              </button>
              <button class="btn-reject" @click="rejectContribution(request.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Rejeitar
              </button>
            </template>

            <!-- ABSENCE actions -->
            <template v-if="request.type === 'ABSENCE' && !request.details?.acknowledgedAt">
              <button class="btn-acknowledge" @click="acknowledgeAbsence(request.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Estou Ciente
              </button>
            </template>

            <!-- HELP/MATERIAL actions -->
            <template v-if="(request.type === 'HELP_REQUEST' || request.type === 'MATERIAL_REQUEST') && (request.status === 'PENDING' || request.status === 'IN_PROGRESS')">
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
            </template>
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
.requests-page {
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
  position: relative;
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

.nav-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--accent-red);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
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
  justify-content: center;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-tabs button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
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

.count-badge {
  background: rgba(0, 0, 0, 0.2);
  color: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.filter-tabs button.active .count-badge {
  background: rgba(0, 0, 0, 0.3);
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
  transition: border-color 0.2s;
}

.request-card.has-action {
  border-left: 4px solid var(--accent-orange);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.card-title svg {
  color: inherit;
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

.user-info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar-card {
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

.user-avatar-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name-card {
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

/* Contribution specific styles */
.projects-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
}

.project-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-row.requested .project-value {
  color: var(--accent-gold);
  font-weight: 600;
}

.project-row.current .project-value {
  color: var(--accent-green);
  font-weight: 600;
}

.project-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.project-label svg {
  opacity: 0.7;
}

.project-value {
  font-size: 1rem;
  padding-left: 1.5rem;
}

.project-value.no-project {
  color: var(--text-tertiary);
  font-style: italic;
  font-weight: 400;
}

/* Absence specific styles */
.absence-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.absence-date-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--accent-red);
}

.absence-date-box svg {
  color: var(--accent-red);
}

.absence-date-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.highlight-date {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.scheduled-tasks {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
}

.tasks-list {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}

.tasks-list li {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.task-project {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.penalty-info {
  margin-top: 0.5rem;
}

.penalty-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.no-penalty-info {
  margin-top: 0.5rem;
}

.no-penalty-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.unreported-info {
  margin-top: 0.5rem;
}

.unreported-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(249, 115, 22, 0.1);
  color: var(--accent-orange);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.acknowledged-info {
  margin-top: 0.5rem;
}

.acknowledged-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-gold);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Help/Material specific styles */
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

/* Common styles */
.label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.value {
  font-size: 0.875rem;
}

.project-address,
.description {
  display: flex;
  gap: 0.5rem;
}

.dates {
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
}

.btn-approve,
.btn-reject,
.btn-progress,
.btn-resolve,
.btn-cancel,
.btn-acknowledge {
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

.btn-approve,
.btn-resolve {
  background: var(--accent-green);
  color: white;
}

.btn-approve:hover,
.btn-resolve:hover {
  background: #16a34a;
}

.btn-reject,
.btn-cancel {
  background: var(--accent-red);
  color: white;
}

.btn-reject:hover,
.btn-cancel:hover {
  background: #dc2626;
}

.btn-progress {
  background: var(--accent-blue);
  color: white;
}

.btn-progress:hover {
  background: #2563eb;
}

.btn-acknowledge {
  background: var(--accent-gold);
  color: #000;
}

.btn-acknowledge:hover {
  background: #b8982e;
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

/* ===== MOBILE RESPONSIVE STYLES ===== */

/* Hamburger Button */
.hamburger-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

.hamburger-btn:hover {
  background-color: var(--bg-secondary);
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* Mobile Sidebar */
.mobile-sidebar {
  display: none;
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border-color);
  z-index: 999;
  transition: left 0.3s ease;
  flex-direction: column;
}

.mobile-sidebar.open {
  left: 0;
}

.mobile-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.close-menu-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius);
}

.close-menu-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.mobile-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s;
}

.mobile-nav-link:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.mobile-nav-link.router-link-active {
  background-color: rgba(201, 169, 98, 0.15);
  color: var(--accent-primary);
}

.mobile-sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mobile-user-info .user-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.mobile-logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

/* Mobile Breakpoint */
@media (max-width: 768px) {
  .hamburger-btn {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .mobile-sidebar {
    display: flex;
  }

  .desktop-nav {
    display: none !important;
  }

  .header-right {
    display: none;
  }

  .header {
    padding: 12px 16px;
  }

  .header-left {
    gap: 8px;
  }

  .header-logo {
    height: 28px;
  }

  .logo-badge {
    font-size: 9px;
    padding: 3px 6px;
  }

  .filter-section {
    padding: 0.75rem 1rem;
  }

  .filter-tabs {
    gap: 0.5rem;
  }

  .filter-tabs button {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .page-content {
    padding: 1rem;
  }

  .request-card {
    padding: 1rem;
  }

  .card-title {
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .type-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }

  .request-header {
    flex-direction: column;
    gap: 1rem;
  }

  .user-info-card {
    width: 100%;
  }

  .status-badge {
    align-self: flex-start;
  }

  .projects-section {
    padding: 0.75rem;
  }

  .absence-date-box {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .request-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn-approve,
  .btn-reject,
  .btn-progress,
  .btn-resolve,
  .btn-cancel,
  .btn-acknowledge {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: calc(50% - 0.25rem);
    justify-content: center;
  }

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }

  .video-control {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .header-logo {
    height: 24px;
  }

  .logo-badge {
    font-size: 8px;
    padding: 2px 5px;
  }

  .filter-tabs button {
    padding: 0.35rem 0.6rem;
    font-size: 0.75rem;
  }

  .page-content {
    padding: 0.75rem;
  }

  .request-card {
    padding: 0.75rem;
  }

  .user-avatar-card {
    width: 40px;
    height: 40px;
    font-size: 0.875rem;
  }

  .user-name-card {
    font-size: 0.875rem;
  }

  .user-email,
  .user-phone {
    font-size: 0.75rem;
  }

  .btn-approve,
  .btn-reject,
  .btn-progress,
  .btn-resolve,
  .btn-cancel,
  .btn-acknowledge {
    width: 100%;
    min-width: 100%;
  }

  .modal-content {
    margin: 0.5rem;
    padding: 1rem;
  }
}
</style>
