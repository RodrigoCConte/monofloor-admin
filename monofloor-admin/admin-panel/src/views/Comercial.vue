<template>
  <div class="comercial-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">Comercial</h1>
          <p class="module-subtitle">Pipeline de Vendas • {{ totalDeals }} negócios</p>
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
          <button class="btn-view" :class="{ active: viewMode === 'analytics' }" @click="viewMode = 'analytics'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10"/>
              <path d="M12 20V4"/>
              <path d="M6 20v-6"/>
            </svg>
            Analytics
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

    <!-- KPI Cards -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card" v-for="(stat, index) in kpiCards" :key="stat.label" :style="{ '--delay': index * 0.1 + 's' }">
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

    <!-- Analytics View -->
    <section class="analytics-section" v-if="viewMode === 'analytics'">
      <div class="analytics-grid">
        <!-- Conversion Funnel -->
        <div class="analytics-card funnel-card">
          <h3>Funil de Conversão</h3>
          <div class="funnel-chart">
            <div
              v-for="(stage, index) in funnelData"
              :key="stage.name"
              class="funnel-stage"
              :style="{
                '--width': stage.percentage + '%',
                '--color': stage.color,
                '--delay': index * 0.1 + 's'
              }"
            >
              <div class="funnel-bar">
                <span class="funnel-label">{{ stage.name }}</span>
                <span class="funnel-value">{{ stage.count }}</span>
              </div>
              <span class="funnel-percent">{{ stage.percentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Follow-up Status -->
        <div class="analytics-card followup-card">
          <h3>Status de Follow-ups</h3>
          <div class="followup-stats">
            <div class="followup-stat today">
              <div class="followup-number">{{ analytics.followUpsToday }}</div>
              <div class="followup-label">Hoje</div>
            </div>
            <div class="followup-stat overdue">
              <div class="followup-number">{{ analytics.followUpsOverdue }}</div>
              <div class="followup-label">Atrasados</div>
            </div>
            <div class="followup-stat scheduled">
              <div class="followup-number">{{ analytics.followUpsScheduled }}</div>
              <div class="followup-label">Agendados</div>
            </div>
          </div>
          <div class="followup-timeline" v-if="analytics.upcomingFollowUps?.length">
            <h4>Próximos Follow-ups</h4>
            <div class="timeline-items">
              <div v-for="f in analytics.upcomingFollowUps.slice(0, 5)" :key="f.id" class="timeline-item">
                <span class="timeline-client">{{ f.cliente }}</span>
                <span class="timeline-date">{{ formatDate(f.agendadoPara) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="analytics-card performance-card">
          <h3>Performance</h3>
          <div class="performance-metrics">
            <div class="metric">
              <span class="metric-value">{{ analytics.avgClosingDays || 0 }}</span>
              <span class="metric-label">Dias p/ fechar</span>
            </div>
            <div class="metric">
              <span class="metric-value">R$ {{ formatCurrency(analytics.avgDealValue || 0) }}</span>
              <span class="metric-label">Ticket médio</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ analytics.conversionRate || 0 }}%</span>
              <span class="metric-label">Taxa conversão</span>
            </div>
          </div>
        </div>

        <!-- Value by Stage -->
        <div class="analytics-card value-card">
          <h3>Valor por Etapa</h3>
          <div class="value-bars">
            <div
              v-for="stage in valueByStage"
              :key="stage.id"
              class="value-bar-row"
            >
              <span class="value-bar-label">{{ stage.label }}</span>
              <div class="value-bar-container">
                <div
                  class="value-bar-fill"
                  :style="{ width: stage.widthPercent + '%', background: stage.color }"
                ></div>
              </div>
              <span class="value-bar-amount">R$ {{ formatCurrency(stage.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pipeline View -->
    <section class="pipeline-section" v-if="viewMode === 'pipeline'">
      <!-- Stage Groups -->
      <div class="stage-groups">
        <button
          v-for="group in stageGroups"
          :key="group.id"
          class="group-toggle"
          :class="{ collapsed: collapsedGroups.includes(group.id) }"
          @click="toggleGroup(group.id)"
        >
          <span class="group-dot" :style="{ background: group.color }"></span>
          {{ group.name }}
          <span class="group-count">{{ getGroupDealsCount(group.id) }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <div class="pipeline-container">
        <template v-for="group in stageGroups" :key="group.id">
          <template v-if="!collapsedGroups.includes(group.id)">
            <div
              class="pipeline-column"
              v-for="(stage, stageIndex) in getGroupStages(group.id)"
              :key="stage.id"
              :style="{ '--column-index': stageIndex }"
              @dragover.prevent
              @dragenter="handleDragEnter($event, stage.id)"
              @dragleave="handleDragLeave($event)"
              @drop="handleDrop($event, stage.id)"
              :class="{ 'drag-over': dragOverStage === stage.id }"
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
                <span class="column-percent">{{ getStagePercent(stage.id) }}%</span>
              </div>
              <div class="column-cards">
                <TransitionGroup name="card-list">
                  <div
                    class="deal-card"
                    v-for="deal in getStageDeals(stage.id)"
                    :key="deal.id"
                    draggable="true"
                    @dragstart="handleDragStart($event, deal)"
                    @dragend="handleDragEnd"
                    @click="openDealPanel(deal)"
                    :class="{ dragging: draggedDeal?.id === deal.id }"
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
                      {{ deal.cidadeExecucao || deal.endereco || 'Sem local' }}
                    </div>
                    <div class="deal-meta">
                      <div class="deal-m2" v-if="deal.m2Estimado">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        {{ deal.m2Estimado }}
                      </div>
                      <div class="deal-source" v-if="deal.origem">
                        {{ deal.origem }}
                      </div>
                      <div class="deal-date">
                        {{ formatDate(deal.updatedAt) }}
                      </div>
                    </div>
                    <div class="deal-followup" v-if="deal.nextFollowUp" :class="{ overdue: isOverdue(deal.nextFollowUp) }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ formatDate(deal.nextFollowUp) }}
                    </div>
                    <div class="deal-auto-escalation" v-if="(deal.daysInStage ?? 0) >= 3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      {{ deal.daysInStage }}d sem atividade
                    </div>
                  </div>
                </TransitionGroup>
                <button class="add-deal-btn" @click="openCreateModal(stage.id)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </section>

    <!-- List View -->
    <section class="list-section" v-if="viewMode === 'list'">
      <div class="list-filters">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Buscar por cliente, cidade, endereço..." />
        </div>
        <select v-model="filterGroup" class="filter-select">
          <option value="">Todos os grupos</option>
          <option v-for="group in stageGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os status</option>
          <option v-for="stage in allStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
        </select>
        <input type="date" v-model="filterDateFrom" class="filter-date" placeholder="De" />
        <input type="date" v-model="filterDateTo" class="filter-date" placeholder="Até" />
      </div>
      <div class="list-table">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('cliente')" class="sortable">
                Cliente
                <svg v-if="sortField === 'cliente'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline :points="sortDir === 'asc' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                </svg>
              </th>
              <th>Cidade</th>
              <th>Status</th>
              <th @click="sortBy('valorEstimado')" class="sortable">
                Valor Est.
                <svg v-if="sortField === 'valorEstimado'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline :points="sortDir === 'asc' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                </svg>
              </th>
              <th>M²</th>
              <th>Origem</th>
              <th @click="sortBy('updatedAt')" class="sortable">
                Atualização
                <svg v-if="sortField === 'updatedAt'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline :points="sortDir === 'asc' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                </svg>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="deal in filteredDeals" :key="deal.id" @click="openDealPanel(deal)">
              <td class="client-cell">
                <span class="client-name">{{ deal.cliente }}</span>
                <span class="client-type" v-if="deal.tipoCliente">{{ deal.tipoCliente }}</span>
              </td>
              <td>{{ deal.cidadeExecucao || '-' }}</td>
              <td>
                <span class="status-badge" :style="{ '--status-color': getStageColor(deal.status) }">
                  {{ getStageLabel(deal.status) }}
                </span>
              </td>
              <td class="value-cell">R$ {{ formatCurrency(deal.valorEstimado) }}</td>
              <td>{{ deal.m2Estimado ? deal.m2Estimado + ' m²' : '-' }}</td>
              <td class="source-cell">{{ deal.origem || '-' }}</td>
              <td class="date-cell">{{ formatDate(deal.updatedAt) }}</td>
              <td class="action-cell">
                <button class="action-btn" @click.stop="openDealPanel(deal)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="list-empty" v-if="filteredDeals.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p>Nenhum negócio encontrado</p>
        </div>
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

            <div class="panel-tabs">
              <button
                v-for="tab in ['info', 'followups', 'timeline']"
                :key="tab"
                class="panel-tab"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab"
              >
                {{ tab === 'info' ? 'Informações' : tab === 'followups' ? 'Follow-ups' : 'Timeline' }}
              </button>
            </div>

            <div class="panel-content">
              <!-- Info Tab -->
              <div v-if="activeTab === 'info'" class="panel-section">
                <div class="info-grid">
                  <div class="info-item highlight">
                    <label>Valor Estimado</label>
                    <span class="value-highlight">R$ {{ formatCurrency(selectedDeal.valorEstimado) }}</span>
                  </div>
                  <div class="info-item">
                    <label>M² Estimado</label>
                    <span>{{ selectedDeal.m2Estimado || '-' }}</span>
                  </div>
                  <div class="info-item full">
                    <label>Endereço</label>
                    <span>{{ selectedDeal.endereco || 'Não informado' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Cidade</label>
                    <span>{{ selectedDeal.cidadeExecucao || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Tipo Cliente</label>
                    <span>{{ selectedDeal.tipoCliente || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Tipo Projeto</label>
                    <span>{{ selectedDeal.tipoProjeto || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Origem</label>
                    <span>{{ selectedDeal.origem || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Telefone</label>
                    <span>{{ selectedDeal.telefone || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <span>{{ selectedDeal.email || '-' }}</span>
                  </div>
                  <div class="info-item full">
                    <label>Resumo</label>
                    <span>{{ selectedDeal.resumo || 'Sem resumo' }}</span>
                  </div>
                </div>

                <h4>Mover para</h4>
                <div class="status-flow">
                  <div v-for="group in stageGroups" :key="group.id" class="status-group">
                    <span class="status-group-label">{{ group.name }}</span>
                    <div class="status-group-buttons">
                      <button
                        v-for="stage in getGroupStages(group.id)"
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
                </div>

                <h4>Observações</h4>
                <textarea class="notes-textarea" v-model="selectedDeal.observacoes" placeholder="Adicione observações..."></textarea>
              </div>

              <!-- Follow-ups Tab -->
              <div v-if="activeTab === 'followups'" class="panel-section">
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
                    <div class="form-row">
                      <select v-model="newFollowUp.tipo">
                        <option value="LIGACAO">Ligação</option>
                        <option value="EMAIL">Email</option>
                        <option value="REUNIAO">Reunião</option>
                        <option value="VISITA">Visita</option>
                        <option value="WHATSAPP">WhatsApp</option>
                      </select>
                      <select v-model="newFollowUp.canal">
                        <option value="TELEFONE">Telefone</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="EMAIL">Email</option>
                        <option value="PRESENCIAL">Presencial</option>
                      </select>
                    </div>
                    <input type="datetime-local" v-model="newFollowUp.agendadoPara" />
                    <textarea v-model="newFollowUp.mensagem" placeholder="Mensagem ou notas..."></textarea>
                    <div class="form-actions">
                      <button class="btn-cancel" @click="showFollowUpForm = false">Cancelar</button>
                      <button class="btn-save" @click="createFollowUp">Agendar</button>
                    </div>
                  </div>
                </Transition>

                <div class="followup-list">
                  <div
                    class="followup-item"
                    v-for="followup in selectedDeal.followUps"
                    :key="followup.id"
                    :class="{ completed: followup.status === 'REALIZADO', overdue: isOverdue(followup.agendadoPara) && followup.status === 'AGENDADO' }"
                  >
                    <div class="followup-icon" :class="followup.tipo?.toLowerCase()">
                      <svg v-if="followup.tipo === 'LIGACAO'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <svg v-else-if="followup.tipo === 'EMAIL'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <svg v-else-if="followup.tipo === 'WHATSAPP'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
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
                        <span class="followup-status" :class="followup.status?.toLowerCase()">{{ followup.status }}</span>
                      </div>
                      <div class="followup-date">{{ formatDateTime(followup.agendadoPara) }}</div>
                      <p class="followup-notes" v-if="followup.mensagem">{{ followup.mensagem }}</p>
                    </div>
                    <button class="followup-action" @click="completeFollowUp(followup.id)" v-if="followup.status === 'AGENDADO'">
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

              <!-- Timeline Tab -->
              <div v-if="activeTab === 'timeline'" class="panel-section">
                <div class="timeline-list">
                  <div v-for="event in selectedDeal.timeline" :key="event.id" class="timeline-event">
                    <div class="timeline-dot" :class="event.tipo?.toLowerCase()"></div>
                    <div class="timeline-content">
                      <div class="timeline-title">{{ event.titulo }}</div>
                      <div class="timeline-desc" v-if="event.descricao">{{ event.descricao }}</div>
                      <div class="timeline-date">{{ formatDateTime(event.createdAt) }}</div>
                    </div>
                  </div>
                  <div class="empty-state" v-if="!selectedDeal.timeline?.length">
                    <p>Nenhum evento registrado</p>
                  </div>
                </div>
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
                  <label>Cidade de Execução</label>
                  <input type="text" v-model="newDeal.cidadeExecucao" placeholder="Cidade" />
                </div>
                <div class="form-group">
                  <label>Tipo de Cliente</label>
                  <select v-model="newDeal.tipoCliente">
                    <option value="">Selecione...</option>
                    <option value="RESIDENCIAL">Residencial</option>
                    <option value="COMERCIAL">Comercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="CORPORATIVO">Corporativo</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tipo de Projeto</label>
                  <select v-model="newDeal.tipoProjeto">
                    <option value="">Selecione...</option>
                    <option value="PISO">Piso</option>
                    <option value="PAREDE">Parede</option>
                    <option value="PISO_PAREDE">Piso + Parede</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Valor Estimado</label>
                  <input type="number" v-model="newDeal.valorEstimado" placeholder="0,00" />
                </div>
                <div class="form-group">
                  <label>M² Estimado</label>
                  <input type="text" v-model="newDeal.metragemEstimada" placeholder="0" />
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
                    <option value="ARQUITETO">Arquiteto</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status Inicial</label>
                  <select v-model="newDeal.status">
                    <option v-for="stage in allStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>Resumo</label>
                  <textarea v-model="newDeal.resumo" rows="2" placeholder="Resumo do projeto..."></textarea>
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
  cidadeExecucao?: string;
  tipoCliente?: string;
  tipoProjeto?: string;
  valorEstimado: number;
  m2Estimado?: string;
  metragemEstimada?: string;
  status: string;
  origem?: string;
  resumo?: string;
  observacoes?: string;
  nextFollowUp?: string;
  followUps?: FollowUp[];
  timeline?: TimelineEvent[];
  daysInStage?: number;
  updatedAt: string;
  createdAt: string;
}

interface FollowUp {
  id: string;
  tipo: string;
  canal?: string;
  agendadoPara: string;
  mensagem?: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  createdAt: string;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  group: string;
}

interface StageGroup {
  id: string;
  name: string;
  color: string;
}

interface Analytics {
  followUpsToday: number;
  followUpsOverdue: number;
  followUpsScheduled: number;
  avgClosingDays: number;
  avgDealValue: number;
  conversionRate: number;
  upcomingFollowUps: any[];
}

// State
const loading = ref(false);
const viewMode = ref<'pipeline' | 'list' | 'analytics'>('pipeline');
const searchQuery = ref('');
const filterStatus = ref('');
const filterGroup = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');
const sortField = ref('updatedAt');
const sortDir = ref<'asc' | 'desc'>('desc');
const deals = ref<Deal[]>([]);
const selectedDeal = ref<Deal | null>(null);
const showCreateModal = ref(false);
const showFollowUpForm = ref(false);
const draggedDeal = ref<Deal | null>(null);
const dragOverStage = ref<string | null>(null);
const collapsedGroups = ref<string[]>([]);
const activeTab = ref('info');

const analytics = ref<Analytics>({
  followUpsToday: 0,
  followUpsOverdue: 0,
  followUpsScheduled: 0,
  avgClosingDays: 0,
  avgDealValue: 0,
  conversionRate: 0,
  upcomingFollowUps: []
});

const stats = ref({
  totalDeals: 0,
  ganhos: 0,
  taxaConversao: 0,
  valorPipeline: 0
});

const newDeal = ref({
  cliente: '',
  telefone: '',
  email: '',
  endereco: '',
  cidadeExecucao: '',
  tipoCliente: '',
  tipoProjeto: '',
  valorEstimado: 0,
  metragemEstimada: '',
  origem: '',
  resumo: '',
  observacoes: '',
  status: 'LEAD'
});

const newFollowUp = ref({
  tipo: 'LIGACAO',
  canal: 'WHATSAPP',
  agendadoPara: '',
  mensagem: ''
});

// Stage Groups
const stageGroups: StageGroup[] = [
  { id: 'entrada', name: 'Entrada', color: '#8b5cf6' },
  { id: 'contato', name: 'Contato', color: '#3b82f6' },
  { id: 'levantamento', name: 'Levantamento', color: '#06b6d4' },
  { id: 'proposta', name: 'Proposta', color: '#f59e0b' },
  { id: 'followup', name: 'Follow-up', color: '#c9a962' },
  { id: 'negociacao', name: 'Negociação', color: '#ec4899' },
  { id: 'fechamento', name: 'Fechamento', color: '#22c55e' },
  { id: 'especiais', name: 'Especiais', color: '#6b7280' }
];

// 21 Pipeline Stages
const allStages: PipelineStage[] = [
  // Entrada
  { id: 'FORM_ORCAMENTO', label: 'Form Orçamento', color: '#a78bfa', group: 'entrada' },
  { id: 'LEAD', label: 'Lead', color: '#8b5cf6', group: 'entrada' },
  { id: 'QUALIFICACAO', label: 'Qualificação', color: '#7c3aed', group: 'entrada' },
  // Contato
  { id: 'PRIMEIRO_CONTATO', label: '1º Contato', color: '#60a5fa', group: 'contato' },
  { id: 'CONTATO_ARQUITETO', label: 'Contato Arquiteto', color: '#3b82f6', group: 'contato' },
  { id: 'AGUARDANDO_ARQ', label: 'Aguardando Arq.', color: '#2563eb', group: 'contato' },
  // Levantamento
  { id: 'LEVANTAMENTO', label: 'Levantamento', color: '#22d3ee', group: 'levantamento' },
  { id: 'VISITA_AGENDADA', label: 'Visita Agendada', color: '#06b6d4', group: 'levantamento' },
  { id: 'VISITA_REALIZADA', label: 'Visita Realizada', color: '#0891b2', group: 'levantamento' },
  // Proposta
  { id: 'PROPOSTA_EM_ELABORACAO', label: 'Proposta Elaborando', color: '#fbbf24', group: 'proposta' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: '#f59e0b', group: 'proposta' },
  // Follow-up
  { id: 'FOLLOW_UP', label: 'Follow-up', color: '#d4b872', group: 'followup' },
  { id: 'FOLLOW_1', label: 'Follow 1', color: '#c9a962', group: 'followup' },
  { id: 'FOLLOW_2', label: 'Follow 2', color: '#b8954f', group: 'followup' },
  { id: 'FOLLOW_3', label: 'Follow 3', color: '#a7823c', group: 'followup' },
  { id: 'FOLLOW_4', label: 'Follow 4', color: '#967029', group: 'followup' },
  { id: 'FOLLOW_5', label: 'Follow 5', color: '#855e16', group: 'followup' },
  // Negociação
  { id: 'NEGOCIACAO', label: 'Negociação', color: '#f472b6', group: 'negociacao' },
  { id: 'AJUSTE_PROPOSTA', label: 'Ajuste Proposta', color: '#ec4899', group: 'negociacao' },
  // Fechamento
  { id: 'GANHO', label: 'Ganho', color: '#22c55e', group: 'fechamento' },
  { id: 'PERDIDO', label: 'Perdido', color: '#ef4444', group: 'fechamento' },
  // Especiais
  { id: 'CONGELADO', label: 'Congelado', color: '#6b7280', group: 'especiais' }
];

// Computed
const totalDeals = computed(() => deals.value.length);

const totalPipelineValue = computed(() =>
  deals.value.reduce((sum, d) => sum + (d.valorEstimado || 0), 0)
);

const kpiCards = computed(() => [
  {
    label: 'Total Deals',
    value: stats.value.totalDeals || totalDeals.value,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: '9', cy: '7', r: '4' }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ]),
    iconClass: 'deals',
    trend: 12
  },
  {
    label: 'Ganhos',
    value: stats.value.ganhos || deals.value.filter(d => d.status === 'GANHO').length,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ]),
    iconClass: 'ganhos',
    trend: 23
  },
  {
    label: 'Taxa Conversão',
    value: (stats.value.taxaConversao || analytics.value.conversionRate || 0) + '%',
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }),
      h('polyline', { points: '17 6 23 6 23 12' })
    ]),
    iconClass: 'conversion',
    trend: 5
  },
  {
    label: 'Valor Pipeline',
    value: 'R$ ' + formatCurrency(stats.value.valorPipeline || totalPipelineValue.value),
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
    ]),
    iconClass: 'value',
    trend: 15
  }
]);

const funnelData = computed(() => {
  const total = deals.value.length || 1;
  const groups = [
    { name: 'Entrada', stages: ['FORM_ORCAMENTO', 'LEAD', 'QUALIFICACAO'], color: '#8b5cf6' },
    { name: 'Contato', stages: ['PRIMEIRO_CONTATO', 'CONTATO_ARQUITETO', 'AGUARDANDO_ARQ'], color: '#3b82f6' },
    { name: 'Levantamento', stages: ['LEVANTAMENTO', 'VISITA_AGENDADA', 'VISITA_REALIZADA'], color: '#06b6d4' },
    { name: 'Proposta', stages: ['PROPOSTA_EM_ELABORACAO', 'PROPOSTA_ENVIADA'], color: '#f59e0b' },
    { name: 'Negociação', stages: ['NEGOCIACAO', 'AJUSTE_PROPOSTA'], color: '#ec4899' },
    { name: 'Ganho', stages: ['GANHO'], color: '#22c55e' }
  ];

  return groups.map(g => {
    const count = deals.value.filter(d => g.stages.includes(d.status)).length;
    return {
      name: g.name,
      count,
      percentage: Math.round((count / total) * 100),
      color: g.color
    };
  });
});

const valueByStage = computed(() => {
  const maxValue = Math.max(...allStages.map(s => getStageValue(s.id)), 1);
  return allStages
    .filter(s => !['PERDIDO', 'CONGELADO'].includes(s.id))
    .map(s => ({
      ...s,
      value: getStageValue(s.id),
      widthPercent: (getStageValue(s.id) / maxValue) * 100
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
});

const filteredDeals = computed(() => {
  let result = [...deals.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.cliente?.toLowerCase().includes(query) ||
      d.cidadeExecucao?.toLowerCase().includes(query) ||
      d.endereco?.toLowerCase().includes(query)
    );
  }

  if (filterGroup.value) {
    const groupStages = allStages.filter(s => s.group === filterGroup.value).map(s => s.id);
    result = result.filter(d => groupStages.includes(d.status));
  }

  if (filterStatus.value) {
    result = result.filter(d => d.status === filterStatus.value);
  }

  if (filterDateFrom.value) {
    result = result.filter(d => new Date(d.createdAt) >= new Date(filterDateFrom.value));
  }

  if (filterDateTo.value) {
    result = result.filter(d => new Date(d.createdAt) <= new Date(filterDateTo.value));
  }

  // Sorting
  result.sort((a, b) => {
    let valA: any = a[sortField.value as keyof Deal] ?? '';
    let valB: any = b[sortField.value as keyof Deal] ?? '';
    if (sortField.value === 'valorEstimado') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }
    if (sortField.value === 'updatedAt' || sortField.value === 'createdAt') {
      valA = new Date(valA as string).getTime();
      valB = new Date(valB as string).getTime();
    }
    if (sortDir.value === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });

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

function isOverdue(date: string): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function getGroupStages(groupId: string): PipelineStage[] {
  return allStages.filter(s => s.group === groupId);
}

function getGroupDealsCount(groupId: string): number {
  const groupStages = getGroupStages(groupId).map(s => s.id);
  return deals.value.filter(d => groupStages.includes(d.status)).length;
}

function toggleGroup(groupId: string) {
  const index = collapsedGroups.value.indexOf(groupId);
  if (index > -1) {
    collapsedGroups.value.splice(index, 1);
  } else {
    collapsedGroups.value.push(groupId);
  }
}

function getStageDeals(stageId: string): Deal[] {
  return deals.value.filter(d => d.status === stageId);
}

function getStageValue(stageId: string): number {
  return getStageDeals(stageId).reduce((sum, d) => sum + (d.valorEstimado || 0), 0);
}

function getStagePercent(stageId: string): number {
  const total = totalPipelineValue.value || 1;
  return Math.round((getStageValue(stageId) / total) * 100);
}

function getStageColor(status: string): string {
  return allStages.find(s => s.id === status)?.color || '#6b7280';
}

function getStageLabel(status: string): string {
  return allStages.find(s => s.id === status)?.label || status;
}

function sortBy(field: string) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDir.value = 'desc';
  }
}

// Drag & Drop
function handleDragStart(event: DragEvent, deal: Deal) {
  draggedDeal.value = deal;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragEnd() {
  draggedDeal.value = null;
  dragOverStage.value = null;
}

function handleDragEnter(event: DragEvent, stageId: string) {
  event.preventDefault();
  dragOverStage.value = stageId;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
}

async function handleDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  dragOverStage.value = null;
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

async function fetchAnalytics() {
  try {
    const response = await fetch('/api/admin/comercial/analytics');
    const data = await response.json();
    if (data.success) {
      analytics.value = data.analytics;
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
}

async function fetchDeals() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/comercial');
    const data = await response.json();
    if (data.success) {
      deals.value = data.data.map((d: any) => ({
        ...d,
        valorEstimado: d.valorEstimado || d.budgetEstimado || 0,
        m2Estimado: d.metragemEstimada || d.m2Estimado || '',
        cliente: d.project?.cliente || d.cliente || 'Sem nome'
      }));
    }
  } catch (error) {
    console.error('Error fetching deals:', error);
  } finally {
    loading.value = false;
  }
}

async function createDeal() {
  if (!newDeal.value.cliente) {
    alert('Nome do cliente é obrigatório');
    return;
  }
  loading.value = true;
  try {
    const response = await fetch('/api/admin/comercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal.value)
    });
    const data = await response.json();
    if (data.success) {
      deals.value.unshift({
        ...data.data,
        cliente: data.data.project?.cliente || newDeal.value.cliente
      });
      closeCreateModal();
      await fetchStats();
    } else {
      alert(data.error || 'Erro ao criar lead');
    }
  } catch (error) {
    console.error('Error creating deal:', error);
    alert('Erro ao criar lead');
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
        deals.value[index] = { ...deals.value[index], ...data.data };
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
  if (!selectedDeal.value || !newFollowUp.value.agendadoPara) return;
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
      newFollowUp.value = { tipo: 'LIGACAO', canal: 'WHATSAPP', agendadoPara: '', mensagem: '' };
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
        followUp.status = 'REALIZADO';
      }
    }
  } catch (error) {
    console.error('Error completing follow-up:', error);
  } finally {
    loading.value = false;
  }
}

function confirmDelete() {
  if (confirm('Tem certeza que deseja excluir este negócio?')) {
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
  activeTab.value = 'info';
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
    cidadeExecucao: '',
    tipoCliente: '',
    tipoProjeto: '',
    valorEstimado: 0,
    metragemEstimada: '',
    origem: '',
    resumo: '',
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
  fetchAnalytics();
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
  max-width: 1920px;
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
  max-width: 1920px;
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

.stat-icon.deals {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.stat-icon.ganhos {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.stat-icon.conversion {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
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

/* Analytics Section */
.analytics-section {
  padding: 0 32px 32px;
  max-width: 1920px;
  margin: 0 auto;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.analytics-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
}

.analytics-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px 0;
}

.analytics-card h4 {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  margin: 20px 0 12px 0;
}

/* Funnel Chart */
.funnel-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.funnel-stage {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.4s ease-out backwards;
  animation-delay: var(--delay);
}

.funnel-bar {
  height: 36px;
  width: var(--width);
  min-width: 100px;
  background: var(--color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  transition: transform 0.2s ease;
}

.funnel-bar:hover {
  transform: scaleX(1.02);
}

.funnel-label {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.funnel-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.funnel-percent {
  font-size: 13px;
  color: #888;
  min-width: 40px;
  text-align: right;
}

/* Follow-up Stats */
.followup-stats {
  display: flex;
  gap: 20px;
}

.followup-stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.followup-stat.today {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.followup-stat.overdue {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.followup-stat.scheduled {
  background: rgba(201, 169, 98, 0.1);
  border: 1px solid rgba(201, 169, 98, 0.2);
}

.followup-number {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.followup-stat.overdue .followup-number {
  color: #ef4444;
}

.followup-stat.today .followup-number {
  color: #3b82f6;
}

.followup-stat.scheduled .followup-number {
  color: #c9a962;
}

.followup-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.timeline-client {
  font-size: 13px;
  color: #fff;
}

.timeline-date {
  font-size: 12px;
  color: #888;
}

/* Performance Metrics */
.performance-metrics {
  display: flex;
  gap: 20px;
}

.metric {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #c9a962;
  display: block;
}

.metric-label {
  font-size: 13px;
  color: #888;
  margin-top: 8px;
  display: block;
}

/* Value Bars */
.value-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.value-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.value-bar-label {
  font-size: 12px;
  color: #888;
  min-width: 120px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.value-bar-container {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.value-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.value-bar-amount {
  font-size: 12px;
  color: #fff;
  min-width: 80px;
  text-align: right;
}

/* Stage Groups */
.stage-groups {
  display: flex;
  gap: 8px;
  padding: 0 32px 16px;
  max-width: 1920px;
  margin: 0 auto;
  overflow-x: auto;
}

.group-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.group-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.group-toggle.collapsed {
  opacity: 0.5;
}

.group-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.group-toggle.collapsed svg {
  transform: rotate(-90deg);
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.group-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #888;
}

/* Pipeline Section */
.pipeline-section {
  padding: 0 32px 32px;
  max-width: 1920px;
  margin: 0 auto;
}

.pipeline-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.pipeline-column {
  min-width: 260px;
  max-width: 260px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  animation: slideIn 0.4s ease-out backwards;
  animation-delay: calc(var(--column-index) * 0.03s);
}

.pipeline-column.drag-over {
  background: rgba(201, 169, 98, 0.1);
  border-color: rgba(201, 169, 98, 0.3);
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
  margin-bottom: 6px;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #888;
}

.column-value {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
}

.column-percent {
  color: #888;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 450px);
}

.deal-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.deal-card:hover {
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.deal-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.deal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.deal-client {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  flex: 1;
}

.deal-value {
  font-size: 12px;
  font-weight: 600;
  color: #c9a962;
  white-space: nowrap;
}

.deal-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
}

.deal-info svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.deal-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.deal-m2 {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.deal-m2 svg {
  width: 10px;
  height: 10px;
}

.deal-source {
  font-size: 10px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.deal-date {
  font-size: 10px;
  color: #555;
}

.deal-followup {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 10px;
  color: #c9a962;
}

.deal-followup.overdue {
  color: #ef4444;
}

.deal-followup svg {
  width: 10px;
  height: 10px;
}

.deal-auto-escalation {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 10px;
  color: #f59e0b;
}

.deal-auto-escalation svg {
  width: 10px;
  height: 10px;
}

.add-deal-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-deal-btn svg {
  width: 18px;
  height: 18px;
}

.add-deal-btn:hover {
  border-color: rgba(201, 169, 98, 0.3);
  color: #c9a962;
  background: rgba(201, 169, 98, 0.05);
}

/* Card List Transition */
.card-list-move,
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-list-leave-active {
  position: absolute;
}

/* List Section */
.list-section {
  padding: 0 32px 32px;
  max-width: 1920px;
  margin: 0 auto;
}

.list-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
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
  min-width: 150px;
  cursor: pointer;
}

.filter-select option {
  background: #1a1a1a;
}

.filter-date {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
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
  padding: 16px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.list-table th.sortable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.list-table th.sortable:hover {
  color: #c9a962;
}

.list-table th svg {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  vertical-align: middle;
}

.list-table td {
  padding: 14px 16px;
  font-size: 13px;
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

.client-type {
  font-size: 11px;
  color: #666;
}

.status-badge {
  display: inline-flex;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  color: var(--status-color);
  border: 1px solid var(--status-color);
  opacity: 0.9;
}

.status-badge.large {
  padding: 6px 14px;
  font-size: 12px;
}

.value-cell {
  font-weight: 600;
  color: #c9a962;
}

.source-cell {
  color: #888;
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
  width: 18px;
  height: 18px;
}

.list-empty {
  text-align: center;
  padding: 60px 20px;
  color: #555;
}

.list-empty svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.list-empty p {
  margin: 0;
  font-size: 14px;
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
  width: 560px;
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

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-tab {
  padding: 14px 20px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.panel-tab:hover {
  color: #fff;
}

.panel-tab.active {
  color: #c9a962;
  border-bottom-color: #c9a962;
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
  margin-bottom: 24px;
}

.panel-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.panel-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  margin: 20px 0 12px 0;
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

.info-item.highlight {
  background: rgba(201, 169, 98, 0.1);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(201, 169, 98, 0.2);
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
  font-size: 20px !important;
  font-weight: 700;
  color: #c9a962 !important;
}

.status-flow {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-group-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-group-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #888;
  font-size: 11px;
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

.form-row {
  display: flex;
  gap: 12px;
}

.form-row > * {
  flex: 1;
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
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.followup-item.completed {
  opacity: 0.5;
}

.followup-item.overdue {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
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

.followup-icon.whatsapp {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.followup-icon.reuniao,
.followup-icon.visita {
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

.followup-status {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.followup-status.agendado {
  background: rgba(201, 169, 98, 0.2);
  color: #c9a962;
}

.followup-status.realizado {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.followup-date {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
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

/* Timeline */
.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-event {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
}

.timeline-event::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 40px;
  bottom: -1px;
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.timeline-event:last-child::before {
  display: none;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #666;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-dot.status_change {
  background: #c9a962;
}

.timeline-dot.followup {
  background: #22c55e;
}

.timeline-dot.auto_escalation {
  background: #f59e0b;
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.timeline-date {
  font-size: 11px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #555;
  font-size: 14px;
}

.notes-textarea {
  width: 100%;
  min-height: 100px;
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
  max-width: 640px;
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
@media (max-width: 1400px) {
  .analytics-grid {
    grid-template-columns: 1fr;
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
    flex-wrap: wrap;
  }

  .stats-section {
    padding: 16px 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stage-groups {
    padding: 0 20px 16px;
  }

  .pipeline-section,
  .list-section,
  .analytics-section {
    padding: 0 20px 20px;
  }

  .pipeline-column {
    min-width: 240px;
    max-width: 240px;
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

  .funnel-bar {
    min-width: 80px;
  }

  .performance-metrics {
    flex-direction: column;
  }

  .followup-stats {
    flex-direction: column;
  }
}
</style>
