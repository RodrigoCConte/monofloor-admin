<template>
  <div class="planejamento-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">Planejamento</h1>
          <p class="module-subtitle">Visitas Tecnicas, OS e Logistica</p>
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
          <button class="btn-view" :class="{ active: viewMode === 'calendar' }" @click="viewMode = 'calendar'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Agenda
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
          v-for="(stage, stageIndex) in planningStages"
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
            <span class="column-count">{{ getStagePlanning(stage.id).length }}</span>
          </div>
          <div class="column-cards">
            <div
              class="planning-card"
              v-for="planning in getStagePlanning(stage.id)"
              :key="planning.id"
              draggable="true"
              @dragstart="handleDragStart($event, planning)"
              @click="openPlanningPanel(planning)"
            >
              <div class="planning-header">
                <span class="planning-client">{{ planning.project?.cliente }}</span>
              </div>
              <div class="planning-address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ planning.project?.endereco || 'Sem endereco' }}
              </div>
              <div class="planning-details">
                <div class="detail-item" v-if="planning.project?.m2Total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  {{ planning.project.m2Total }} m2
                </div>
                <div class="detail-item" v-if="planning.visitasTecnicas?.length">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                  </svg>
                  {{ planning.visitasTecnicas.length }} VTs
                </div>
              </div>
              <div class="planning-badges">
                <span class="badge vt" v-if="planning.vtCompleta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  VT OK
                </span>
                <span class="badge os" v-if="planning.osGerada">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  OS
                </span>
                <span class="badge logistica" v-if="planning.logistica?.status === 'ENTREGUE'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Entregue
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Calendar View -->
    <section class="calendar-section" v-else>
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2>{{ currentMonthLabel }}</h2>
        <button class="nav-btn" @click="nextMonth">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
        <div
          class="calendar-day"
          v-for="day in calendarDays"
          :key="day.date"
          :class="{ 'other-month': day.otherMonth, 'today': day.isToday, 'has-events': day.events?.length }"
        >
          <span class="day-number">{{ day.day }}</span>
          <div class="day-events" v-if="day.events?.length">
            <div class="event-dot" v-for="(event, i) in day.events.slice(0, 3)" :key="i" :class="event.type"></div>
            <span class="more-events" v-if="day.events.length > 3">+{{ day.events.length - 3 }}</span>
          </div>
        </div>
      </div>
      <div class="calendar-legend">
        <div class="legend-item"><span class="dot vt"></span> Visita Tecnica</div>
        <div class="legend-item"><span class="dot entrega"></span> Entrega Material</div>
        <div class="legend-item"><span class="dot inicio"></span> Inicio Obra</div>
      </div>
    </section>

    <!-- Detail Panel -->
    <Teleport to="body">
      <Transition name="panel">
        <div class="detail-panel-overlay" v-if="selectedPlanning" @click.self="closePlanningPanel">
          <div class="detail-panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>{{ selectedPlanning.project?.cliente }}</h2>
                <span class="status-badge" :style="{ '--status-color': getStageColor(selectedPlanning.status) }">
                  {{ getStageLabel(selectedPlanning.status) }}
                </span>
              </div>
              <button class="close-btn" @click="closePlanningPanel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="panel-tabs">
              <button :class="{ active: activeTab === 'vt' }" @click="activeTab = 'vt'">Visitas Tecnicas</button>
              <button :class="{ active: activeTab === 'os' }" @click="activeTab = 'os'">Ordem de Servico</button>
              <button :class="{ active: activeTab === 'logistica' }" @click="activeTab = 'logistica'">Logistica</button>
            </div>

            <div class="panel-content">
              <!-- VT Tab -->
              <div v-if="activeTab === 'vt'" class="tab-content">
                <div class="panel-section">
                  <div class="section-header">
                    <h3>Visitas Tecnicas ({{ selectedPlanning.visitasTecnicas?.length || 0 }})</h3>
                    <button class="btn-small" @click="showAddVT = true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agendar VT
                    </button>
                  </div>

                  <Transition name="slide">
                    <div class="add-form" v-if="showAddVT">
                      <div class="form-row">
                        <div class="form-group">
                          <label>Data</label>
                          <input type="date" v-model="newVT.dataAgendada" />
                        </div>
                        <div class="form-group">
                          <label>Hora</label>
                          <input type="time" v-model="newVT.hora" />
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Responsavel</label>
                        <input type="text" v-model="newVT.responsavel" placeholder="Nome do responsavel" />
                      </div>
                      <div class="form-group">
                        <label>Observacoes</label>
                        <textarea v-model="newVT.observacoes" rows="2"></textarea>
                      </div>
                      <div class="form-actions">
                        <button class="btn-cancel" @click="showAddVT = false">Cancelar</button>
                        <button class="btn-save" @click="createVT">Agendar</button>
                      </div>
                    </div>
                  </Transition>

                  <div class="vt-list">
                    <div class="vt-item" v-for="vt in selectedPlanning.visitasTecnicas" :key="vt.id" :class="{ completed: vt.realizada }">
                      <div class="vt-date">
                        <span class="day">{{ formatDay(vt.dataAgendada) }}</span>
                        <span class="month">{{ formatMonth(vt.dataAgendada) }}</span>
                      </div>
                      <div class="vt-info">
                        <span class="vt-title">Visita Tecnica {{ vt.numero }}</span>
                        <span class="vt-responsavel">{{ vt.responsavel || 'Sem responsavel' }}</span>
                        <span class="vt-obs" v-if="vt.observacoes">{{ vt.observacoes }}</span>
                      </div>
                      <div class="vt-status">
                        <button v-if="!vt.realizada" class="btn-complete" @click="completeVT(vt.id)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Concluir
                        </button>
                        <span v-else class="completed-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Realizada
                        </span>
                      </div>
                    </div>
                    <div class="empty-state" v-if="!selectedPlanning.visitasTecnicas?.length">
                      <p>Nenhuma visita tecnica agendada</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- OS Tab -->
              <div v-if="activeTab === 'os'" class="tab-content">
                <div class="panel-section" v-if="!selectedPlanning.ordemServico">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>Ordem de Servico nao gerada</p>
                    <button class="btn-generate-os" @click="generateOS" :disabled="!selectedPlanning.vtCompleta">
                      Gerar OS
                    </button>
                    <span class="os-tip" v-if="!selectedPlanning.vtCompleta">Complete a VT antes de gerar a OS</span>
                  </div>
                </div>

                <div class="panel-section" v-else>
                  <div class="os-header">
                    <h3>OS #{{ selectedPlanning.ordemServico.numero }}</h3>
                    <span class="os-status" :class="selectedPlanning.ordemServico.status.toLowerCase()">
                      {{ getOSStatusLabel(selectedPlanning.ordemServico.status) }}
                    </span>
                  </div>

                  <div class="os-info-grid">
                    <div class="os-info-item">
                      <label>Data Prevista Inicio</label>
                      <span>{{ formatDate(selectedPlanning.ordemServico.dataPrevistaInicio) }}</span>
                    </div>
                    <div class="os-info-item">
                      <label>Data Prevista Fim</label>
                      <span>{{ formatDate(selectedPlanning.ordemServico.dataPrevistaFim) }}</span>
                    </div>
                    <div class="os-info-item">
                      <label>Equipe Designada</label>
                      <span>{{ selectedPlanning.ordemServico.equipeDesignada || 'Nao definida' }}</span>
                    </div>
                    <div class="os-info-item full">
                      <label>Instrucoes Especiais</label>
                      <span>{{ selectedPlanning.ordemServico.instrucoesEspeciais || 'Nenhuma' }}</span>
                    </div>
                  </div>

                  <div class="os-actions" v-if="selectedPlanning.ordemServico.status !== 'CONCLUIDA'">
                    <button class="btn-advance" @click="advanceOS">
                      Avancar Status
                    </button>
                  </div>
                </div>
              </div>

              <!-- Logistica Tab -->
              <div v-if="activeTab === 'logistica'" class="tab-content">
                <div class="panel-section" v-if="!selectedPlanning.logistica">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    <p>Logistica nao configurada</p>
                    <button class="btn-generate-os" @click="showLogisticaForm = true" :disabled="!selectedPlanning.osGerada">
                      Configurar Entrega
                    </button>
                    <span class="os-tip" v-if="!selectedPlanning.osGerada">Gere a OS antes de configurar a entrega</span>
                  </div>
                </div>

                <div class="panel-section" v-else>
                  <div class="logistica-header">
                    <h3>Entrega de Materiais</h3>
                    <span class="logistica-status" :class="selectedPlanning.logistica.status.toLowerCase()">
                      {{ getLogisticaStatusLabel(selectedPlanning.logistica.status) }}
                    </span>
                  </div>

                  <div class="logistica-timeline">
                    <div class="timeline-item" :class="{ active: selectedPlanning.logistica.status === 'AGUARDANDO_MATERIAL' }">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <span class="timeline-title">Aguardando Material</span>
                      </div>
                    </div>
                    <div class="timeline-item" :class="{ active: selectedPlanning.logistica.status === 'MATERIAL_SEPARADO' }">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <span class="timeline-title">Material Separado</span>
                      </div>
                    </div>
                    <div class="timeline-item" :class="{ active: selectedPlanning.logistica.status === 'EM_TRANSITO' }">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <span class="timeline-title">Em Transito</span>
                      </div>
                    </div>
                    <div class="timeline-item" :class="{ active: selectedPlanning.logistica.status === 'ENTREGUE' }">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <span class="timeline-title">Entregue</span>
                      </div>
                    </div>
                  </div>

                  <div class="logistica-info">
                    <div class="info-row">
                      <label>Data Prevista</label>
                      <span>{{ formatDate(selectedPlanning.logistica.dataPrevistaEntrega) }}</span>
                    </div>
                    <div class="info-row" v-if="selectedPlanning.logistica.dataEntrega">
                      <label>Data Entrega</label>
                      <span>{{ formatDate(selectedPlanning.logistica.dataEntrega) }}</span>
                    </div>
                    <div class="info-row" v-if="selectedPlanning.logistica.motorista">
                      <label>Motorista</label>
                      <span>{{ selectedPlanning.logistica.motorista }}</span>
                    </div>
                  </div>

                  <div class="logistica-actions" v-if="selectedPlanning.logistica.status !== 'ENTREGUE'">
                    <button class="btn-advance" @click="advanceLogistica">
                      Avancar Status
                    </button>
                    <button class="btn-confirm-delivery" v-if="selectedPlanning.logistica.status === 'EM_TRANSITO'" @click="confirmDelivery">
                      Confirmar Entrega
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn-save-changes" @click="savePlanning">Salvar Alteracoes</button>
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
interface VisitaTecnica {
  id: string;
  numero: number;
  dataAgendada: string;
  responsavel?: string;
  observacoes?: string;
  realizada: boolean;
}

interface OrdemServico {
  id: string;
  numero: string;
  status: string;
  dataPrevistaInicio?: string;
  dataPrevistaFim?: string;
  equipeDesignada?: string;
  instrucoesEspeciais?: string;
}

interface Logistica {
  id: string;
  status: string;
  dataPrevistaEntrega?: string;
  dataEntrega?: string;
  motorista?: string;
}

interface Planning {
  id: string;
  status: string;
  vtCompleta: boolean;
  osGerada: boolean;
  project?: {
    id: string;
    cliente: string;
    endereco?: string;
    m2Total?: number;
  };
  visitasTecnicas?: VisitaTecnica[];
  ordemServico?: OrdemServico;
  logistica?: Logistica;
}

interface Stage {
  id: string;
  label: string;
  color: string;
}

// State
const loading = ref(false);
const viewMode = ref<'kanban' | 'calendar'>('kanban');
const plannings = ref<Planning[]>([]);
const selectedPlanning = ref<Planning | null>(null);
const activeTab = ref<'vt' | 'os' | 'logistica'>('vt');
const draggedPlanning = ref<Planning | null>(null);

const currentDate = ref(new Date());
const showAddVT = ref(false);
const showLogisticaForm = ref(false);

const newVT = ref({
  dataAgendada: '',
  hora: '',
  responsavel: '',
  observacoes: ''
});

const stats = ref({
  aguardandoVT: 0,
  vtAgendadas: 0,
  osGeradas: 0,
  prontoExecucao: 0
});

// Planning stages
const planningStages: Stage[] = [
  { id: 'AGUARDANDO_VT', label: 'Aguardando VT', color: '#f59e0b' },
  { id: 'VT_AGENDADA', label: 'VT Agendada', color: '#3b82f6' },
  { id: 'VT_REALIZADA', label: 'VT Realizada', color: '#8b5cf6' },
  { id: 'GERANDO_OS', label: 'Gerando OS', color: '#06b6d4' },
  { id: 'AGUARDANDO_MATERIAL', label: 'Aguardando Material', color: '#f97316' },
  { id: 'PRONTO_EXECUCAO', label: 'Pronto Execucao', color: '#22c55e' }
];

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

// Stats cards
const statsCards = computed(() => [
  {
    label: 'Aguardando VT',
    value: stats.value.aguardandoVT,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('polyline', { points: '12 6 12 12 16 14' })
    ]),
    iconClass: 'waiting'
  },
  {
    label: 'VTs Agendadas',
    value: stats.value.vtAgendadas,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
    ]),
    iconClass: 'scheduled'
  },
  {
    label: 'OS Geradas',
    value: stats.value.osGeradas,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
      h('line', { x1: '16', y1: '17', x2: '8', y2: '17' })
    ]),
    iconClass: 'os'
  },
  {
    label: 'Pronto Execucao',
    value: stats.value.prontoExecucao,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ]),
    iconClass: 'ready'
  }
]);

// Calendar
const currentMonthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  const days = [];

  // Previous month days
  for (let i = 0; i < firstDay.getDay(); i++) {
    const date = new Date(year, month, -i);
    days.unshift({
      date: date.toISOString(),
      day: date.getDate(),
      otherMonth: true,
      isToday: false,
      events: []
    });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date: date.toISOString(),
      day: i,
      otherMonth: false,
      isToday: date.toDateString() === today.toDateString(),
      events: getEventsForDate(date)
    });
  }

  // Next month days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date: date.toISOString(),
      day: i,
      otherMonth: true,
      isToday: false,
      events: []
    });
  }

  return days;
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

function getStagePlanning(stageId: string): Planning[] {
  return plannings.value.filter(p => p.status === stageId);
}

function getStageColor(status: string): string {
  return planningStages.find(s => s.id === status)?.color || '#6b7280';
}

function getStageLabel(status: string): string {
  return planningStages.find(s => s.id === status)?.label || status;
}

function getOSStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    APROVADA: 'Aprovada',
    EM_EXECUCAO: 'Em Execucao',
    CONCLUIDA: 'Concluida'
  };
  return labels[status] || status;
}

function getLogisticaStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AGUARDANDO_MATERIAL: 'Aguardando Material',
    MATERIAL_SEPARADO: 'Material Separado',
    EM_TRANSITO: 'Em Transito',
    ENTREGUE: 'Entregue'
  };
  return labels[status] || status;
}

function getEventsForDate(date: Date): { type: string }[] {
  // TODO: Get actual events from plannings
  const events: { type: string }[] = [];
  plannings.value.forEach(p => {
    p.visitasTecnicas?.forEach(vt => {
      if (new Date(vt.dataAgendada).toDateString() === date.toDateString()) {
        events.push({ type: 'vt' });
      }
    });
  });
  return events;
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
}

// Drag & Drop
function handleDragStart(event: DragEvent, planning: Planning) {
  draggedPlanning.value = planning;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

async function handleDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  if (draggedPlanning.value && draggedPlanning.value.status !== stageId) {
    await changeStatus(draggedPlanning.value.id, stageId);
  }
  draggedPlanning.value = null;
}

// API Calls
async function fetchStats() {
  try {
    const response = await fetch('/api/admin/planejamento/stats');
    const data = await response.json();
    if (data.success) {
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function fetchPlannings() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/planejamento');
    const data = await response.json();
    if (data.success) {
      plannings.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching plannings:', error);
  } finally {
    loading.value = false;
  }
}

async function changeStatus(planningId: string, newStatus: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/${planningId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();
    if (data.success) {
      const planning = plannings.value.find(p => p.id === planningId);
      if (planning) {
        planning.status = newStatus;
      }
      await fetchStats();
    }
  } catch (error) {
    console.error('Error changing status:', error);
  } finally {
    loading.value = false;
  }
}

async function createVT() {
  if (!selectedPlanning.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/${selectedPlanning.value.id}/vt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVT.value)
    });
    const data = await response.json();
    if (data.success) {
      if (!selectedPlanning.value.visitasTecnicas) {
        selectedPlanning.value.visitasTecnicas = [];
      }
      selectedPlanning.value.visitasTecnicas.push(data.data);
      showAddVT.value = false;
      newVT.value = { dataAgendada: '', hora: '', responsavel: '', observacoes: '' };
    }
  } catch (error) {
    console.error('Error creating VT:', error);
  } finally {
    loading.value = false;
  }
}

async function completeVT(vtId: string) {
  if (!selectedPlanning.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/vt/${vtId}/complete`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success && selectedPlanning.value.visitasTecnicas) {
      const vt = selectedPlanning.value.visitasTecnicas.find(v => v.id === vtId);
      if (vt) {
        vt.realizada = true;
      }
    }
  } catch (error) {
    console.error('Error completing VT:', error);
  } finally {
    loading.value = false;
  }
}

async function generateOS() {
  if (!selectedPlanning.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/${selectedPlanning.value.id}/os`, {
      method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
      selectedPlanning.value.ordemServico = data.data;
      selectedPlanning.value.osGerada = true;
    }
  } catch (error) {
    console.error('Error generating OS:', error);
  } finally {
    loading.value = false;
  }
}

async function advanceOS() {
  if (!selectedPlanning.value?.ordemServico) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/os/${selectedPlanning.value.ordemServico.id}/advance`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success) {
      selectedPlanning.value.ordemServico = data.data;
    }
  } catch (error) {
    console.error('Error advancing OS:', error);
  } finally {
    loading.value = false;
  }
}

async function advanceLogistica() {
  if (!selectedPlanning.value?.logistica) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/logistica/${selectedPlanning.value.logistica.id}/advance`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success) {
      selectedPlanning.value.logistica = data.data;
    }
  } catch (error) {
    console.error('Error advancing logistica:', error);
  } finally {
    loading.value = false;
  }
}

async function confirmDelivery() {
  if (!selectedPlanning.value?.logistica) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/planejamento/logistica/${selectedPlanning.value.logistica.id}/confirm-delivery`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success) {
      selectedPlanning.value.logistica = data.data;
    }
  } catch (error) {
    console.error('Error confirming delivery:', error);
  } finally {
    loading.value = false;
  }
}

async function savePlanning() {
  closePlanningPanel();
}

function openPlanningPanel(planning: Planning) {
  selectedPlanning.value = { ...planning };
  activeTab.value = 'vt';
}

function closePlanningPanel() {
  selectedPlanning.value = null;
  showAddVT.value = false;
  showLogisticaForm.value = false;
}

// Lifecycle
onMounted(() => {
  fetchStats();
  fetchPlannings();
});
</script>

<style scoped>
.planejamento-module {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.module-header {
  background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid rgba(6, 182, 212, 0.15);
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
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  color: #06b6d4;
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

.stat-icon.waiting { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.stat-icon.scheduled { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.stat-icon.os { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.stat-icon.ready { background: rgba(34, 197, 94, 0.15); color: #22c55e; }

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

.planning-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.planning-card:hover {
  border-color: rgba(6, 182, 212, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.planning-header {
  margin-bottom: 8px;
}

.planning-client {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.planning-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.planning-address svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.planning-details {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.detail-item svg {
  width: 12px;
  height: 12px;
}

.planning-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.badge svg {
  width: 12px;
  height: 12px;
}

.badge.vt {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge.os {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.badge.logistica {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

/* Calendar */
.calendar-section {
  padding: 0 32px 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.calendar-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
  min-width: 200px;
  text-align: center;
  margin: 0;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
}

.calendar-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px;
  text-transform: uppercase;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.05);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.calendar-day.today .day-number {
  color: #06b6d4;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.day-events {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.event-dot.vt { background: #22c55e; }
.event-dot.entrega { background: #f59e0b; }
.event-dot.inicio { background: #3b82f6; }

.more-events {
  font-size: 10px;
  color: #888;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item .dot.vt { background: #22c55e; }
.legend-item .dot.entrega { background: #f59e0b; }
.legend-item .dot.inicio { background: #3b82f6; }

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
  color: #06b6d4;
}

.panel-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #06b6d4;
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
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  color: #06b6d4;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small svg {
  width: 14px;
  height: 14px;
}

.btn-small:hover {
  background: rgba(6, 182, 212, 0.25);
}

/* VT Form */
.add-form {
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
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
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
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
  background: #06b6d4;
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* VT List */
.vt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vt-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.vt-item.completed {
  opacity: 0.6;
}

.vt-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.vt-date .day {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.vt-date .month {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.vt-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vt-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.vt-responsavel {
  font-size: 12px;
  color: #888;
}

.vt-obs {
  font-size: 12px;
  color: #666;
}

.vt-status {
  min-width: 100px;
  text-align: right;
}

.btn-complete {
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
}

.btn-complete svg {
  width: 14px;
  height: 14px;
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #22c55e;
}

.completed-badge svg {
  width: 14px;
  height: 14px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #555;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin-bottom: 16px;
}

.btn-generate-os {
  padding: 10px 20px;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  color: #06b6d4;
  font-size: 14px;
  cursor: pointer;
}

.btn-generate-os:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.os-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

/* OS */
.os-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.os-header h3 {
  font-size: 16px;
  color: #fff;
  margin: 0;
}

.os-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.os-status.rascunho { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
.os-status.aprovada { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.os-status.em_execucao { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.os-status.concluida { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

.os-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.os-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.os-info-item.full {
  grid-column: 1 / -1;
}

.os-info-item label {
  font-size: 12px;
  color: #666;
}

.os-info-item span {
  font-size: 14px;
  color: #fff;
}

.os-actions,
.logistica-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.btn-advance {
  padding: 10px 20px;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  color: #06b6d4;
  font-size: 14px;
  cursor: pointer;
}

.btn-confirm-delivery {
  padding: 10px 20px;
  background: #22c55e;
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* Logistica */
.logistica-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logistica-header h3 {
  font-size: 16px;
  color: #fff;
  margin: 0;
}

.logistica-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.logistica-status.aguardando_material { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.logistica-status.material_separado { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.logistica-status.em_transito { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.logistica-status.entregue { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

.logistica-timeline {
  position: relative;
  padding-left: 30px;
  margin-bottom: 24px;
}

.logistica-timeline::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.timeline-item {
  position: relative;
  padding: 12px 0;
  opacity: 0.5;
}

.timeline-item.active {
  opacity: 1;
}

.timeline-item.active ~ .timeline-item {
  opacity: 0.3;
}

.timeline-dot {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.timeline-item.active .timeline-dot {
  background: #06b6d4;
  border-color: #06b6d4;
}

.timeline-title {
  font-size: 14px;
  color: #fff;
}

.logistica-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row label {
  font-size: 13px;
  color: #888;
}

.info-row span {
  font-size: 13px;
  color: #fff;
}

/* Footer */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-save-changes {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
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
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
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
  border: 3px solid rgba(6, 182, 212, 0.2);
  border-top-color: #06b6d4;
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
  .calendar-section {
    padding: 0 20px 20px;
  }

  .detail-panel {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .os-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
