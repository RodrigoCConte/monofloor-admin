<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { reportsApi, projectsApi } from '../api';

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

const reports = ref<any[]>([]);
const projects = ref<any[]>([]);
const stats = ref<any>(null);
const loading = ref(true);
const pagination = ref({ page: 1, limit: 30, total: 0, totalPages: 0 });

// Filters
const statusFilter = ref('all');
const projectFilter = ref('all');
const dateFilter = ref('all');

// Modal state
const showDetailModal = ref(false);
const selectedReport = ref<any>(null);
const showPhotoModal = ref(false);
const selectedPhotoIndex = ref(0);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadProjects = async () => {
  try {
    const response = await projectsApi.getAll({ limit: 100 });
    projects.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading projects:', error);
  }
};

const loadStats = async () => {
  try {
    const response = await reportsApi.getStats();
    stats.value = response.data.data;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const loadReports = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    if (projectFilter.value !== 'all') {
      params.projectId = projectFilter.value;
    }

    if (dateFilter.value !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter.value) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date();
      }
      params.startDate = startDate.toISOString();
    }

    const response = await reportsApi.getAll(params);
    reports.value = response.data.data?.reports || [];
    pagination.value = { ...pagination.value, ...response.data.data?.pagination };
  } catch (error) {
    console.error('Error loading reports:', error);
  } finally {
    loading.value = false;
  }
};

const openReportDetail = async (report: any) => {
  try {
    const response = await reportsApi.getById(report.id);
    selectedReport.value = response.data.data;
    showDetailModal.value = true;
  } catch (error) {
    console.error('Error loading report detail:', error);
    selectedReport.value = report;
    showDetailModal.value = true;
  }
};

const markAsProcessed = async (reportId: string) => {
  try {
    await reportsApi.update(reportId, { status: 'PROCESSED' });
    await loadReports();
    await loadStats();
    if (selectedReport.value?.id === reportId) {
      selectedReport.value.status = 'PROCESSED';
    }
  } catch (error) {
    console.error('Error updating report:', error);
    alert('Erro ao atualizar relatorio');
  }
};

const openPhotoModal = (index: number) => {
  selectedPhotoIndex.value = index;
  showPhotoModal.value = true;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PROCESSED': return 'var(--accent-green)';
    case 'SUBMITTED': return 'var(--accent-blue)';
    case 'DRAFT': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PROCESSED': return 'Processado';
    case 'SUBMITTED': return 'Enviado';
    case 'DRAFT': return 'Rascunho';
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

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (hours: number | null) => {
  if (!hours) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
};

const resetFilters = () => {
  statusFilter.value = 'all';
  projectFilter.value = 'all';
  dateFilter.value = 'all';
  pagination.value.page = 1;
  loadReports();
};

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage;
    loadReports();
  }
};

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await Promise.all([loadReports(), loadProjects(), loadStats()]);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="reports-page">
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          Relatorios
        </router-link>
        <router-link to="/contributions" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/help-requests" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Ajuda/Material
        </router-link>
        <router-link to="/campaigns" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/academy" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
          </svg>
          Academia
        </router-link>
        <router-link to="/map" class="mobile-nav-link" @click="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
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

    <!-- Stats Cards -->
    <div class="stats-section" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalReports }}</span>
          <span class="stat-label">Total de Relatorios</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayReports }}</span>
          <span class="stat-label">Hoje</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.weekReports }}</span>
          <span class="stat-label">Ultima Semana</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.reportsWithAudio }}</span>
          <span class="stat-label">Com Audio</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.reportsWithPhotos }}</span>
          <span class="stat-label">Com Fotos</span>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="statusFilter" @change="loadReports()">
          <option value="all">Todos</option>
          <option value="SUBMITTED">Enviados</option>
          <option value="PROCESSED">Processados</option>
          <option value="DRAFT">Rascunhos</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Projeto:</label>
        <select v-model="projectFilter" @change="loadReports()">
          <option value="all">Todos os Projetos</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.cliente || project.title }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Periodo:</label>
        <select v-model="dateFilter" @change="loadReports()">
          <option value="all">Todos</option>
          <option value="today">Hoje</option>
          <option value="week">Ultima Semana</option>
          <option value="month">Ultimo Mes</option>
        </select>
      </div>
      <button class="btn-reset" @click="resetFilters">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
        Limpar
      </button>
    </div>

    <!-- Content -->
    <div class="page-content">
      <div v-if="loading" class="loading">Carregando relatorios...</div>

      <div v-else-if="reports.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Nenhum relatorio encontrado</p>
      </div>

      <div v-else class="reports-grid">
        <div v-for="report in reports" :key="report.id" class="report-card" @click="openReportDetail(report)">
          <!-- Card Header -->
          <div class="card-header">
            <div class="user-section">
              <div class="user-avatar-sm">
                <img v-if="getPhotoUrl(report.user?.photoUrl)" :src="getPhotoUrl(report.user?.photoUrl)" :alt="report.user?.name" />
                <span v-else>{{ getInitials(report.user?.name) }}</span>
              </div>
              <div class="user-details">
                <span class="user-name">{{ report.user?.name || 'Sem nome' }}</span>
                <span class="user-role">{{ report.user?.role }}</span>
              </div>
            </div>
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(report.status) }">
              {{ getStatusLabel(report.status) }}
            </div>
          </div>

          <!-- Project Info -->
          <div class="project-info" v-if="report.project">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ report.project?.cliente || report.project?.title }}</span>
          </div>

          <!-- Report Content Preview -->
          <div class="report-preview">
            <div class="preview-text" v-if="report.notes || report.audioTranscription">
              {{ (report.notes || report.audioTranscription || '').substring(0, 150) }}{{ (report.notes || report.audioTranscription || '').length > 150 ? '...' : '' }}
            </div>
            <div class="preview-empty" v-else>
              <em>Sem descricao</em>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags" v-if="report.tags && report.tags.length > 0">
            <span v-for="tag in report.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            <span v-if="report.tags.length > 3" class="tag more">+{{ report.tags.length - 3 }}</span>
          </div>

          <!-- Media Indicators -->
          <div class="media-indicators">
            <span class="indicator" v-if="report.audioFileUrl" title="Possui audio">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            </span>
            <span class="indicator" v-if="report.photos && report.photos.length > 0" title="Possui fotos">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {{ report.photos.length }}
            </span>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <span class="date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDateShort(report.reportDate) }} {{ formatTime(report.reportDate) }}
            </span>
            <span class="checkin-info" v-if="report.checkin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ formatDuration(report.checkin?.hoursWorked) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="page-info">
          Pagina {{ pagination.page }} de {{ pagination.totalPages }}
        </span>
        <button :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedReport" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>Detalhes do Relatorio</h3>
          <button class="close-btn" @click="showDetailModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- User Info -->
          <div class="detail-section">
            <div class="user-header">
              <div class="user-avatar-lg">
                <img v-if="getPhotoUrl(selectedReport.user?.photoUrl)" :src="getPhotoUrl(selectedReport.user?.photoUrl)" :alt="selectedReport.user?.name" />
                <span v-else>{{ getInitials(selectedReport.user?.name) }}</span>
              </div>
              <div class="user-info-detail">
                <span class="name">{{ selectedReport.user?.name }}</span>
                <span class="email">{{ selectedReport.user?.email }}</span>
                <span class="phone" v-if="selectedReport.user?.phone">{{ selectedReport.user.phone }}</span>
              </div>
              <div class="status-badge" :style="{ backgroundColor: getStatusColor(selectedReport.status) }">
                {{ getStatusLabel(selectedReport.status) }}
              </div>
            </div>
          </div>

          <!-- Project Info -->
          <div class="detail-section" v-if="selectedReport.project">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Projeto
            </h4>
            <div class="project-detail">
              <span class="project-title">{{ selectedReport.project?.cliente || selectedReport.project?.title }}</span>
              <span class="project-address" v-if="selectedReport.project?.endereco">{{ selectedReport.project.endereco }}</span>
            </div>
          </div>

          <!-- Check-in Info -->
          <div class="detail-section" v-if="selectedReport.checkin">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Sessao de Trabalho
            </h4>
            <div class="checkin-detail">
              <div class="checkin-row">
                <span class="label">Check-in:</span>
                <span class="value">{{ formatDate(selectedReport.checkin.checkinAt) }}</span>
              </div>
              <div class="checkin-row" v-if="selectedReport.checkin.checkoutAt">
                <span class="label">Checkout:</span>
                <span class="value">{{ formatDate(selectedReport.checkin.checkoutAt) }}</span>
              </div>
              <div class="checkin-row" v-if="selectedReport.checkin.hoursWorked">
                <span class="label">Duracao:</span>
                <span class="value highlight">{{ formatDuration(selectedReport.checkin.hoursWorked) }}</span>
              </div>
            </div>
          </div>

          <!-- Date Info -->
          <div class="detail-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Data do Relatorio
            </h4>
            <span class="date-value">{{ formatDate(selectedReport.reportDate) }}</span>
          </div>

          <!-- Tags -->
          <div class="detail-section" v-if="selectedReport.tags && selectedReport.tags.length > 0">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Tags
            </h4>
            <div class="tags-list">
              <span v-for="tag in selectedReport.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="detail-section" v-if="selectedReport.notes">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Notas
            </h4>
            <div class="notes-content">
              {{ selectedReport.notes }}
            </div>
          </div>

          <!-- Audio Transcription -->
          <div class="detail-section" v-if="selectedReport.audioTranscription">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
              </svg>
              Transcricao do Audio
            </h4>
            <div class="transcription-content">
              {{ selectedReport.audioTranscription }}
            </div>
          </div>

          <!-- Audio Player -->
          <div class="detail-section" v-if="selectedReport.audioFileUrl">
            <h4>Audio Original</h4>
            <audio controls :src="getPhotoUrl(selectedReport.audioFileUrl)" class="audio-player"></audio>
            <span class="audio-duration" v-if="selectedReport.audioDurationSeconds">
              Duracao: {{ Math.floor(selectedReport.audioDurationSeconds / 60) }}:{{ String(selectedReport.audioDurationSeconds % 60).padStart(2, '0') }}
            </span>
          </div>

          <!-- Photos -->
          <div class="detail-section" v-if="selectedReport.photos && selectedReport.photos.length > 0">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Fotos ({{ selectedReport.photos.length }})
            </h4>
            <div class="photos-grid">
              <div
                v-for="(photo, index) in selectedReport.photos"
                :key="photo.id"
                class="photo-item"
                @click="openPhotoModal(index)"
              >
                <img :src="getPhotoUrl(photo.url)" :alt="`Foto ${index + 1}`" />
              </div>
            </div>
          </div>

          <!-- AI Summary -->
          <div class="detail-section" v-if="selectedReport.aiSummary">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Resumo AI
            </h4>
            <div class="ai-summary">
              {{ selectedReport.aiSummary }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="selectedReport.status === 'SUBMITTED'"
            class="btn-primary"
            @click="markAsProcessed(selectedReport.id)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Marcar como Processado
          </button>
          <button class="btn-secondary" @click="showDetailModal = false">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Photo Modal -->
    <div v-if="showPhotoModal && selectedReport" class="photo-modal-overlay" @click="showPhotoModal = false">
      <div class="photo-modal-content" @click.stop>
        <button class="photo-nav prev" @click="selectedPhotoIndex = Math.max(0, selectedPhotoIndex - 1)" :disabled="selectedPhotoIndex === 0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <img :src="getPhotoUrl(selectedReport.photos[selectedPhotoIndex]?.url)" class="photo-full" />
        <button class="photo-nav next" @click="selectedPhotoIndex = Math.min(selectedReport.photos.length - 1, selectedPhotoIndex + 1)" :disabled="selectedPhotoIndex === selectedReport.photos.length - 1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <div class="photo-counter">{{ selectedPhotoIndex + 1 }} / {{ selectedReport.photos.length }}</div>
        <button class="photo-close" @click="showPhotoModal = false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
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

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.stat-icon.green {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
}

.stat-icon.purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.stat-icon.orange {
  background: rgba(249, 115, 22, 0.1);
  color: var(--accent-orange);
}

.stat-icon.gold {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-gold);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Filter Section */
.filter-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.filter-group select {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 180px;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Page Content */
.page-content {
  padding: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Reports Grid */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.report-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.report-card:hover {
  border-color: var(--accent-gold);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
}

.user-avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-details .user-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.user-details .user-role {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--accent-gold);
  font-size: 0.875rem;
  font-weight: 500;
}

.report-preview {
  padding: 0.75rem 0;
  min-height: 60px;
}

.preview-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-empty {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.tag.more {
  background: var(--accent-gold);
  color: #000;
}

.media-indicators {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-color);
}

.indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.card-footer .date,
.card-footer .checkin-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar-lg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  overflow: hidden;
}

.user-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info-detail {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-info-detail .name {
  font-weight: 600;
  font-size: 1.125rem;
}

.user-info-detail .email {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.user-info-detail .phone {
  color: var(--accent-blue);
  font-size: 0.875rem;
}

.project-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-title {
  font-weight: 600;
  color: var(--accent-gold);
}

.project-address {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.checkin-detail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkin-row {
  display: flex;
  gap: 0.5rem;
}

.checkin-row .label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.checkin-row .value {
  font-size: 0.875rem;
}

.checkin-row .value.highlight {
  color: var(--accent-gold);
  font-weight: 600;
}

.date-value {
  font-size: 0.875rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.notes-content,
.transcription-content,
.ai-summary {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.transcription-content {
  border-left: 3px solid var(--accent-blue);
}

.ai-summary {
  border-left: 3px solid var(--accent-gold);
}

.audio-player {
  width: 100%;
  margin-top: 0.5rem;
}

.audio-duration {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.5rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-gold);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #d4b56a;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-card);
}

/* Photo Modal */
.photo-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.photo-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.photo-full {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.photo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  padding: 1rem;
  cursor: pointer;
  border-radius: 8px;
}

.photo-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.photo-nav.prev {
  left: -60px;
}

.photo-nav.next {
  right: -60px;
}

.photo-counter {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 0.875rem;
}

.photo-close {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-section {
    flex-wrap: wrap;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile Responsiveness */
.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.hamburger-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

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
  flex-direction: column;
  transition: left 0.3s ease;
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

  .stats-section {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-icon svg {
    width: 20px;
    height: 20px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .filter-section {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .filter-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group select {
    width: 100%;
  }

  .btn-reset {
    width: 100%;
    margin-left: 0;
    justify-content: center;
  }

  .page-content {
    padding: 16px;
  }

  .reports-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .report-card {
    padding: 1rem;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    max-height: 85vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 12px;
    gap: 12px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-icon svg {
    width: 18px;
    height: 18px;
  }

  .stat-value {
    font-size: 1.125rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .report-card {
    padding: 0.875rem;
  }

  .card-header {
    margin-bottom: 0.75rem;
  }

  .user-avatar-sm {
    width: 36px;
    height: 36px;
    font-size: 0.75rem;
  }

  .status-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.6rem;
  }
}
</style>
