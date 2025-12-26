<template>
  <div class="enterprise-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">Hub de Projetos</h1>
          <p class="module-subtitle">Visao Unificada de Todos os Modulos</p>
        </div>
        <div class="header-actions">
          <button class="btn-migrate" @click="showMigrationModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Migrar Dados
          </button>
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" v-model="searchQuery" placeholder="Buscar projetos..." />
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Overview -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card" v-for="(stat, index) in statsCards" :key="stat.module" :style="{ '--delay': index * 0.1 + 's' }">
          <div class="stat-header">
            <span class="stat-module" :style="{ color: stat.color }">{{ stat.module }}</span>
            <span class="stat-count">{{ stat.count }}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-fill" :style="{ width: stat.percentage + '%', background: stat.color }"></div>
          </div>
          <router-link :to="stat.route" class="stat-link">
            Ver modulo
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Pipeline Overview -->
    <section class="pipeline-section">
      <h2 class="section-title">Pipeline Geral</h2>
      <div class="pipeline-flow">
        <div class="pipeline-stage" v-for="(stage, index) in pipelineStages" :key="stage.module" :style="{ '--delay': index * 0.1 + 's' }">
          <div class="stage-header" :style="{ borderColor: stage.color }">
            <span class="stage-name">{{ stage.name }}</span>
            <span class="stage-count" :style="{ background: stage.color }">{{ stage.count }}</span>
          </div>
          <div class="stage-projects">
            <div class="project-mini" v-for="project in stage.projects.slice(0, 3)" :key="project.id" @click="openProjectDetail(project)">
              <span class="project-name">{{ project.cliente }}</span>
              <span class="project-value" v-if="project.valorEstimado">R$ {{ formatCurrency(project.valorEstimado) }}</span>
            </div>
            <div class="more-projects" v-if="stage.projects.length > 3">
              +{{ stage.projects.length - 3 }} projetos
            </div>
          </div>
          <div class="stage-arrow" v-if="index < pipelineStages.length - 1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="projects-section">
      <div class="section-header">
        <h2 class="section-title">Todos os Projetos</h2>
        <div class="filter-group">
          <select v-model="filterModule" class="filter-select">
            <option value="">Todos os modulos</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="PIUI">PIUI</option>
            <option value="PLANEJAMENTO">Planejamento</option>
            <option value="EXECUCAO">Execucao</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="POS_VENDA">Pos-Venda</option>
          </select>
        </div>
      </div>

      <div class="projects-grid">
        <div class="project-card" v-for="project in filteredProjects" :key="project.id" @click="openProjectDetail(project)">
          <div class="project-header">
            <span class="project-module" :style="{ background: getModuleColor(project.currentModule) }">
              {{ getModuleLabel(project.currentModule) }}
            </span>
            <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
          </div>
          <h3 class="project-name">{{ project.cliente }}</h3>
          <p class="project-address">{{ project.endereco || 'Sem endereco' }}</p>

          <div class="project-stats">
            <div class="stat-item" v-if="project.m2Total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              {{ project.m2Total }} m2
            </div>
            <div class="stat-item" v-if="project.valorEstimado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              R$ {{ formatCurrency(project.valorEstimado) }}
            </div>
          </div>

          <div class="project-progress">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: getModuleProgress(project.currentModule) + '%' }"></div>
            </div>
            <div class="progress-steps">
              <div class="step" v-for="mod in modules" :key="mod" :class="{ active: isModuleActive(project.currentModule, mod), completed: isModuleCompleted(project.currentModule, mod) }">
                <span class="step-dot"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="!filteredProjects.length && !loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        <p>Nenhum projeto encontrado</p>
      </div>
    </section>

    <!-- Project Detail Panel -->
    <Teleport to="body">
      <Transition name="panel">
        <div class="detail-panel-overlay" v-if="selectedProject" @click.self="closeProjectDetail">
          <div class="detail-panel large">
            <div class="panel-header">
              <div class="panel-title">
                <h2>{{ selectedProject.cliente }}</h2>
                <span class="module-badge" :style="{ background: getModuleColor(selectedProject.currentModule) }">
                  {{ getModuleLabel(selectedProject.currentModule) }}
                </span>
              </div>
              <button class="close-btn" @click="closeProjectDetail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="panel-content">
              <!-- Project Info -->
              <div class="panel-section">
                <h3>Informacoes do Projeto</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Cliente</label>
                    <span>{{ selectedProject.cliente }}</span>
                  </div>
                  <div class="info-item">
                    <label>Endereco</label>
                    <span>{{ selectedProject.endereco || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>M2 Total</label>
                    <span>{{ selectedProject.m2Total || '-' }} m2</span>
                  </div>
                  <div class="info-item">
                    <label>Valor Estimado</label>
                    <span class="value-highlight">R$ {{ formatCurrency(selectedProject.valorEstimado) }}</span>
                  </div>
                </div>
              </div>

              <!-- Module Progress -->
              <div class="panel-section">
                <h3>Progresso nos Modulos</h3>
                <div class="module-timeline">
                  <div class="timeline-item" v-for="(mod, index) in moduleDetails" :key="mod.id" :class="{ active: selectedProject.currentModule === mod.id, completed: isModuleCompleted(selectedProject.currentModule, mod.id) }">
                    <div class="timeline-connector" v-if="index > 0"></div>
                    <div class="timeline-content">
                      <div class="timeline-icon" :style="{ background: mod.color }">
                        <component :is="mod.icon" />
                      </div>
                      <div class="timeline-info">
                        <span class="timeline-name">{{ mod.name }}</span>
                        <span class="timeline-status">{{ getModuleStatus(selectedProject, mod.id) }}</span>
                      </div>
                      <router-link :to="`/${mod.route}`" class="timeline-link" v-if="selectedProject.currentModule === mod.id">
                        Ver
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Videos Section -->
              <div class="panel-section" v-if="selectedProject.videos?.length">
                <h3>Videos do Projeto ({{ selectedProject.videos.length }})</h3>
                <div class="videos-grid">
                  <div class="video-card" v-for="video in selectedProject.videos.slice(0, 4)" :key="video.id">
                    <div class="video-thumbnail">
                      <img :src="video.thumbnailUrl || '/video-placeholder.png'" :alt="video.titulo" />
                      <div class="video-duration">{{ formatDuration(video.duracao) }}</div>
                    </div>
                    <div class="video-info">
                      <span class="video-title">{{ video.titulo }}</span>
                      <span class="video-date">{{ formatDate(video.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timeline Section -->
              <div class="panel-section" v-if="selectedProject.timeline?.length">
                <h3>Historico de Eventos</h3>
                <div class="events-timeline">
                  <div class="event-item" v-for="event in selectedProject.timeline.slice(0, 10)" :key="event.id">
                    <div class="event-dot" :class="event.tipo.toLowerCase()"></div>
                    <div class="event-content">
                      <span class="event-title">{{ event.titulo }}</span>
                      <span class="event-desc" v-if="event.descricao">{{ event.descricao }}</span>
                      <span class="event-date">{{ formatDateTime(event.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <router-link :to="`/projects/${selectedProject.id}`" class="btn-view-project">
                Ver Projeto Completo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Migration Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div class="modal-overlay" v-if="showMigrationModal" @click.self="showMigrationModal = false">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Migrar Dados</h2>
              <button class="close-btn" @click="showMigrationModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="migration-info">Importe dados do Pipedrive e Pipefy para o sistema unificado.</p>

              <div class="migration-options">
                <div class="migration-option" :class="{ active: migrationSource === 'pipedrive' }" @click="migrationSource = 'pipedrive'">
                  <div class="option-icon pipedrive">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div class="option-info">
                    <span class="option-name">Pipedrive</span>
                    <span class="option-desc">Leads e Deals comerciais</span>
                  </div>
                </div>

                <div class="migration-option" :class="{ active: migrationSource === 'pipefy' }" @click="migrationSource = 'pipefy'">
                  <div class="option-icon pipefy">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2"/>
                    </svg>
                  </div>
                  <div class="option-info">
                    <span class="option-name">Pipefy</span>
                    <span class="option-desc">Operacoes e Pos-venda</span>
                  </div>
                </div>

                <div class="migration-option" :class="{ active: migrationSource === 'full' }" @click="migrationSource = 'full'">
                  <div class="option-icon full">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </div>
                  <div class="option-info">
                    <span class="option-name">Migracao Completa</span>
                    <span class="option-desc">Todos os dados de ambas plataformas</span>
                  </div>
                </div>
              </div>

              <div class="migration-status" v-if="migrationStatus">
                <div class="status-icon" :class="migrationStatus.type">
                  <svg v-if="migrationStatus.type === 'loading'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                  </svg>
                  <svg v-else-if="migrationStatus.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <span class="status-message">{{ migrationStatus.message }}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showMigrationModal = false">Cancelar</button>
              <button class="btn-migrate-action" @click="executeMigration" :disabled="!migrationSource || migrationLoading">
                {{ migrationLoading ? 'Migrando...' : 'Iniciar Migracao' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Loading -->
    <Transition name="fade">
      <div class="loading-overlay" v-if="loading">
        <div class="loader"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';

// Types
interface Project {
  id: string;
  cliente: string;
  endereco?: string;
  m2Total?: number;
  valorEstimado?: number;
  currentModule: string;
  updatedAt: string;
  comercialData?: any;
  contrato?: any;
  planejamento?: any;
  posVenda?: any;
  videos?: any[];
  timeline?: any[];
}

// State
const loading = ref(false);
const searchQuery = ref('');
const filterModule = ref('');
const projects = ref<Project[]>([]);
const selectedProject = ref<Project | null>(null);
const showMigrationModal = ref(false);
const migrationSource = ref<string>('');
const migrationLoading = ref(false);
const migrationStatus = ref<{ type: string; message: string } | null>(null);

const stats = ref({
  comercial: 0,
  piui: 0,
  planejamento: 0,
  execucao: 0,
  finalizado: 0,
  posVenda: 0
});

const modules = ['COMERCIAL', 'PIUI', 'PLANEJAMENTO', 'EXECUCAO', 'POS_VENDA'];

const moduleDetails = [
  { id: 'COMERCIAL', name: 'Comercial', color: '#c9a962', route: 'comercial', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), h('circle', { cx: '9', cy: '7', r: '4' })]) },
  { id: 'PIUI', name: 'PIUI', color: '#8b5cf6', route: 'piui', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' })]) },
  { id: 'PLANEJAMENTO', name: 'Planejamento', color: '#06b6d4', route: 'planejamento', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' })]) },
  { id: 'EXECUCAO', name: 'Execucao', color: '#f59e0b', route: 'projects', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77' })]) },
  { id: 'FINALIZADO', name: 'Finalizado', color: '#10b981', route: 'finalizado', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }), h('polyline', { points: '22 4 12 14.01 9 11.01' })]) },
  { id: 'POS_VENDA', name: 'Pos-Venda', color: '#22c55e', route: 'posvenda', icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' })]) }
];

// Computed
const statsCards = computed(() => [
  { module: 'Comercial', count: stats.value.comercial, color: '#c9a962', percentage: 100, route: '/comercial' },
  { module: 'PIUI', count: stats.value.piui, color: '#8b5cf6', percentage: (stats.value.piui / Math.max(stats.value.comercial, 1)) * 100, route: '/piui' },
  { module: 'Planejamento', count: stats.value.planejamento, color: '#06b6d4', percentage: (stats.value.planejamento / Math.max(stats.value.comercial, 1)) * 100, route: '/planejamento' },
  { module: 'Execucao', count: stats.value.execucao, color: '#f59e0b', percentage: (stats.value.execucao / Math.max(stats.value.comercial, 1)) * 100, route: '/projects' },
  { module: 'Pos-Venda', count: stats.value.posVenda, color: '#22c55e', percentage: (stats.value.posVenda / Math.max(stats.value.comercial, 1)) * 100, route: '/posvenda' }
]);

const pipelineStages = computed(() => {
  return moduleDetails.map(mod => ({
    module: mod.id,
    name: mod.name,
    color: mod.color,
    count: projects.value.filter(p => p.currentModule === mod.id).length,
    projects: projects.value.filter(p => p.currentModule === mod.id)
  }));
});

const filteredProjects = computed(() => {
  // Filtering is now done server-side via fetchProjects
  return projects.value;
});

// Methods
function formatCurrency(value: number | undefined): string {
  if (!value) return '0';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getModuleColor(moduleId: string): string {
  return moduleDetails.find(m => m.id === moduleId)?.color || '#6b7280';
}

function getModuleLabel(moduleId: string): string {
  return moduleDetails.find(m => m.id === moduleId)?.name || moduleId;
}

function getModuleProgress(currentModule: string): number {
  const index = modules.indexOf(currentModule);
  if (index === -1) return 0;
  return ((index + 1) / modules.length) * 100;
}

function isModuleActive(currentModule: string, moduleId: string): boolean {
  return currentModule === moduleId;
}

function isModuleCompleted(currentModule: string, moduleId: string): boolean {
  const currentIndex = modules.indexOf(currentModule);
  const moduleIndex = modules.indexOf(moduleId);
  return moduleIndex < currentIndex;
}

function getModuleStatus(project: Project, moduleId: string): string {
  const currentIndex = modules.indexOf(project.currentModule);
  const moduleIndex = modules.indexOf(moduleId);

  if (moduleIndex < currentIndex) return 'Concluido';
  if (moduleIndex === currentIndex) return 'Em andamento';
  return 'Pendente';
}

// API Calls
async function fetchDashboard() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/enterprise/dashboard');
    const data = await response.json();
    if (data.success && data.dashboard?.byModule) {
      stats.value = {
        comercial: data.dashboard.byModule.comercial || 0,
        piui: data.dashboard.byModule.piui || 0,
        planejamento: data.dashboard.byModule.planejamento || 0,
        execucao: data.dashboard.byModule.execucao || 0,
        finalizado: data.dashboard.byModule.finalizado || 0,
        posVenda: data.dashboard.byModule.posVenda || 0
      };
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchProjects() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    // Use higher limit for smaller modules, lower for COMERCIAL
    const limit = filterModule.value === 'COMERCIAL' ? '200' : '500';
    params.append('limit', limit);
    if (filterModule.value) {
      params.append('module', filterModule.value);
    }
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const response = await fetch(`/api/admin/enterprise/projects?${params.toString()}`);
    const data = await response.json();
    if (data.success) {
      projects.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchProjectDetail(projectId: string) {
  try {
    const response = await fetch(`/api/admin/enterprise/projects/${projectId}`);
    const data = await response.json();
    if (data.success) {
      selectedProject.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching project detail:', error);
  }
}

async function executeMigration() {
  if (!migrationSource.value) return;

  migrationLoading.value = true;
  migrationStatus.value = { type: 'loading', message: 'Iniciando migracao...' };

  try {
    let endpoint = '';
    switch (migrationSource.value) {
      case 'pipedrive':
        endpoint = '/api/admin/enterprise/migration/pipedrive';
        break;
      case 'pipefy':
        endpoint = '/api/admin/enterprise/migration/pipefy';
        break;
      case 'full':
        endpoint = '/api/admin/enterprise/migration/full';
        break;
    }

    const response = await fetch(endpoint, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      migrationStatus.value = { type: 'success', message: `Migracao concluida! ${data.imported || 0} registros importados.` };
      await fetchDashboard();
      await fetchProjects();
    } else {
      migrationStatus.value = { type: 'error', message: data.error || 'Erro na migracao' };
    }
  } catch (error: any) {
    migrationStatus.value = { type: 'error', message: error.message || 'Erro na migracao' };
  } finally {
    migrationLoading.value = false;
  }
}

function openProjectDetail(project: Project) {
  fetchProjectDetail(project.id);
}

function closeProjectDetail() {
  selectedProject.value = null;
}

// Watchers - refetch when filters change
watch(filterModule, () => {
  fetchProjects();
});

watch(searchQuery, () => {
  // Debounce search
  const timeout = setTimeout(() => {
    fetchProjects();
  }, 300);
  return () => clearTimeout(timeout);
});

// Lifecycle
onMounted(() => {
  fetchDashboard();
  fetchProjects();
});
</script>

<style scoped>
.enterprise-module {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.module-header {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #c9a962 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.module-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.btn-migrate {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #8b5cf6;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-migrate svg {
  width: 18px;
  height: 18px;
}

.btn-migrate:hover {
  background: rgba(139, 92, 246, 0.25);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 16px;
  min-width: 300px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: #666;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
}

/* Stats */
.stats-section {
  padding: 24px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  animation: slideUp 0.5s ease-out backwards;
  animation-delay: var(--delay);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-module {
  font-size: 14px;
  font-weight: 600;
}

.stat-count {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.stat-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.stat-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.stat-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
  text-decoration: none;
  transition: color 0.2s ease;
}

.stat-link svg {
  width: 14px;
  height: 14px;
}

.stat-link:hover {
  color: #fff;
}

/* Pipeline */
.pipeline-section {
  padding: 0 32px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px 0;
}

.pipeline-flow {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.pipeline-stage {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  animation: slideIn 0.4s ease-out backwards;
  animation-delay: var(--delay);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 2px solid;
}

.stage-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.stage-count {
  font-size: 11px;
  font-weight: 600;
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
}

.stage-projects {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-mini:hover {
  background: rgba(255, 255, 255, 0.06);
}

.project-mini .project-name {
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.project-mini .project-value {
  font-size: 11px;
  color: #888;
}

.more-projects {
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 8px;
}

.stage-arrow {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  color: #444;
  z-index: 1;
}

.stage-arrow svg {
  width: 24px;
  height: 24px;
}

/* Projects Grid */
.projects-section {
  padding: 0 32px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.filter-select option {
  background: #1a1a1a;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.project-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-module {
  font-size: 11px;
  font-weight: 600;
  color: #000;
  padding: 4px 10px;
  border-radius: 12px;
}

.project-date {
  font-size: 12px;
  color: #666;
}

.project-card .project-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px 0;
}

.project-address {
  font-size: 13px;
  color: #888;
  margin: 0 0 16px 0;
}

.project-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.project-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #888;
}

.project-stats .stat-item svg {
  width: 14px;
  height: 14px;
}

.project-progress {
  position: relative;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a962, #8b5cf6, #06b6d4, #f59e0b, #22c55e);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
}

.step {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.step.completed .step-dot {
  background: #22c55e;
}

.step.active .step-dot {
  background: #c9a962;
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3);
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #555;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Panel */
.detail-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.detail-panel {
  width: 560px;
  max-width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #151515 0%, #0d0d0d 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
}

.detail-panel.large {
  width: 700px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-title {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title h2 {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.module-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #000;
  width: fit-content;
}

.close-btn {
  background: transparent;
  border: none;
  padding: 8px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-section {
  margin-bottom: 28px;
}

.panel-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
}

.info-item span {
  font-size: 14px;
  color: #fff;
}

.value-highlight {
  font-size: 18px !important;
  font-weight: 700;
  color: #c9a962 !important;
}

/* Module Timeline */
.module-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  position: relative;
}

.timeline-connector {
  position: absolute;
  left: 20px;
  top: -16px;
  width: 2px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
}

.timeline-item.completed .timeline-connector {
  background: #22c55e;
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  margin-bottom: 8px;
}

.timeline-item.active .timeline-content {
  border-color: rgba(201, 169, 98, 0.3);
  background: rgba(201, 169, 98, 0.05);
}

.timeline-item.completed .timeline-content {
  opacity: 0.7;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
}

.timeline-icon svg {
  width: 20px;
  height: 20px;
}

.timeline-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.timeline-status {
  font-size: 12px;
  color: #888;
}

.timeline-link {
  padding: 6px 12px;
  background: rgba(201, 169, 98, 0.15);
  border: 1px solid rgba(201, 169, 98, 0.3);
  border-radius: 6px;
  color: #c9a962;
  font-size: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.timeline-link:hover {
  background: rgba(201, 169, 98, 0.25);
}

/* Videos Grid */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.video-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  background: #111;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
}

.video-info {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.video-title {
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-date {
  font-size: 11px;
  color: #666;
}

/* Events Timeline */
.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.event-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.event-item:last-child {
  border-bottom: none;
}

.event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.event-dot.status_change { background: #8b5cf6; }
.event-dot.created { background: #22c55e; }
.event-dot.updated { background: #3b82f6; }
.event-dot.completed { background: #06b6d4; }

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-title {
  font-size: 13px;
  color: #fff;
}

.event-desc {
  font-size: 12px;
  color: #888;
}

.event-date {
  font-size: 11px;
  color: #666;
}

/* Panel Footer */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-view-project {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #c9a962 0%, #b8954f 100%);
  border-radius: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-view-project:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

.btn-view-project svg {
  width: 18px;
  height: 18px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  background: linear-gradient(135deg, #181818 0%, #0d0d0d 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-body {
  padding: 24px;
}

.migration-info {
  font-size: 14px;
  color: #888;
  margin: 0 0 20px 0;
}

.migration-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.migration-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.migration-option:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.migration-option.active {
  border-color: #c9a962;
  background: rgba(201, 169, 98, 0.1);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-icon svg {
  width: 24px;
  height: 24px;
}

.option-icon.pipedrive {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.option-icon.pipefy {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.option-icon.full {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.option-desc {
  font-size: 12px;
  color: #888;
}

.migration-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon svg {
  width: 18px;
  height: 18px;
}

.status-icon.loading {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  animation: spin 1s linear infinite;
}

.status-icon.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-icon.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-message {
  font-size: 14px;
  color: #fff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.btn-migrate-action {
  padding: 10px 24px;
  background: linear-gradient(135deg, #c9a962 0%, #b8954f 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-migrate-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

.btn-migrate-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(201, 169, 98, 0.2);
  border-top-color: #c9a962;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Transitions */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-active .detail-panel,
.panel-leave-active .detail-panel {
  transition: transform 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .detail-panel,
.panel-leave-to .detail-panel {
  transform: translateX(100%);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .module-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
    min-width: unset;
  }

  .stats-section,
  .pipeline-section,
  .projects-section {
    padding: 16px 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }

  .detail-panel,
  .detail-panel.large {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .videos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
