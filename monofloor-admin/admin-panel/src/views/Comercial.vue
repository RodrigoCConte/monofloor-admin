<template>
  <div class="comercial-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">Comercial</h1>
          <p class="module-subtitle">Pipeline de Vendas</p>
        </div>
        <div class="header-actions">
          <button class="btn-view" :class="{ active: viewMode === 'pipeline' }" @click="viewMode = 'pipeline'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Pipeline
          </button>
          <button class="btn-view" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Lista
          </button>
          <button class="btn-primary" @click="openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Lead
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Cards -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card" v-for="(stat, index) in statsCards" :key="stat.label" :style="{ '--delay': index * 0.1 + 's' }">
          <div class="stat-icon" :class="stat.iconClass">
            <component :is="stat.icon" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'positive' : 'negative'" v-if="stat.trend !== undefined">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="stat.trend > 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
            </svg>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </section>

    <!-- Pipeline View -->
    <section class="pipeline-section" v-if="viewMode === 'pipeline'">
      <div class="pipeline-container">
        <div
          class="pipeline-column"
          v-for="(stage, stageIndex) in pipelineStages"
          :key="stage.id"
          :style="{ '--column-index': stageIndex }"
          @dragover.prevent
          @drop="handleDrop($event, stage.id)"
        >
          <div class="column-header">
            <div class="column-title">
              <span class="column-dot" :style="{ background: stage.color }"></span>
              {{ stage.label }}
            </div>
            <span class="column-count">{{ getStageDeals(stage.id).length }}</span>
          </div>
          <div class="column-value">
            R$ {{ formatCurrency(getStageValue(stage.id)) }}
          </div>
          <div class="column-cards">
            <div
              class="deal-card"
              v-for="deal in getStageDeals(stage.id)"
              :key="deal.id"
              draggable="true"
              @dragstart="handleDragStart($event, deal)"
              @click="openDealPanel(deal)"
            >
              <div class="deal-header">
                <span class="deal-client">{{ deal.cliente }}</span>
                <span class="deal-value">R$ {{ formatCurrency(deal.valorEstimado) }}</span>
              </div>
              <div class="deal-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ deal.endereco || 'Sem endereço' }}
              </div>
              <div class="deal-footer">
                <div class="deal-m2" v-if="deal.m2Estimado">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  {{ deal.m2Estimado }} m²
                </div>
                <div class="deal-date">
                  {{ formatDate(deal.updatedAt) }}
                </div>
              </div>
              <div class="deal-followup" v-if="deal.nextFollowUp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ formatDate(deal.nextFollowUp) }}
              </div>
            </div>
            <button class="add-deal-btn" @click="openCreateModal(stage.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- List View -->
    <section class="list-section" v-else>
      <div class="list-filters">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Buscar por cliente, endereço..." />
        </div>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os status</option>
          <option v-for="stage in pipelineStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
        </select>
      </div>
      <div class="list-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Endereço</th>
              <th>Status</th>
              <th>Valor Est.</th>
              <th>M² Est.</th>
              <th>Última Atualização</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="deal in filteredDeals" :key="deal.id" @click="openDealPanel(deal)">
              <td class="client-cell">
                <span class="client-name">{{ deal.cliente }}</span>
                <span class="client-source" v-if="deal.origem">{{ deal.origem }}</span>
              </td>
              <td>{{ deal.endereco || '-' }}</td>
              <td>
                <span class="status-badge" :style="{ '--status-color': getStageColor(deal.status) }">
                  {{ getStageLabel(deal.status) }}
                </span>
              </td>
              <td class="value-cell">R$ {{ formatCurrency(deal.valorEstimado) }}</td>
              <td>{{ deal.m2Estimado ? deal.m2Estimado + ' m²' : '-' }}</td>
              <td class="date-cell">{{ formatDate(deal.updatedAt) }}</td>
              <td class="action-cell">
                <button class="action-btn" @click.stop="openDealPanel(deal)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Detail Panel -->
    <Teleport to="body">
      <Transition name="panel">
        <div class="detail-panel-overlay" v-if="selectedDeal" @click.self="closeDealPanel">
          <div class="detail-panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>{{ selectedDeal.cliente }}</h2>
                <span class="status-badge large" :style="{ '--status-color': getStageColor(selectedDeal.status) }">
                  {{ getStageLabel(selectedDeal.status) }}
                </span>
              </div>
              <button class="close-btn" @click="closeDealPanel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="panel-content">
              <div class="panel-section">
                <h3>Informações do Lead</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Valor Estimado</label>
                    <span class="value-highlight">R$ {{ formatCurrency(selectedDeal.valorEstimado) }}</span>
                  </div>
                  <div class="info-item">
                    <label>M² Estimado</label>
                    <span>{{ selectedDeal.m2Estimado || '-' }} m²</span>
                  </div>
                  <div class="info-item full">
                    <label>Endereço</label>
                    <span>{{ selectedDeal.endereco || 'Não informado' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Telefone</label>
                    <span>{{ selectedDeal.telefone || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <span>{{ selectedDeal.email || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Origem</label>
                    <span>{{ selectedDeal.origem || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Consultor</label>
                    <span>{{ selectedDeal.consultor || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="panel-section">
                <h3>Mover para</h3>
                <div class="status-flow">
                  <button
                    v-for="stage in pipelineStages"
                    :key="stage.id"
                    class="status-btn"
                    :class="{ active: selectedDeal.status === stage.id }"
                    :style="{ '--status-color': stage.color }"
                    @click="changeStatus(selectedDeal.id, stage.id)"
                  >
                    {{ stage.label }}
                  </button>
                </div>
              </div>

              <div class="panel-section">
                <div class="section-header">
                  <h3>Follow-ups</h3>
                  <button class="btn-small" @click="showFollowUpForm = !showFollowUpForm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Novo
                  </button>
                </div>
                <Transition name="slide">
                  <div class="followup-form" v-if="showFollowUpForm">
                    <select v-model="newFollowUp.tipo">
                      <option value="LIGACAO">Ligação</option>
                      <option value="EMAIL">Email</option>
                      <option value="REUNIAO">Reunião</option>
                      <option value="VISITA">Visita</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                    <input type="datetime-local" v-model="newFollowUp.agendadoPara" />
                    <textarea v-model="newFollowUp.notas" placeholder="Notas..."></textarea>
                    <div class="form-actions">
                      <button class="btn-cancel" @click="showFollowUpForm = false">Cancelar</button>
                      <button class="btn-save" @click="createFollowUp">Salvar</button>
                    </div>
                  </div>
                </Transition>
                <div class="followup-list">
                  <div class="followup-item" v-for="followup in selectedDeal.followUps" :key="followup.id" :class="{ completed: followup.completado }">
                    <div class="followup-icon" :class="followup.tipo.toLowerCase()">
                      <svg v-if="followup.tipo === 'LIGACAO'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <svg v-else-if="followup.tipo === 'EMAIL'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div class="followup-content">
                      <div class="followup-header">
                        <span class="followup-type">{{ followup.tipo }}</span>
                        <span class="followup-date">{{ formatDateTime(followup.agendadoPara) }}</span>
                      </div>
                      <p class="followup-notes" v-if="followup.notas">{{ followup.notas }}</p>
                    </div>
                    <button class="followup-action" @click="completeFollowUp(followup.id)" v-if="!followup.completado">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                  <div class="empty-state" v-if="!selectedDeal.followUps?.length">
                    <p>Nenhum follow-up registrado</p>
                  </div>
                </div>
              </div>

              <div class="panel-section">
                <h3>Observações</h3>
                <textarea class="notes-textarea" v-model="selectedDeal.observacoes" placeholder="Adicione observações sobre este lead..."></textarea>
              </div>
            </div>
            <div class="panel-footer">
              <button class="btn-delete" @click="confirmDelete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Excluir
              </button>
              <button class="btn-save-changes" @click="saveDeal">Salvar Alterações</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div class="modal-overlay" v-if="showCreateModal" @click.self="closeCreateModal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Novo Lead</h2>
              <button class="close-btn" @click="closeCreateModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full">
                  <label>Nome do Cliente *</label>
                  <input type="text" v-model="newDeal.cliente" placeholder="Nome completo ou empresa" />
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input type="tel" v-model="newDeal.telefone" placeholder="(00) 00000-0000" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" v-model="newDeal.email" placeholder="email@exemplo.com" />
                </div>
                <div class="form-group full">
                  <label>Endereço</label>
                  <input type="text" v-model="newDeal.endereco" placeholder="Endereço completo da obra" />
                </div>
                <div class="form-group">
                  <label>Valor Estimado</label>
                  <input type="number" v-model="newDeal.valorEstimado" placeholder="0,00" />
                </div>
                <div class="form-group">
                  <label>M² Estimado</label>
                  <input type="number" v-model="newDeal.m2Estimado" placeholder="0" />
                </div>
                <div class="form-group">
                  <label>Origem</label>
                  <select v-model="newDeal.origem">
                    <option value="">Selecione...</option>
                    <option value="SITE">Site</option>
                    <option value="INDICACAO">Indicação</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="GOOGLE">Google</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Consultor</label>
                  <input type="text" v-model="newDeal.consultor" placeholder="Nome do consultor" />
                </div>
                <div class="form-group full">
                  <label>Observações</label>
                  <textarea v-model="newDeal.observacoes" rows="3" placeholder="Observações sobre o lead..."></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeCreateModal">Cancelar</button>
              <button class="btn-create" @click="createDeal">Criar Lead</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div class="loading-overlay" v-if="loading">
        <div class="loader"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';

// Types
interface Deal {
  id: string;
  cliente: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  valorEstimado: number;
  m2Estimado?: number;
  status: string;
  origem?: string;
  consultor?: string;
  observacoes?: string;
  nextFollowUp?: string;
  followUps?: FollowUp[];
  updatedAt: string;
}

interface FollowUp {
  id: string;
  tipo: string;
  agendadoPara: string;
  notas?: string;
  completado: boolean;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
}

// State
const loading = ref(false);
const viewMode = ref<'pipeline' | 'list'>('pipeline');
const searchQuery = ref('');
const filterStatus = ref('');
const deals = ref<Deal[]>([]);
const selectedDeal = ref<Deal | null>(null);
const showCreateModal = ref(false);
const showFollowUpForm = ref(false);
const draggedDeal = ref<Deal | null>(null);

const stats = ref({
  leads: 0,
  propostasEnviadas: 0,
  aprovadas: 0,
  valorMes: 0
});

const newDeal = ref({
  cliente: '',
  telefone: '',
  email: '',
  endereco: '',
  valorEstimado: 0,
  m2Estimado: 0,
  origem: '',
  consultor: '',
  observacoes: '',
  status: 'LEAD'
});

const newFollowUp = ref({
  tipo: 'LIGACAO',
  agendadoPara: '',
  notas: ''
});

// Pipeline stages
const pipelineStages: PipelineStage[] = [
  { id: 'LEAD', label: 'Lead', color: '#6b7280' },
  { id: 'QUALIFICACAO', label: 'Qualificação', color: '#8b5cf6' },
  { id: 'VISITA_AGENDADA', label: 'Visita Agendada', color: '#3b82f6' },
  { id: 'VISITA_REALIZADA', label: 'Visita Realizada', color: '#06b6d4' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: '#f59e0b' },
  { id: 'NEGOCIACAO', label: 'Negociação', color: '#c9a962' },
  { id: 'GANHO', label: 'Ganho', color: '#22c55e' }
];

// Stats cards
const statsCards = computed(() => [
  {
    label: 'Leads',
    value: stats.value.leads,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: '9', cy: '7', r: '4' }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ]),
    iconClass: 'leads',
    trend: 12
  },
  {
    label: 'Propostas Enviadas',
    value: stats.value.propostasEnviadas,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
      h('line', { x1: '16', y1: '17', x2: '8', y2: '17' })
    ]),
    iconClass: 'proposals',
    trend: 8
  },
  {
    label: 'Aprovadas',
    value: stats.value.aprovadas,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ]),
    iconClass: 'approved',
    trend: 23
  },
  {
    label: 'Valor do Mês',
    value: 'R$ ' + formatCurrency(stats.value.valorMes),
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
    ]),
    iconClass: 'value',
    trend: 15
  }
]);

// Computed
const filteredDeals = computed(() => {
  let result = [...deals.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.cliente.toLowerCase().includes(query) ||
      d.endereco?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value) {
    result = result.filter(d => d.status === filterStatus.value);
  }

  return result;
});

// Methods
function formatCurrency(value: number): string {
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

function getStageDeals(stageId: string): Deal[] {
  return deals.value.filter(d => d.status === stageId);
}

function getStageValue(stageId: string): number {
  return getStageDeals(stageId).reduce((sum, d) => sum + (d.valorEstimado || 0), 0);
}

function getStageColor(status: string): string {
  return pipelineStages.find(s => s.id === status)?.color || '#6b7280';
}

function getStageLabel(status: string): string {
  return pipelineStages.find(s => s.id === status)?.label || status;
}

// Drag & Drop
function handleDragStart(event: DragEvent, deal: Deal) {
  draggedDeal.value = deal;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

async function handleDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  if (draggedDeal.value && draggedDeal.value.status !== stageId) {
    await changeStatus(draggedDeal.value.id, stageId);
  }
  draggedDeal.value = null;
}

// API calls
async function fetchStats() {
  try {
    const response = await fetch('/api/admin/comercial/stats');
    const data = await response.json();
    if (data.success) {
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function fetchDeals() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/comercial');
    const data = await response.json();
    if (data.success) {
      deals.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching deals:', error);
  } finally {
    loading.value = false;
  }
}

async function createDeal() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/comercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal.value)
    });
    const data = await response.json();
    if (data.success) {
      deals.value.unshift(data.data);
      closeCreateModal();
      await fetchStats();
    }
  } catch (error) {
    console.error('Error creating deal:', error);
  } finally {
    loading.value = false;
  }
}

async function saveDeal() {
  if (!selectedDeal.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/comercial/${selectedDeal.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedDeal.value)
    });
    const data = await response.json();
    if (data.success) {
      const index = deals.value.findIndex(d => d.id === selectedDeal.value!.id);
      if (index !== -1) {
        deals.value[index] = data.data;
      }
      closeDealPanel();
    }
  } catch (error) {
    console.error('Error saving deal:', error);
  } finally {
    loading.value = false;
  }
}

async function changeStatus(dealId: string, newStatus: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/comercial/${dealId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();
    if (data.success) {
      const deal = deals.value.find(d => d.id === dealId);
      if (deal) {
        deal.status = newStatus;
      }
      if (selectedDeal.value?.id === dealId) {
        selectedDeal.value.status = newStatus;
      }
      await fetchStats();
    }
  } catch (error) {
    console.error('Error changing status:', error);
  } finally {
    loading.value = false;
  }
}

async function createFollowUp() {
  if (!selectedDeal.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/comercial/${selectedDeal.value.id}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFollowUp.value)
    });
    const data = await response.json();
    if (data.success) {
      if (!selectedDeal.value.followUps) {
        selectedDeal.value.followUps = [];
      }
      selectedDeal.value.followUps.unshift(data.data);
      showFollowUpForm.value = false;
      newFollowUp.value = { tipo: 'LIGACAO', agendadoPara: '', notas: '' };
    }
  } catch (error) {
    console.error('Error creating follow-up:', error);
  } finally {
    loading.value = false;
  }
}

async function completeFollowUp(followUpId: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/comercial/followups/${followUpId}/complete`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success && selectedDeal.value?.followUps) {
      const followUp = selectedDeal.value.followUps.find(f => f.id === followUpId);
      if (followUp) {
        followUp.completado = true;
      }
    }
  } catch (error) {
    console.error('Error completing follow-up:', error);
  } finally {
    loading.value = false;
  }
}

function confirmDelete() {
  if (confirm('Tem certeza que deseja excluir este lead?')) {
    deleteDeal();
  }
}

async function deleteDeal() {
  if (!selectedDeal.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/comercial/${selectedDeal.value.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
      deals.value = deals.value.filter(d => d.id !== selectedDeal.value!.id);
      closeDealPanel();
      await fetchStats();
    }
  } catch (error) {
    console.error('Error deleting deal:', error);
  } finally {
    loading.value = false;
  }
}

function openDealPanel(deal: Deal) {
  selectedDeal.value = { ...deal };
}

function closeDealPanel() {
  selectedDeal.value = null;
  showFollowUpForm.value = false;
}

function openCreateModal(status?: string) {
  newDeal.value = {
    cliente: '',
    telefone: '',
    email: '',
    endereco: '',
    valorEstimado: 0,
    m2Estimado: 0,
    origem: '',
    consultor: '',
    observacoes: '',
    status: status || 'LEAD'
  };
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

// Lifecycle
onMounted(() => {
  fetchStats();
  fetchDeals();
});
</script>

<style scoped>
.comercial-module {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.module-header {
  background: linear-gradient(180deg, rgba(201, 169, 98, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid rgba(201, 169, 98, 0.15);
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
  letter-spacing: -0.5px;
  margin: 0;
}

.module-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-view {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view svg {
  width: 18px;
  height: 18px;
}

.btn-view:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-view.active {
  background: rgba(201, 169, 98, 0.15);
  border-color: rgba(201, 169, 98, 0.3);
  color: #c9a962;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #c9a962 0%, #b8954f 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

/* Stats Section */
.stats-section {
  padding: 24px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: slideUp 0.5s ease-out backwards;
  animation-delay: var(--delay);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.stat-icon.leads {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.stat-icon.proposals {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.stat-icon.approved {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.stat-icon.value {
  background: rgba(201, 169, 98, 0.15);
  color: #c9a962;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}

.stat-trend svg {
  width: 16px;
  height: 16px;
}

.stat-trend.positive {
  color: #22c55e;
}

.stat-trend.negative {
  color: #ef4444;
}

/* Pipeline Section */
.pipeline-section {
  padding: 0 32px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.pipeline-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.pipeline-column {
  min-width: 280px;
  max-width: 280px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.4s ease-out backwards;
  animation-delay: calc(var(--column-index) * 0.05s);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.column-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.column-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #888;
}

.column-value {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 400px);
}

.deal-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.deal-card:hover {
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.deal-card:active {
  transform: scale(0.98);
}

.deal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.deal-client {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.deal-value {
  font-size: 13px;
  font-weight: 600;
  color: #c9a962;
  white-space: nowrap;
}

.deal-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.deal-info svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.deal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deal-m2 {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.deal-m2 svg {
  width: 12px;
  height: 12px;
}

.deal-date {
  font-size: 11px;
  color: #555;
}

.deal-followup {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: #c9a962;
}

.deal-followup svg {
  width: 12px;
  height: 12px;
}

.add-deal-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-deal-btn svg {
  width: 20px;
  height: 20px;
}

.add-deal-btn:hover {
  border-color: rgba(201, 169, 98, 0.3);
  color: #c9a962;
  background: rgba(201, 169, 98, 0.05);
}

/* List Section */
.list-section {
  padding: 0 32px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.list-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
}

.search-box svg {
  width: 20px;
  height: 20px;
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

.search-box input::placeholder {
  color: #555;
}

.filter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  min-width: 180px;
  cursor: pointer;
}

.filter-select option {
  background: #1a1a1a;
}

.list-table {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.list-table table {
  width: 100%;
  border-collapse: collapse;
}

.list-table th {
  text-align: left;
  padding: 16px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.list-table td {
  padding: 16px 20px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.list-table tr {
  cursor: pointer;
  transition: background 0.2s ease;
}

.list-table tbody tr:hover {
  background: rgba(201, 169, 98, 0.05);
}

.client-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name {
  font-weight: 600;
  color: #fff;
}

.client-source {
  font-size: 12px;
  color: #666;
}

.status-badge {
  display: inline-flex;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--status-color);
  border: 1px solid var(--status-color);
  opacity: 0.9;
}

.status-badge.large {
  padding: 8px 16px;
  font-size: 13px;
}

.value-cell {
  font-weight: 600;
  color: #c9a962;
}

.date-cell {
  color: #666;
}

.action-cell {
  width: 50px;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 8px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

/* Detail Panel */
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
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #151515 0%, #0d0d0d 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-title h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px 0;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.btn-small {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(201, 169, 98, 0.15);
  border: 1px solid rgba(201, 169, 98, 0.3);
  border-radius: 6px;
  color: #c9a962;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small svg {
  width: 14px;
  height: 14px;
}

.btn-small:hover {
  background: rgba(201, 169, 98, 0.25);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full {
  grid-column: 1 / -1;
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

.status-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn:hover {
  border-color: var(--status-color);
  color: var(--status-color);
}

.status-btn.active {
  background: var(--status-color);
  border-color: var(--status-color);
  color: #000;
  font-weight: 600;
}

/* Follow-up Form */
.followup-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.followup-form select,
.followup-form input,
.followup-form textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 14px;
}

.followup-form select option {
  background: #1a1a1a;
}

.followup-form textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.btn-save {
  padding: 8px 16px;
  background: #c9a962;
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  background: #d4b872;
}

/* Follow-up List */
.followup-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.followup-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: opacity 0.2s ease;
}

.followup-item.completed {
  opacity: 0.5;
}

.followup-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.followup-icon svg {
  width: 18px;
  height: 18px;
}

.followup-icon.ligacao {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.followup-icon.email {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.followup-icon.reuniao,
.followup-icon.visita,
.followup-icon.whatsapp {
  background: rgba(201, 169, 98, 0.15);
  color: #c9a962;
}

.followup-content {
  flex: 1;
}

.followup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.followup-type {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.followup-date {
  font-size: 12px;
  color: #666;
}

.followup-notes {
  font-size: 13px;
  color: #888;
  margin: 0;
  line-height: 1.4;
}

.followup-action {
  background: rgba(34, 197, 94, 0.15);
  border: none;
  padding: 8px;
  border-radius: 6px;
  color: #22c55e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.followup-action:hover {
  background: rgba(34, 197, 94, 0.25);
}

.followup-action svg {
  width: 16px;
  height: 16px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #555;
  font-size: 14px;
}

.notes-textarea {
  width: 100%;
  min-height: 120px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 14px;
  color: #fff;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.notes-textarea::placeholder {
  color: #555;
}

.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-save-changes {
  flex: 1;
  padding: 12px 24px;
  background: linear-gradient(135deg, #c9a962 0%, #b8954f 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-changes:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: linear-gradient(135deg, #181818 0%, #0d0d0d 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #888;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(201, 169, 98, 0.5);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #555;
}

.form-group select option {
  background: #1a1a1a;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-create {
  padding: 12px 24px;
  background: linear-gradient(135deg, #c9a962 0%, #b8954f 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
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

@keyframes spin {
  to { transform: rotate(360deg); }
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
    flex-wrap: wrap;
  }

  .stats-section {
    padding: 16px 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .pipeline-section,
  .list-section {
    padding: 0 20px 20px;
  }

  .pipeline-column {
    min-width: 260px;
    max-width: 260px;
  }

  .list-filters {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full {
    grid-column: 1;
  }
}
</style>
