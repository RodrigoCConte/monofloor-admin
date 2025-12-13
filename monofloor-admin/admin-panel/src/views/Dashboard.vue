<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { dashboardApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const stats = ref<any>(null);
const topApplicators = ref<any[]>([]);
const onlineApplicators = ref<any[]>([]);
const loading = ref(true);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadData = async () => {
  try {
    const [statsRes, topRes, onlineRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getTopApplicators(),
      dashboardApi.getOnlineApplicators(),
    ]);

    stats.value = statsRes.data.data;
    topApplicators.value = topRes.data.data || [];
    onlineApplicators.value = onlineRes.data.data || [];
  } catch (error) {
    console.error('Error loading dashboard:', error);
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
        <span class="logo">MONOFLOOR</span>
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/applicators" class="nav-link">Aplicadores</router-link>
        <router-link to="/projects" class="nav-link">Projetos</router-link>
        <router-link to="/map" class="nav-link">Mapa</router-link>
      </nav>
      <div class="header-right">
        <div class="user-avatar">{{ authStore.user?.name?.charAt(0) || 'A' }}</div>
        <span class="user-name">{{ authStore.user?.name }}</span>
        <button @click="logout" class="logout-btn">Sair</button>
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando...</span>
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
                <div class="applicator-avatar">{{ app.name?.charAt(0) || '?' }}</div>
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
              <li v-for="app in onlineApplicators" :key="app.id" class="applicator-item">
                <div class="applicator-avatar online">{{ app.name?.charAt(0) || '?' }}</div>
                <div class="applicator-info">
                  <span class="applicator-name">{{ app.name }}</span>
                  <span class="project-tag">{{ app.currentProject || 'Sem projeto' }}</span>
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

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 2px;
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
  padding: 10px 20px;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
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
