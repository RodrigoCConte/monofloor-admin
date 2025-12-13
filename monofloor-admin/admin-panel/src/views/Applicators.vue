<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { applicatorsApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const applicators = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadApplicators = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await applicatorsApi.getAll(params);
    applicators.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading applicators:', error);
  } finally {
    loading.value = false;
  }
};

const approveApplicator = async (id: string) => {
  try {
    await applicatorsApi.approve(id);
    await loadApplicators();
  } catch (error) {
    console.error('Error approving applicator:', error);
  }
};

const rejectApplicator = async (id: string) => {
  const reason = prompt('Motivo da rejeicao:');
  if (reason) {
    try {
      await applicatorsApi.reject(id, reason);
      await loadApplicators();
    } catch (error) {
      console.error('Error rejecting applicator:', error);
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'var(--accent-green)';
    case 'PENDING_APPROVAL': return 'var(--accent-orange)';
    case 'REJECTED': return 'var(--accent-red)';
    case 'SUSPENDED': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'Aprovado';
    case 'PENDING_APPROVAL': return 'Pendente';
    case 'REJECTED': return 'Rejeitado';
    case 'SUSPENDED': return 'Suspenso';
    default: return status;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'APLICADOR_1': return 'Aplicador I';
    case 'APLICADOR_2': return 'Aplicador II';
    case 'APLICADOR_3': return 'Aplicador III';
    case 'LIDER': return 'Lider';
    default: return role;
  }
};

onMounted(loadApplicators);
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
          <h2>Aplicadores</h2>
          <p class="page-subtitle">Gerencie sua equipe de aplicadores</p>
        </div>
        <div class="filters">
          <select v-model="filter" @change="loadApplicators" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="PENDING_APPROVAL">Pendentes</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando aplicadores...</span>
      </div>

      <div v-else-if="applicators.length === 0" class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>Nenhum aplicador encontrado</p>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Aplicador</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>XP</th>
              <th>m² Aplicados</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in applicators" :key="app.id">
              <td>
                <div class="applicator-info">
                  <div class="applicator-avatar">
                    {{ app.name?.charAt(0) || '?' }}
                  </div>
                  <div class="applicator-details">
                    <strong>{{ app.name }}</strong>
                    <span class="applicator-email">{{ app.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge">{{ getRoleLabel(app.role) }}</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :style="{
                    background: getStatusColor(app.status) + '20',
                    color: getStatusColor(app.status),
                    borderColor: getStatusColor(app.status) + '40'
                  }"
                >
                  {{ getStatusLabel(app.status) }}
                </span>
              </td>
              <td>
                <div class="xp-display">
                  <svg class="xp-icon" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{{ app.xpTotal || 0 }}</span>
                </div>
              </td>
              <td>
                <span class="m2-value">{{ app.totalM2Applied?.toLocaleString() || 0 }} m²</span>
              </td>
              <td>
                <div class="actions">
                  <button
                    v-if="app.status === 'PENDING_APPROVAL'"
                    @click="approveApplicator(app.id)"
                    class="btn btn-approve"
                    title="Aprovar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aprovar
                  </button>
                  <button
                    v-if="app.status === 'PENDING_APPROVAL'"
                    @click="rejectApplicator(app.id)"
                    class="btn btn-reject"
                    title="Rejeitar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Rejeitar
                  </button>
                  <span v-if="app.status !== 'PENDING_APPROVAL'" class="no-actions">-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
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

.filter-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filter-select option {
  background: var(--bg-card);
  color: var(--text-primary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
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

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
}

.table-container {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tbody tr {
  transition: background 0.2s;
}

.table tbody tr:hover {
  background: var(--bg-card-hover);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.applicator-info {
  display: flex;
  align-items: center;
  gap: 12px;
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
  font-size: 16px;
  color: #000;
}

.applicator-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicator-details strong {
  color: var(--text-primary);
  font-size: 14px;
}

.applicator-email {
  font-size: 12px;
  color: var(--text-tertiary);
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.xp-display {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-primary);
  font-weight: 600;
}

.xp-icon {
  width: 16px;
  height: 16px;
}

.m2-value {
  color: var(--text-primary);
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-approve {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.btn-approve:hover {
  background: rgba(34, 197, 94, 0.2);
}

.btn-reject {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-reject:hover {
  background: rgba(239, 68, 68, 0.2);
}

.no-actions {
  color: var(--text-tertiary);
}
</style>
