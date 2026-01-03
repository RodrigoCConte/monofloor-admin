<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { contributionsApi } from '../api';

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

const contributions = ref<any[]>([]);
const loading = ref(true);
const filter = ref('PENDING');

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadContributions = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await contributionsApi.getAll(params);
    contributions.value = response.data.data?.requests || [];
  } catch (error) {
    console.error('Error loading contributions:', error);
  } finally {
    loading.value = false;
  }
};

const approveContribution = async (id: string) => {
  try {
    await contributionsApi.approve(id);
    await loadContributions();
  } catch (error) {
    console.error('Error approving contribution:', error);
    alert('Erro ao aprovar solicitacao');
  }
};

const rejectContribution = async (id: string) => {
  if (confirm('Tem certeza que deseja rejeitar esta solicitacao?')) {
    try {
      await contributionsApi.reject(id);
      await loadContributions();
    } catch (error) {
      console.error('Error rejecting contribution:', error);
      alert('Erro ao rejeitar solicitacao');
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'var(--accent-green)';
    case 'PENDING': return 'var(--accent-orange)';
    case 'REJECTED': return 'var(--accent-red)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'Aprovado';
    case 'PENDING': return 'Pendente';
    case 'REJECTED': return 'Rejeitado';
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

onMounted(() => {
  window.addEventListener('resize', handleResize);
  loadContributions();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="contributions-page">
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

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        :class="{ active: filter === 'PENDING' }"
        @click="filter = 'PENDING'; loadContributions()"
      >
        Pendentes
      </button>
      <button
        :class="{ active: filter === 'APPROVED' }"
        @click="filter = 'APPROVED'; loadContributions()"
      >
        Aprovados
      </button>
      <button
        :class="{ active: filter === 'REJECTED' }"
        @click="filter = 'REJECTED'; loadContributions()"
      >
        Rejeitados
      </button>
      <button
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'; loadContributions()"
      >
        Todos
      </button>
    </div>

    <!-- Content -->
    <div class="page-content">
      <div v-if="loading" class="loading">Carregando...</div>

      <div v-else-if="contributions.length === 0" class="empty-state">
        Nenhuma solicitacao encontrada
      </div>

      <div v-else class="contributions-list">
        <div v-for="contribution in contributions" :key="contribution.id" class="contribution-card">
          <!-- Card Title -->
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            INCLUSAO EM NOVO PROJETO
          </div>

          <div class="contribution-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="getPhotoUrl(contribution.user?.photoUrl)" :src="getPhotoUrl(contribution.user?.photoUrl)" :alt="contribution.user?.name" />
                <span v-else>{{ getInitials(contribution.user?.name) }}</span>
              </div>
              <div class="user-details">
                <span class="user-name">{{ contribution.user?.name || 'Sem nome' }}</span>
                <span class="user-email">{{ contribution.user?.email }}</span>
              </div>
            </div>
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(contribution.status) }">
              {{ getStatusLabel(contribution.status) }}
            </div>
          </div>

          <div class="contribution-body">
            <!-- Projects Section -->
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
                <div class="project-value">{{ contribution.project?.title || contribution.project?.cliente || 'Sem nome' }}</div>
              </div>
              <div class="project-row current">
                <div class="project-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Projeto Atual (check-in):
                </div>
                <div class="project-value" :class="{ 'no-project': !contribution.user?.currentProject }">
                  {{ contribution.user?.currentProject ? (contribution.user.currentProject.title || contribution.user.currentProject.cliente) : 'Sem check-in ativo' }}
                </div>
              </div>
            </div>

            <div class="project-address" v-if="contribution.project?.endereco">
              <span class="label">Endereco do projeto solicitado:</span>
              <span class="value">{{ contribution.project?.endereco }}</span>
            </div>
            <div class="description" v-if="contribution.description">
              <span class="label">Motivo:</span>
              <span class="value">{{ contribution.description }}</span>
            </div>
            <div class="dates">
              <span class="date-item">
                <span class="label">Solicitado em:</span>
                <span class="value">{{ formatDate(contribution.createdAt) }}</span>
              </span>
              <span class="date-item" v-if="contribution.reviewedAt">
                <span class="label">Revisado em:</span>
                <span class="value">{{ formatDate(contribution.reviewedAt) }}</span>
              </span>
            </div>
          </div>

          <div class="contribution-actions" v-if="contribution.status === 'PENDING'">
            <button class="btn-approve" @click="approveContribution(contribution.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Aprovar
            </button>
            <button class="btn-reject" @click="rejectContribution(contribution.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Rejeitar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contributions-page {
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

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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

.page-content {
  padding: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.contributions-list {
  display: grid;
  gap: 1rem;
}

.contribution-card {
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

.projects-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
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

.contribution-header {
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.contribution-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.project-info,
.project-address,
.description {
  display: flex;
  gap: 0.5rem;
}

.label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.value {
  font-size: 0.875rem;
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

.contribution-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-approve,
.btn-reject {
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

.btn-approve {
  background: var(--accent-green);
  color: white;
}

.btn-approve:hover {
  background: #16a34a;
}

.btn-reject {
  background: var(--accent-red);
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
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

/* Mobile Breakpoints */
@media (max-width: 1024px) {
  .nav-link {
    padding: 8px 12px;
    font-size: 13px;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
  }
}

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

  .filter-tabs {
    padding: 12px 16px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .filter-tabs button {
    white-space: nowrap;
    flex-shrink: 0;
    font-size: 14px;
  }

  .page-content {
    padding: 16px;
  }

  .contribution-card {
    padding: 16px;
  }

  .card-title {
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .contribution-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .status-badge {
    align-self: flex-end;
  }

  .projects-section {
    padding: 12px;
  }

  .project-value {
    font-size: 0.9rem;
    padding-left: 1rem;
  }

  .dates {
    flex-direction: column;
    gap: 0.5rem;
  }

  .contribution-actions {
    flex-direction: column;
  }

  .btn-approve,
  .btn-reject {
    width: 100%;
    justify-content: center;
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

  .filter-tabs {
    gap: 0.25rem;
    padding: 8px 12px;
  }

  .filter-tabs button {
    padding: 0.4rem 0.75rem;
    font-size: 13px;
  }

  .page-content {
    padding: 12px;
  }

  .contribution-card {
    padding: 12px;
  }

  .card-title {
    font-size: 0.75rem;
  }

  .card-title svg {
    width: 16px;
    height: 16px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .user-email {
    font-size: 0.8rem;
  }

  .project-label {
    font-size: 0.7rem;
  }

  .project-value {
    font-size: 0.85rem;
  }

  .label,
  .value {
    font-size: 0.8rem;
  }

  .date-item {
    font-size: 0.7rem;
  }
}
</style>
