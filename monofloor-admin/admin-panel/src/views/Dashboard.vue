<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { dashboardApi } from '../api';

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

const stats = ref<any>(null);
const topApplicators = ref<any[]>([]);
const onlineApplicators = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [statsRes, topRes, onlineRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getTopApplicators(),
      dashboardApi.getOnlineApplicators(),
    ]);

    stats.value = statsRes.data.data;
    topApplicators.value = topRes.data.data || [];
    onlineApplicators.value = onlineRes.data.data || [];
  } catch (err: any) {
    console.error('Error loading dashboard:', err);
    error.value = err.response?.data?.error?.message || err.message || 'Erro ao carregar dashboard';
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"/>
            <rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/>
            <rect x="3" y="16" width="7" height="5"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Aplicadores
        </router-link>
        <router-link to="/projects" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Projetos
        </router-link>
        <router-link to="/requests" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/campaigns" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/academy" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Academia
        </router-link>
        <router-link to="/map" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-avatar">
          <img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" />
          <span v-else>{{ getInitials(authStore.user?.name) }}</span>
        </div>
        <span class="user-name">{{ authStore.user?.name }}</span>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando...</span>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-message">{{ error }}</div>
        <button @click="loadData" class="retry-btn">Tentar novamente</button>
      </div>

      <template v-else>
        <section class="stats-section">
          <h2>Visao Geral</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.totalApplicators || 0 }}</div>
                <div class="stat-label">Aplicadores</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.activeProjects || 0 }}</div>
                <div class="stat-label">Projetos Ativos</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.pendingApprovals || 0 }}</div>
                <div class="stat-label">Aprovacoes Pendentes</div>
              </div>
            </div>
            <div class="stat-card gold">
              <div class="stat-icon gold">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.totalM2Applied?.toLocaleString() || 0 }} <span class="unit">m2</span></div>
                <div class="stat-label">Total Aplicado</div>
              </div>
            </div>
          </div>
        </section>

        <div class="two-columns">
          <section class="card">
            <div class="card-header">
              <h3>Top Aplicadores</h3>
              <span class="card-badge">Por m2 aplicados</span>
            </div>
            <div v-if="topApplicators.length === 0" class="empty">
              Nenhum aplicador encontrado
            </div>
            <ul v-else class="applicator-list">
              <li v-for="(app, index) in topApplicators" :key="app.id" class="applicator-item">
                <div class="rank">{{ index + 1 }}</div>
                <div class="applicator-avatar">
                  <img v-if="getPhotoUrl(app.photoUrl)" :src="getPhotoUrl(app.photoUrl)!" alt="Avatar" class="avatar-img" />
                  <span v-else>{{ getInitials(app.name) }}</span>
                </div>
                <div class="applicator-info">
                  <span class="applicator-name">{{ app.name }}</span>
                  <span class="applicator-role">{{ app.role }}</span>
                </div>
                <div class="applicator-stats">
                  <span class="m2-value">{{ app.totalM2Applied?.toLocaleString() || 0 }}</span>
                  <span class="m2-label">m2</span>
                </div>
              </li>
            </ul>
          </section>

          <section class="card">
            <div class="card-header">
              <h3>Aplicadores Online</h3>
              <span class="online-count" v-if="onlineApplicators.length">{{ onlineApplicators.length }} ativos</span>
            </div>
            <div v-if="onlineApplicators.length === 0" class="empty">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              Nenhum aplicador online no momento
            </div>
            <ul v-else class="applicator-list">
              <li v-for="app in onlineApplicators" :key="app.checkinId" class="applicator-item">
                <div class="applicator-avatar online">
                  <img v-if="getPhotoUrl(app.user?.photoUrl)" :src="getPhotoUrl(app.user?.photoUrl)!" alt="Avatar" class="avatar-img" />
                  <span v-else>{{ getInitials(app.user?.name) }}</span>
                </div>
                <div class="applicator-info">
                  <span class="applicator-name">{{ app.user?.name || 'Sem nome' }}</span>
                  <span class="project-tag">{{ app.project?.title || 'Sem projeto' }}</span>
                </div>
                <div class="online-indicator">
                  <span class="online-dot"></span>
                  Online
                </div>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.header {
  background-color: var(--bg-card);
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
  background-color: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  gap: 4px;
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

.nav-link svg {
  flex-shrink: 0;
}

.nav-link:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-link.router-link-active {
  background-color: rgba(201, 169, 98, 0.15);
  color: var(--accent-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

.main {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: var(--text-secondary);
  gap: 16px;
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

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  gap: 20px;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  padding: 16px 24px;
  border-radius: var(--border-radius);
  font-size: 14px;
  text-align: center;
}

.retry-btn {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.stats-section h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 24px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--text-tertiary);
}

.stat-card.gold {
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.1), rgba(201, 169, 98, 0.05));
  border-color: rgba(201, 169, 98, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background-color: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
}

.stat-icon.green {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--accent-green);
}

.stat-icon.orange {
  background-color: rgba(249, 115, 22, 0.15);
  color: var(--accent-orange);
}

.stat-icon.gold {
  background-color: rgba(201, 169, 98, 0.15);
  color: var(--accent-primary);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 2px;
}

.two-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 24px;
  border-radius: var(--border-radius-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.card-badge {
  font-size: 11px;
  color: var(--text-tertiary);
  background-color: var(--bg-secondary);
  padding: 4px 10px;
  border-radius: 10px;
}

.online-count {
  font-size: 12px;
  color: var(--accent-green);
  background-color: rgba(34, 197, 94, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
}

.empty {
  color: var(--text-tertiary);
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.applicator-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.applicator-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

.applicator-item:hover {
  background-color: var(--bg-card-hover);
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.applicator-item:first-child .rank {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.applicator-avatar {
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
  overflow: hidden;
  flex-shrink: 0;
}

.applicator-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.applicator-avatar.online {
  position: relative;
}

.applicator-avatar.online::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: var(--accent-green);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.applicator-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicator-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.applicator-role {
  font-size: 12px;
  color: var(--text-tertiary);
}

.project-tag {
  font-size: 11px;
  color: var(--accent-primary);
  background-color: rgba(201, 169, 98, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.applicator-stats {
  text-align: right;
}

.m2-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
}

.m2-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-left: 2px;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--accent-green);
}

.online-dot {
  width: 8px;
  height: 8px;
  background-color: var(--accent-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
