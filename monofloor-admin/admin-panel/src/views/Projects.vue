<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { projectsApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const projects = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const deleting = ref<string | null>(null);
const showDeleteModal = ref(false);
const projectToDelete = ref<any>(null);
const deletingAll = ref(false);
const showDeleteAllModal = ref(false);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadProjects = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await projectsApi.getAll(params);
    projects.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading projects:', error);
  } finally {
    loading.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await projectsApi.getTemplate();
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_projetos.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading template:', error);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importing.value = true;
  try {
    const response = await projectsApi.importExcel(file);
    alert(`Importacao concluida! ${response.data.data?.imported || 0} projetos importados.`);
    await loadProjects();
  } catch (error: any) {
    alert('Erro ao importar: ' + (error.response?.data?.error?.message || 'Erro desconhecido'));
  } finally {
    importing.value = false;
    target.value = '';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'var(--accent-green)';
    case 'AGUARDANDO_INICIO': return 'var(--accent-blue)';
    case 'PAUSADO': return 'var(--accent-orange)';
    case 'FINALIZADO': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'Em Execucao';
    case 'AGUARDANDO_INICIO': return 'Aguardando';
    case 'PAUSADO': return 'Pausado';
    case 'FINALIZADO': return 'Finalizado';
    default: return status;
  }
};

const openDeleteModal = (project: any) => {
  projectToDelete.value = project;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  projectToDelete.value = null;
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;

  deleting.value = projectToDelete.value.id;
  try {
    await projectsApi.delete(projectToDelete.value.id);
    await loadProjects();
    closeDeleteModal();
  } catch (error: any) {
    alert('Erro ao deletar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    deleting.value = null;
  }
};

const confirmDeleteAll = async () => {
  deletingAll.value = true;
  try {
    await projectsApi.deleteAll();
    await loadProjects();
    showDeleteAllModal.value = false;
  } catch (error: any) {
    alert('Erro ao deletar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    deletingAll.value = false;
  }
};

onMounted(loadProjects);
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
          <h2>Projetos</h2>
          <p class="page-subtitle">Gerencie seus projetos e obras</p>
        </div>
        <div class="header-actions">
          <select v-model="filter" @change="loadProjects" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="EM_EXECUCAO">Em Execucao</option>
            <option value="AGUARDANDO_INICIO">Aguardando</option>
            <option value="PAUSADO">Pausado</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
          <button @click="downloadTemplate" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar Template
          </button>
          <button
            v-if="projects.length > 0"
            @click="showDeleteAllModal = true"
            class="btn btn-danger-outline"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Deletar Todos
          </button>
          <button @click="triggerFileInput" class="btn btn-primary" :disabled="importing">
            <svg v-if="!importing" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div v-else class="btn-spinner"></div>
            {{ importing ? 'Importando...' : 'Importar Excel' }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando projetos...</span>
      </div>

      <div v-else-if="projects.length === 0" class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Nenhum projeto encontrado</p>
        <span class="empty-hint">Importe projetos usando o botao acima</span>
      </div>

      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
          <div class="project-header">
            <h3>{{ project.title }}</h3>
            <div class="project-actions">
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(project.status) + '20',
                  color: getStatusColor(project.status),
                  borderColor: getStatusColor(project.status) + '40'
                }"
              >
                {{ getStatusLabel(project.status) }}
              </span>
              <button
                class="delete-btn"
                @click.stop="openDeleteModal(project)"
                title="Deletar projeto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="project-client">
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {{ project.cliente || 'Cliente nao informado' }}
          </div>
          <div class="project-address">
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ project.endereco || 'Endereco nao informado' }}
          </div>
          <div class="project-stats">
            <div class="stat">
              <div class="stat-icon stat-icon-m2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ project.m2Total?.toLocaleString() || 0 }}</span>
                <span class="stat-label">m² Total</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon stat-icon-hours">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ project.workedHours?.toFixed(1) || 0 }}h</span>
                <span class="stat-label">Trabalhadas</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon stat-icon-team">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ project._count?.assignments || 0 }}</span>
                <span class="stat-label">Equipe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Confirmar Exclusao</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o projeto <strong>{{ projectToDelete?.title }}</strong>?</p>
          <p class="modal-warning">Esta acao nao pode ser desfeita. Todos os dados relacionados (check-ins, relatorios, documentos) serao removidos.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">Cancelar</button>
          <button
            class="btn btn-danger"
            @click="confirmDelete"
            :disabled="deleting === projectToDelete?.id"
          >
            <div v-if="deleting === projectToDelete?.id" class="btn-spinner"></div>
            {{ deleting === projectToDelete?.id ? 'Excluindo...' : 'Excluir Projeto' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Confirmation Modal -->
    <div v-if="showDeleteAllModal" class="modal-overlay" @click="showDeleteAllModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon modal-icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Deletar TODOS os Projetos</h3>
        </div>
        <div class="modal-body">
          <p>Voce esta prestes a excluir <strong>{{ projects.length }} projetos</strong>.</p>
          <p class="modal-warning">ATENCAO: Esta acao ira remover TODOS os projetos e seus dados relacionados (check-ins, relatorios, documentos). Esta acao NAO pode ser desfeita!</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteAllModal = false">Cancelar</button>
          <button
            class="btn btn-danger"
            @click="confirmDeleteAll"
            :disabled="deletingAll"
          >
            <div v-if="deletingAll" class="btn-spinner"></div>
            {{ deletingAll ? 'Excluindo...' : 'Sim, Deletar Todos' }}
          </button>
        </div>
      </div>
    </div>
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

.filter-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 160px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filter-select option {
  background: var(--bg-card);
  color: var(--text-primary);
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

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  gap: 12px;
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

.empty-hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  transition: all 0.2s;
}

.project-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.project-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.status-badge {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

.project-client,
.project-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.project-address {
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 20px;
}

.info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.project-stats {
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 18px;
  height: 18px;
}

.stat-icon-m2 {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.stat-icon-hours {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.stat-icon-team {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Project Actions */
.project-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.project-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: var(--accent-red);
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
}

.modal-icon {
  width: 24px;
  height: 24px;
  color: var(--accent-orange);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.modal-body p:last-child {
  margin-bottom: 0;
}

.modal-warning {
  color: var(--accent-red) !important;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: var(--border-radius);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 13px !important;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
}

.btn-danger {
  background: var(--accent-red);
  color: #fff;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-danger .btn-spinner {
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
}

.btn-danger-outline {
  background: transparent;
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
}

.btn-danger-outline:hover {
  background: rgba(239, 68, 68, 0.1);
}

.modal-icon-danger {
  color: var(--accent-red) !important;
}
</style>
