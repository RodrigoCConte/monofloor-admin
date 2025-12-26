<template>
  <div class="posvenda-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">Pos-Venda</h1>
          <p class="module-subtitle">Qualidade e Intervencoes</p>
        </div>
        <div class="header-actions">
          <button class="btn-view" :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Kanban
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
        </div>
      </div>
    </section>

    <!-- Kanban View -->
    <section class="kanban-section" v-if="viewMode === 'kanban'">
      <div class="kanban-container">
        <div
          class="kanban-column"
          v-for="(stage, stageIndex) in posvendaStages"
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
            <span class="column-count">{{ getStagePosVenda(stage.id).length }}</span>
          </div>
          <div class="column-cards">
            <div
              class="posvenda-card"
              v-for="item in getStagePosVenda(stage.id)"
              :key="item.id"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
              @click="openPosVendaPanel(item)"
            >
              <div class="card-header">
                <span class="card-client">{{ item.project?.cliente }}</span>
                <span class="card-days" :class="{ urgent: getDaysInStage(item) > 7 }">
                  {{ getDaysInStage(item) }}d
                </span>
              </div>
              <div class="card-address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ item.project?.endereco || 'Sem endereco' }}
              </div>
              <div class="card-info">
                <div class="info-item" v-if="item.visitasQualidade?.length">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {{ item.visitasQualidade.length }} VQs
                </div>
                <div class="info-item" v-if="item.intervencoes?.length">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                  {{ item.intervencoes.length }} INT
                </div>
              </div>
              <div class="card-satisfaction" v-if="item.satisfacaoCliente !== null">
                <div class="satisfaction-stars">
                  <span v-for="star in 5" :key="star" :class="{ filled: star <= (item.satisfacaoCliente ?? 0) }">★</span>
                </div>
              </div>
            </div>
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
          <input type="text" v-model="searchQuery" placeholder="Buscar por cliente..." />
        </div>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os status</option>
          <option v-for="stage in posvendaStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
        </select>
      </div>
      <div class="list-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Status</th>
              <th>VQs</th>
              <th>Intervencoes</th>
              <th>Satisfacao</th>
              <th>Dias</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredPosVenda" :key="item.id" @click="openPosVendaPanel(item)">
              <td class="client-cell">
                <span class="client-name">{{ item.project?.cliente }}</span>
                <span class="client-address">{{ item.project?.endereco }}</span>
              </td>
              <td>
                <span class="status-badge" :style="{ '--status-color': getStageColor(item.status) }">
                  {{ getStageLabel(item.status) }}
                </span>
              </td>
              <td>{{ item.visitasQualidade?.length || 0 }}</td>
              <td>{{ item.intervencoes?.length || 0 }}</td>
              <td>
                <div class="satisfaction-stars small" v-if="item.satisfacaoCliente !== null">
                  <span v-for="star in 5" :key="star" :class="{ filled: star <= (item.satisfacaoCliente ?? 0) }">★</span>
                </div>
                <span v-else class="no-rating">-</span>
              </td>
              <td :class="{ urgent: getDaysInStage(item) > 7 }">{{ getDaysInStage(item) }}d</td>
              <td class="action-cell">
                <button class="action-btn" @click.stop="openPosVendaPanel(item)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
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
        <div class="detail-panel-overlay" v-if="selectedItem" @click.self="closePosVendaPanel">
          <div class="detail-panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>{{ selectedItem.project?.cliente }}</h2>
                <span class="status-badge" :style="{ '--status-color': getStageColor(selectedItem.status) }">
                  {{ getStageLabel(selectedItem.status) }}
                </span>
              </div>
              <button class="close-btn" @click="closePosVendaPanel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="panel-tabs">
              <button :class="{ active: activeTab === 'visitas' }" @click="activeTab = 'visitas'">Visitas Qualidade</button>
              <button :class="{ active: activeTab === 'intervencoes' }" @click="activeTab = 'intervencoes'">Intervencoes</button>
              <button :class="{ active: activeTab === 'avaliacao' }" @click="activeTab = 'avaliacao'">Avaliacao</button>
            </div>

            <div class="panel-content">
              <!-- Visitas Tab -->
              <div v-if="activeTab === 'visitas'" class="tab-content">
                <div class="panel-section">
                  <div class="section-header">
                    <h3>Visitas de Qualidade ({{ selectedItem.visitasQualidade?.length || 0 }})</h3>
                    <button class="btn-small" @click="showAddVQ = true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agendar VQ
                    </button>
                  </div>

                  <Transition name="slide">
                    <div class="add-form" v-if="showAddVQ">
                      <div class="form-row">
                        <div class="form-group">
                          <label>Data</label>
                          <input type="date" v-model="newVQ.dataAgendada" />
                        </div>
                        <div class="form-group">
                          <label>Responsavel</label>
                          <input type="text" v-model="newVQ.responsavel" />
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Observacoes</label>
                        <textarea v-model="newVQ.observacoes" rows="2"></textarea>
                      </div>
                      <div class="form-actions">
                        <button class="btn-cancel" @click="showAddVQ = false">Cancelar</button>
                        <button class="btn-save" @click="createVQ">Agendar</button>
                      </div>
                    </div>
                  </Transition>

                  <div class="vq-list">
                    <div class="vq-item" v-for="vq in selectedItem.visitasQualidade" :key="vq.id" :class="{ completed: vq.realizada }">
                      <div class="vq-date">
                        <span class="day">{{ formatDay(vq.dataAgendada) }}</span>
                        <span class="month">{{ formatMonth(vq.dataAgendada) }}</span>
                      </div>
                      <div class="vq-info">
                        <span class="vq-title">VQ {{ vq.numero }}</span>
                        <span class="vq-responsavel">{{ vq.responsavel || 'Sem responsavel' }}</span>
                        <span class="vq-resultado" v-if="vq.resultado">{{ vq.resultado }}</span>
                      </div>
                      <div class="vq-status">
                        <button v-if="!vq.realizada" class="btn-complete" @click="openCompleteVQ(vq)">
                          Concluir
                        </button>
                        <span v-else class="completed-badge" :class="vq.aprovada ? 'approved' : 'rejected'">
                          {{ vq.aprovada ? 'Aprovada' : 'Reprovada' }}
                        </span>
                      </div>
                    </div>
                    <div class="empty-state" v-if="!selectedItem.visitasQualidade?.length">
                      <p>Nenhuma visita de qualidade agendada</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Intervencoes Tab -->
              <div v-if="activeTab === 'intervencoes'" class="tab-content">
                <div class="panel-section">
                  <div class="section-header">
                    <h3>Intervencoes ({{ selectedItem.intervencoes?.length || 0 }})</h3>
                    <button class="btn-small" @click="showAddIntervencao = true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Nova Intervencao
                    </button>
                  </div>

                  <Transition name="slide">
                    <div class="add-form" v-if="showAddIntervencao">
                      <div class="form-group">
                        <label>Tipo</label>
                        <select v-model="newIntervencao.tipo">
                          <option value="RETOQUE">Retoque</option>
                          <option value="REPARO">Reparo</option>
                          <option value="REFAZER">Refazer</option>
                          <option value="MANUTENCAO">Manutencao</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Motivo</label>
                        <textarea v-model="newIntervencao.motivo" rows="2" placeholder="Descreva o problema encontrado..."></textarea>
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label>Data Prevista</label>
                          <input type="date" v-model="newIntervencao.dataPrevista" />
                        </div>
                        <div class="form-group">
                          <label>Responsavel</label>
                          <input type="text" v-model="newIntervencao.responsavel" />
                        </div>
                      </div>
                      <div class="form-actions">
                        <button class="btn-cancel" @click="showAddIntervencao = false">Cancelar</button>
                        <button class="btn-save" @click="createIntervencao">Criar</button>
                      </div>
                    </div>
                  </Transition>

                  <div class="intervencao-list">
                    <div class="intervencao-item" v-for="int in selectedItem.intervencoes" :key="int.id" :class="{ completed: int.concluida }">
                      <div class="intervencao-type" :class="int.tipo.toLowerCase()">
                        {{ int.tipo }}
                      </div>
                      <div class="intervencao-info">
                        <span class="intervencao-motivo">{{ int.motivo }}</span>
                        <span class="intervencao-date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                          </svg>
                          {{ formatDate(int.dataPrevista) }}
                        </span>
                      </div>
                      <div class="intervencao-status">
                        <span v-if="int.concluida" class="status-concluida">Concluida</span>
                        <button v-else class="btn-complete" @click="completeIntervencao(int.id)">
                          Concluir
                        </button>
                      </div>
                    </div>
                    <div class="empty-state" v-if="!selectedItem.intervencoes?.length">
                      <p>Nenhuma intervencao registrada</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Avaliacao Tab -->
              <div v-if="activeTab === 'avaliacao'" class="tab-content">
                <div class="panel-section">
                  <h3>Avaliacao do Cliente</h3>

                  <div class="satisfaction-selector">
                    <label>Satisfacao Geral</label>
                    <div class="star-selector">
                      <button
                        v-for="star in 5"
                        :key="star"
                        :class="{ active: (selectedItem.satisfacaoCliente || 0) >= star }"
                        @click="setSatisfaction(star)"
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Feedback do Cliente</label>
                    <textarea v-model="selectedItem.feedbackCliente" rows="4" placeholder="Comentarios e feedback do cliente..."></textarea>
                  </div>

                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="selectedItem.indicariaEmpresa" />
                      <span class="checkmark"></span>
                      Cliente indicaria a empresa
                    </label>
                  </div>

                  <div class="form-group">
                    <label>Data do Feedback</label>
                    <input type="date" v-model="selectedItem.dataFeedback" />
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Status Final</h3>
                  <div class="status-flow">
                    <button
                      v-for="stage in posvendaStages"
                      :key="stage.id"
                      class="status-btn"
                      :class="{ active: selectedItem.status === stage.id }"
                      :style="{ '--status-color': stage.color }"
                      @click="changeStatus(selectedItem.id, stage.id)"
                    >
                      {{ stage.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn-save-changes" @click="savePosVenda">Salvar Alteracoes</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Complete VQ Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div class="modal-overlay" v-if="showCompleteVQModal" @click.self="showCompleteVQModal = false">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Concluir Visita de Qualidade</h2>
              <button class="close-btn" @click="showCompleteVQModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Resultado</label>
                <div class="result-buttons">
                  <button
                    :class="{ active: vqCompletion.aprovada === true }"
                    @click="vqCompletion.aprovada = true"
                    class="result-btn approved"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aprovada
                  </button>
                  <button
                    :class="{ active: vqCompletion.aprovada === false }"
                    @click="vqCompletion.aprovada = false"
                    class="result-btn rejected"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Reprovada
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Observacoes</label>
                <textarea v-model="vqCompletion.resultado" rows="3" placeholder="Descreva o resultado da visita..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showCompleteVQModal = false">Cancelar</button>
              <button class="btn-confirm" @click="confirmCompleteVQ">Confirmar</button>
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
import { ref, computed, onMounted, h } from 'vue';

// Types
interface VisitaQualidade {
  id: string;
  numero: number;
  dataAgendada: string;
  responsavel?: string;
  observacoes?: string;
  realizada: boolean;
  aprovada?: boolean;
  resultado?: string;
}

interface Intervencao {
  id: string;
  tipo: string;
  motivo: string;
  dataPrevista: string;
  responsavel?: string;
  concluida: boolean;
  dataConclusao?: string;
}

interface PosVenda {
  id: string;
  status: string;
  satisfacaoCliente?: number;
  feedbackCliente?: string;
  indicariaEmpresa?: boolean;
  dataFeedback?: string;
  project?: {
    id: string;
    cliente: string;
    endereco?: string;
  };
  visitasQualidade?: VisitaQualidade[];
  intervencoes?: Intervencao[];
  createdAt: string;
  updatedAt: string;
}

interface Stage {
  id: string;
  label: string;
  color: string;
}

// State
const loading = ref(false);
const viewMode = ref<'kanban' | 'list'>('kanban');
const searchQuery = ref('');
const filterStatus = ref('');
const posvendaItems = ref<PosVenda[]>([]);
const selectedItem = ref<PosVenda | null>(null);
const activeTab = ref<'visitas' | 'intervencoes' | 'avaliacao'>('visitas');
const draggedItem = ref<PosVenda | null>(null);

const showAddVQ = ref(false);
const showAddIntervencao = ref(false);
const showCompleteVQModal = ref(false);
const selectedVQ = ref<VisitaQualidade | null>(null);

const newVQ = ref({
  dataAgendada: '',
  responsavel: '',
  observacoes: ''
});

const newIntervencao = ref({
  tipo: 'RETOQUE',
  motivo: '',
  dataPrevista: '',
  responsavel: ''
});

const vqCompletion = ref({
  aprovada: true,
  resultado: ''
});

const stats = ref({
  acompanhamento: 0,
  visitas: 0,
  intervencoes: 0,
  concluidos: 0
});

// Pos-venda stages
const posvendaStages: Stage[] = [
  { id: 'ACOMPANHAMENTO', label: 'Acompanhamento', color: '#3b82f6' },
  { id: 'VISITA_AGENDADA', label: 'VQ Agendada', color: '#8b5cf6' },
  { id: 'AGUARDANDO_INTERVENCAO', label: 'Aguardando Intervencao', color: '#f59e0b' },
  { id: 'EM_INTERVENCAO', label: 'Em Intervencao', color: '#f97316' },
  { id: 'CONCLUIDO', label: 'Concluido', color: '#22c55e' }
];

// Stats cards
const statsCards = computed(() => [
  {
    label: 'Em Acompanhamento',
    value: stats.value.acompanhamento,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
      h('circle', { cx: '12', cy: '12', r: '3' })
    ]),
    iconClass: 'watching'
  },
  {
    label: 'Visitas Agendadas',
    value: stats.value.visitas,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
    ]),
    iconClass: 'visits'
  },
  {
    label: 'Em Intervencao',
    value: stats.value.intervencoes,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' })
    ]),
    iconClass: 'intervening'
  },
  {
    label: 'Concluidos',
    value: stats.value.concluidos,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ]),
    iconClass: 'completed'
  }
]);

// Computed
const filteredPosVenda = computed(() => {
  let result = [...posvendaItems.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item =>
      item.project?.cliente?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value);
  }

  return result;
});

// Methods
function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDay(date: string): string {
  return new Date(date).getDate().toString().padStart(2, '0');
}

function formatMonth(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

function getStagePosVenda(stageId: string): PosVenda[] {
  return posvendaItems.value.filter(item => item.status === stageId);
}

function getStageColor(status: string): string {
  return posvendaStages.find(s => s.id === status)?.color || '#6b7280';
}

function getStageLabel(status: string): string {
  return posvendaStages.find(s => s.id === status)?.label || status;
}

function getDaysInStage(item: PosVenda): number {
  const updated = new Date(item.updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
}

function setSatisfaction(stars: number) {
  if (selectedItem.value) {
    selectedItem.value.satisfacaoCliente = stars;
  }
}

// Drag & Drop
function handleDragStart(event: DragEvent, item: PosVenda) {
  draggedItem.value = item;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

async function handleDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  if (draggedItem.value && draggedItem.value.status !== stageId) {
    await changeStatus(draggedItem.value.id, stageId);
  }
  draggedItem.value = null;
}

// API Calls
async function fetchStats() {
  try {
    const response = await fetch('/api/admin/posvenda/stats');
    const data = await response.json();
    if (data.success) {
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function fetchPosVenda() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/posvenda');
    const data = await response.json();
    if (data.success) {
      posvendaItems.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching pos-venda:', error);
  } finally {
    loading.value = false;
  }
}

async function changeStatus(itemId: string, newStatus: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();
    if (data.success) {
      const item = posvendaItems.value.find(i => i.id === itemId);
      if (item) {
        item.status = newStatus;
      }
      if (selectedItem.value?.id === itemId) {
        selectedItem.value.status = newStatus;
      }
      await fetchStats();
    }
  } catch (error) {
    console.error('Error changing status:', error);
  } finally {
    loading.value = false;
  }
}

async function createVQ() {
  if (!selectedItem.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/${selectedItem.value.id}/vq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVQ.value)
    });
    const data = await response.json();
    if (data.success) {
      if (!selectedItem.value.visitasQualidade) {
        selectedItem.value.visitasQualidade = [];
      }
      selectedItem.value.visitasQualidade.push(data.data);
      showAddVQ.value = false;
      newVQ.value = { dataAgendada: '', responsavel: '', observacoes: '' };
    }
  } catch (error) {
    console.error('Error creating VQ:', error);
  } finally {
    loading.value = false;
  }
}

function openCompleteVQ(vq: VisitaQualidade) {
  selectedVQ.value = vq;
  vqCompletion.value = { aprovada: true, resultado: '' };
  showCompleteVQModal.value = true;
}

async function confirmCompleteVQ() {
  if (!selectedVQ.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/vq/${selectedVQ.value.id}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vqCompletion.value)
    });
    const data = await response.json();
    if (data.success && selectedItem.value?.visitasQualidade) {
      const vq = selectedItem.value.visitasQualidade.find(v => v.id === selectedVQ.value!.id);
      if (vq) {
        vq.realizada = true;
        vq.aprovada = vqCompletion.value.aprovada;
        vq.resultado = vqCompletion.value.resultado;
      }
      showCompleteVQModal.value = false;

      // If reprovada, create intervencao automatically
      if (!vqCompletion.value.aprovada) {
        showAddIntervencao.value = true;
        newIntervencao.value.motivo = `Reprovacao VQ: ${vqCompletion.value.resultado}`;
        activeTab.value = 'intervencoes';
      }
    }
  } catch (error) {
    console.error('Error completing VQ:', error);
  } finally {
    loading.value = false;
  }
}

async function createIntervencao() {
  if (!selectedItem.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/${selectedItem.value.id}/intervencao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIntervencao.value)
    });
    const data = await response.json();
    if (data.success) {
      if (!selectedItem.value.intervencoes) {
        selectedItem.value.intervencoes = [];
      }
      selectedItem.value.intervencoes.push(data.data);
      showAddIntervencao.value = false;
      newIntervencao.value = { tipo: 'RETOQUE', motivo: '', dataPrevista: '', responsavel: '' };
    }
  } catch (error) {
    console.error('Error creating intervencao:', error);
  } finally {
    loading.value = false;
  }
}

async function completeIntervencao(intervencaoId: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/intervencao/${intervencaoId}/complete`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success && selectedItem.value?.intervencoes) {
      const int = selectedItem.value.intervencoes.find(i => i.id === intervencaoId);
      if (int) {
        int.concluida = true;
        int.dataConclusao = new Date().toISOString();
      }
    }
  } catch (error) {
    console.error('Error completing intervencao:', error);
  } finally {
    loading.value = false;
  }
}

async function savePosVenda() {
  if (!selectedItem.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/posvenda/${selectedItem.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        satisfacaoCliente: selectedItem.value.satisfacaoCliente,
        feedbackCliente: selectedItem.value.feedbackCliente,
        indicariaEmpresa: selectedItem.value.indicariaEmpresa,
        dataFeedback: selectedItem.value.dataFeedback
      })
    });
    const data = await response.json();
    if (data.success) {
      const index = posvendaItems.value.findIndex(i => i.id === selectedItem.value!.id);
      if (index !== -1) {
        posvendaItems.value[index] = { ...posvendaItems.value[index], ...data.data };
      }
      closePosVendaPanel();
    }
  } catch (error) {
    console.error('Error saving pos-venda:', error);
  } finally {
    loading.value = false;
  }
}

function openPosVendaPanel(item: PosVenda) {
  selectedItem.value = { ...item };
  activeTab.value = 'visitas';
}

function closePosVendaPanel() {
  selectedItem.value = null;
  showAddVQ.value = false;
  showAddIntervencao.value = false;
}

// Lifecycle
onMounted(() => {
  fetchStats();
  fetchPosVenda();
});
</script>

<style scoped>
.posvenda-module {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.module-header {
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid rgba(34, 197, 94, 0.15);
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
}

.module-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
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
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

/* Stats */
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
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

.stat-icon.watching { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.stat-icon.visits { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.stat-icon.intervening { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.stat-icon.completed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* Kanban */
.kanban-section {
  padding: 0 32px 32px;
  max-width: 1800px;
  margin: 0 auto;
}

.kanban-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-column {
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
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 350px);
}

.posvenda-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.posvenda-card:hover {
  border-color: rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-client {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.card-days {
  font-size: 11px;
  color: #888;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-days.urgent {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.card-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.card-address svg {
  width: 14px;
  height: 14px;
}

.card-info {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.info-item svg {
  width: 12px;
  height: 12px;
}

.card-satisfaction {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.satisfaction-stars {
  display: flex;
  gap: 2px;
}

.satisfaction-stars span {
  font-size: 14px;
  color: #444;
}

.satisfaction-stars span.filled {
  color: #f59e0b;
}

.satisfaction-stars.small span {
  font-size: 12px;
}

.no-rating {
  color: #555;
}

/* List */
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

.filter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  min-width: 200px;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.list-table td {
  padding: 16px 20px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.list-table tbody tr {
  cursor: pointer;
  transition: background 0.2s ease;
}

.list-table tbody tr:hover {
  background: rgba(34, 197, 94, 0.05);
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

.client-address {
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
}

.urgent {
  color: #ef4444;
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

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-tabs button {
  padding: 14px 20px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.panel-tabs button:hover {
  color: #fff;
}

.panel-tabs button.active {
  color: #22c55e;
}

.panel-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #22c55e;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #22c55e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small svg {
  width: 14px;
  height: 14px;
}

.btn-small:hover {
  background: rgba(34, 197, 94, 0.25);
}

/* Forms */
.add-form {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  color: #888;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
}

.form-group select option {
  background: #1a1a1a;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
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
}

.btn-save {
  padding: 8px 16px;
  background: #22c55e;
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* VQ List */
.vq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vq-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.vq-item.completed {
  opacity: 0.7;
}

.vq-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.vq-date .day {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.vq-date .month {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.vq-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vq-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.vq-responsavel {
  font-size: 12px;
  color: #888;
}

.vq-resultado {
  font-size: 12px;
  color: #666;
}

.vq-status {
  min-width: 100px;
  text-align: right;
}

.btn-complete {
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #22c55e;
  font-size: 12px;
  cursor: pointer;
}

.completed-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
}

.completed-badge.approved {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.completed-badge.rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Intervencao List */
.intervencao-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.intervencao-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.intervencao-item.completed {
  opacity: 0.7;
}

.intervencao-type {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.intervencao-type.retoque { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.intervencao-type.reparo { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.intervencao-type.refazer { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.intervencao-type.manutencao { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }

.intervencao-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.intervencao-motivo {
  font-size: 14px;
  color: #fff;
}

.intervencao-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.intervencao-date svg {
  width: 12px;
  height: 12px;
}

.intervencao-status {
  min-width: 100px;
  text-align: right;
}

.status-concluida {
  font-size: 12px;
  color: #22c55e;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #555;
}

/* Avaliacao */
.satisfaction-selector {
  margin-bottom: 24px;
}

.satisfaction-selector label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.star-selector {
  display: flex;
  gap: 8px;
}

.star-selector button {
  background: transparent;
  border: none;
  font-size: 32px;
  color: #444;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.star-selector button.active {
  color: #f59e0b;
}

.star-selector button:hover {
  transform: scale(1.1);
}

.checkbox-group {
  margin: 20px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #ccc;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-label input:checked + .checkmark {
  background: #22c55e;
  border-color: #22c55e;
}

.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  color: #fff;
  font-size: 12px;
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

/* Footer */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-save-changes {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-changes:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
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
  max-width: 400px;
  background: linear-gradient(135deg, #181818 0%, #0d0d0d 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-body {
  padding: 20px;
}

.result-buttons {
  display: flex;
  gap: 12px;
}

.result-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-btn svg {
  width: 18px;
  height: 18px;
}

.result-btn.approved {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.result-btn.approved.active {
  background: #22c55e;
  color: #000;
}

.result-btn.rejected {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.result-btn.rejected.active {
  background: #ef4444;
  color: #fff;
}

.modal-body .form-group {
  margin-top: 16px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-confirm {
  padding: 10px 20px;
  background: #22c55e;
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
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
  border: 3px solid rgba(34, 197, 94, 0.2);
  border-top-color: #22c55e;
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
  transform: scale(0.95);
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

  .stats-section {
    padding: 16px 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .kanban-section,
  .list-section {
    padding: 0 20px 20px;
  }

  .list-filters {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
