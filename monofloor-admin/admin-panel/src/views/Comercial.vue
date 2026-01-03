<template>
  <div class="crm">
    <!-- Header - Hidden during loading -->
    <header class="crm-header" v-if="!loading">
      <div class="crm-header__top">
        <div class="crm-header__title-row">
          <!-- Pixel Train with Smoke -->
          <div class="pixel-train">
            <svg class="train-svg" viewBox="0 0 64 40" fill="none">
              <g transform="translate(64,0) scale(-1,1)">
              <!-- Smoke particles -->
              <circle class="smoke smoke-1" cx="20" cy="8" r="3" fill="#666"/>
              <circle class="smoke smoke-2" cx="14" cy="5" r="2.5" fill="#888"/>
              <circle class="smoke smoke-3" cx="8" cy="3" r="2" fill="#aaa"/>
              <circle class="smoke smoke-4" cx="24" cy="4" r="2" fill="#777"/>
              <!-- Chimney -->
              <rect x="18" y="12" width="6" height="8" fill="#1a1a1a"/>
              <!-- Boiler -->
              <rect x="12" y="18" width="24" height="14" rx="2" fill="#1a1a1a"/>
              <!-- Cabin -->
              <rect x="36" y="14" width="14" height="18" fill="#1a1a1a"/>
              <rect x="38" y="16" width="4" height="4" fill="#FFE566"/>
              <rect x="44" y="16" width="4" height="4" fill="#FFE566"/>
              <!-- Wheels -->
              <circle cx="18" cy="34" r="5" fill="#1a1a1a"/>
              <circle cx="18" cy="34" r="2" fill="#c9a962"/>
              <circle cx="30" cy="34" r="5" fill="#1a1a1a"/>
              <circle cx="30" cy="34" r="2" fill="#c9a962"/>
              <circle cx="44" cy="34" r="4" fill="#1a1a1a"/>
              <circle cx="44" cy="34" r="1.5" fill="#c9a962"/>
              <!-- Front light -->
              <rect x="8" y="22" width="4" height="6" rx="1" fill="#FFE566"/>
              <!-- Details -->
              <rect x="14" y="24" width="20" height="2" fill="#c9a962"/>
              <rect x="36" y="28" width="14" height="2" fill="#c9a962"/>
              </g>
            </svg>
          </div>

          <div class="crm-header__title-text">
            <span class="title-prefix">A MÁQUINA DE VENDAS DA</span>
            <!-- Monofloor Logo - Pixel art traced from original -->
            <svg class="monofloor-logo-svg pixel-logo" viewBox="0 0 268 32" fill="#1a1a1a">
              <!-- Each pixel = 2x2 units. Traced exactly from original logo -->

              <!-- ===== m ===== -->
              <!-- Left vertical stem -->
              <rect x="0" y="8" width="4" height="24"/>
              <!-- First arch - left curve up -->
              <rect x="4" y="6" width="2" height="4"/>
              <rect x="6" y="4" width="2" height="4"/>
              <rect x="8" y="2" width="2" height="4"/>
              <!-- First arch - top -->
              <rect x="10" y="0" width="6" height="4"/>
              <!-- First arch - right curve down -->
              <rect x="16" y="2" width="2" height="4"/>
              <rect x="18" y="4" width="2" height="4"/>
              <rect x="20" y="6" width="2" height="4"/>
              <!-- Middle vertical stem -->
              <rect x="22" y="8" width="4" height="24"/>
              <!-- Second arch - left curve up -->
              <rect x="26" y="6" width="2" height="4"/>
              <rect x="28" y="4" width="2" height="4"/>
              <rect x="30" y="2" width="2" height="4"/>
              <!-- Second arch - top -->
              <rect x="32" y="0" width="6" height="4"/>
              <!-- Second arch - right curve down -->
              <rect x="38" y="2" width="2" height="4"/>
              <rect x="40" y="4" width="2" height="4"/>
              <rect x="42" y="6" width="2" height="4"/>
              <!-- Right vertical stem -->
              <rect x="44" y="8" width="4" height="24"/>

              <!-- ===== o ===== -->
              <!-- Top curve -->
              <rect x="56" y="4" width="2" height="2"/>
              <rect x="58" y="2" width="2" height="2"/>
              <rect x="60" y="0" width="8" height="4"/>
              <rect x="68" y="2" width="2" height="2"/>
              <rect x="70" y="4" width="2" height="2"/>
              <!-- Left side -->
              <rect x="54" y="6" width="4" height="20"/>
              <!-- Right side -->
              <rect x="70" y="6" width="4" height="20"/>
              <!-- Bottom curve -->
              <rect x="56" y="26" width="2" height="2"/>
              <rect x="58" y="28" width="2" height="2"/>
              <rect x="60" y="28" width="8" height="4"/>
              <rect x="68" y="28" width="2" height="2"/>
              <rect x="70" y="26" width="2" height="2"/>

              <!-- ===== n ===== -->
              <!-- Left vertical -->
              <rect x="82" y="8" width="4" height="24"/>
              <!-- Arch curve up -->
              <rect x="86" y="6" width="2" height="4"/>
              <rect x="88" y="4" width="2" height="4"/>
              <rect x="90" y="2" width="2" height="4"/>
              <!-- Arch top -->
              <rect x="92" y="0" width="8" height="4"/>
              <!-- Arch curve down -->
              <rect x="100" y="2" width="2" height="4"/>
              <rect x="102" y="4" width="2" height="4"/>
              <rect x="104" y="6" width="2" height="4"/>
              <!-- Right vertical -->
              <rect x="106" y="8" width="4" height="24"/>

              <!-- ===== o ===== -->
              <!-- Top curve -->
              <rect x="118" y="4" width="2" height="2"/>
              <rect x="120" y="2" width="2" height="2"/>
              <rect x="122" y="0" width="8" height="4"/>
              <rect x="130" y="2" width="2" height="2"/>
              <rect x="132" y="4" width="2" height="2"/>
              <!-- Left side -->
              <rect x="116" y="6" width="4" height="20"/>
              <!-- Right side -->
              <rect x="132" y="6" width="4" height="20"/>
              <!-- Bottom curve -->
              <rect x="118" y="26" width="2" height="2"/>
              <rect x="120" y="28" width="2" height="2"/>
              <rect x="122" y="28" width="8" height="4"/>
              <rect x="130" y="28" width="2" height="2"/>
              <rect x="132" y="26" width="2" height="2"/>

              <!-- ===== f ===== -->
              <!-- Top curve -->
              <rect x="146" y="4" width="2" height="2"/>
              <rect x="148" y="2" width="2" height="2"/>
              <rect x="150" y="0" width="10" height="4"/>
              <!-- Vertical stem -->
              <rect x="144" y="6" width="4" height="26"/>
              <!-- Crossbar -->
              <rect x="144" y="14" width="12" height="4"/>

              <!-- ===== l ===== -->
              <!-- Vertical -->
              <rect x="164" y="0" width="4" height="26"/>
              <!-- Bottom curve -->
              <rect x="168" y="24" width="2" height="4"/>
              <rect x="170" y="26" width="2" height="4"/>
              <rect x="172" y="28" width="8" height="4"/>

              <!-- ===== o ===== -->
              <!-- Top curve -->
              <rect x="186" y="4" width="2" height="2"/>
              <rect x="188" y="2" width="2" height="2"/>
              <rect x="190" y="0" width="8" height="4"/>
              <rect x="198" y="2" width="2" height="2"/>
              <rect x="200" y="4" width="2" height="2"/>
              <!-- Left side -->
              <rect x="184" y="6" width="4" height="20"/>
              <!-- Right side -->
              <rect x="200" y="6" width="4" height="20"/>
              <!-- Bottom curve -->
              <rect x="186" y="26" width="2" height="2"/>
              <rect x="188" y="28" width="2" height="2"/>
              <rect x="190" y="28" width="8" height="4"/>
              <rect x="198" y="28" width="2" height="2"/>
              <rect x="200" y="26" width="2" height="2"/>

              <!-- ===== o ===== -->
              <!-- Top curve -->
              <rect x="214" y="4" width="2" height="2"/>
              <rect x="216" y="2" width="2" height="2"/>
              <rect x="218" y="0" width="8" height="4"/>
              <rect x="226" y="2" width="2" height="2"/>
              <rect x="228" y="4" width="2" height="2"/>
              <!-- Left side -->
              <rect x="212" y="6" width="4" height="20"/>
              <!-- Right side -->
              <rect x="228" y="6" width="4" height="20"/>
              <!-- Bottom curve -->
              <rect x="214" y="26" width="2" height="2"/>
              <rect x="216" y="28" width="2" height="2"/>
              <rect x="218" y="28" width="8" height="4"/>
              <rect x="226" y="28" width="2" height="2"/>
              <rect x="228" y="26" width="2" height="2"/>

              <!-- ===== r ===== -->
              <!-- Vertical -->
              <rect x="240" y="8" width="4" height="24"/>
              <!-- Top curve -->
              <rect x="244" y="6" width="2" height="4"/>
              <rect x="246" y="4" width="2" height="4"/>
              <rect x="248" y="2" width="2" height="4"/>
              <rect x="250" y="0" width="8" height="4"/>
              <!-- Small curve down at end -->
              <rect x="258" y="2" width="2" height="4"/>
              <rect x="260" y="4" width="2" height="4"/>

              <!-- ===== ® ===== -->
              <rect x="264" y="0" width="1" height="1"/>
              <rect x="265" y="0" width="2" height="1"/>
              <rect x="267" y="0" width="1" height="1"/>
              <rect x="263" y="1" width="1" height="1"/>
              <rect x="268" y="1" width="1" height="1"/>
              <rect x="263" y="2" width="1" height="2"/>
              <rect x="268" y="2" width="1" height="2"/>
              <rect x="263" y="4" width="1" height="1"/>
              <rect x="268" y="4" width="1" height="1"/>
              <rect x="264" y="5" width="1" height="1"/>
              <rect x="265" y="5" width="2" height="1"/>
              <rect x="267" y="5" width="1" height="1"/>
              <!-- R letter inside -->
              <rect x="265" y="1" width="1" height="3"/>
              <rect x="266" y="1" width="1" height="1"/>
              <rect x="266" y="2" width="1" height="1"/>
              <rect x="267" y="3" width="1" height="2"/>
            </svg>
          </div>
        </div>

        <!-- Seletor de Especialista -->
        <div class="specialist-selector" @click="showSpecialistModal = true">
          <span class="specialist-label">ESPECIALISTA</span>
          <span class="specialist-name pixel-text">{{ selectedSpecialistFirstName || 'TODOS' }}</span>
          <svg class="specialist-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div class="crm-header__actions">
          <button class="btn btn--ghost" @click="showPipelineSettings = true" title="Configurar Pipeline">
            <span>⚙️</span>
          </button>
          <button class="btn btn--outline" @click="toggleFilters">
            <span>⚡</span> Filtros
          </button>
          <button class="btn btn--primary" @click="openNewDeal()">
            <span>+</span> Novo Deal
          </button>
        </div>
      </div>

      <!-- KPIs Row -->
      <div class="crm-kpis">
        <div class="kpi-card kpi-card--deals">
          <div class="kpi-card__icon">🎯</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ totalDeals }}</span>
            <span class="kpi-card__label">Deals Ativos</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--pipeline">
          <div class="kpi-card__icon">💰</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ formatCurrency(totalValue) }}</span>
            <span class="kpi-card__label">Em Pipeline</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--won">
          <div class="kpi-card__icon">🏆</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ getStageDeals('GANHO').length }}</span>
            <span class="kpi-card__label">Ganhos</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--conversion">
          <div class="kpi-card__icon">📈</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ conversionRate }}%</span>
            <span class="kpi-card__label">Taxa Conversão</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--avg">
          <div class="kpi-card__icon">⏱️</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ avgDaysInPipeline }}d</span>
            <span class="kpi-card__label">Tempo Médio</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--ticket">
          <div class="kpi-card__icon">🎫</div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ formatCurrency(avgTicket) }}</span>
            <span class="kpi-card__label">Ticket Médio</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Filters Bar -->
    <div v-if="showFilters && !loading" class="filters-bar">
      <div class="filter-group">
        <label class="filter-label">Buscar</label>
        <input
          type="text"
          class="filter-input"
          placeholder="Nome do cliente..."
          v-model="searchQuery"
        />
      </div>
      <div class="filter-group">
        <label class="filter-label">Consultor</label>
        <select class="filter-select" v-model="selectedConsultor">
          <option value="">Todos</option>
          <option v-for="c in consultores" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Período</label>
        <select class="filter-select" v-model="selectedPeriod">
          <option value="">Todos</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Este ano</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Ordenar por</label>
        <select class="filter-select" v-model="sortBy">
          <option value="recent">Mais Recentes</option>
          <option value="oldest">Mais Antigos</option>
          <option value="value-high">Maior Valor</option>
          <option value="value-low">Menor Valor</option>
          <option value="name-az">Nome A-Z</option>
          <option value="name-za">Nome Z-A</option>
          <option value="days-high">Mais Dias no Estágio</option>
          <option value="days-low">Menos Dias no Estágio</option>
        </select>
      </div>
      <button class="btn btn--small btn--outline" @click="clearFilters">
        Limpar
      </button>
    </div>

    <!-- Pipeline -->
    <div class="pipeline" ref="pipelineRef" v-if="!loading">
      <div
        v-for="(stage, stageIndex) in stages"
        :key="stage.id"
        class="pipeline-column"
        :class="[
          `pipeline-column--${stage.color}`,
          { 'pipeline-column--drag-over': dragOverStage === stage.id }
        ]"
        :style="{ '--delay': stageIndex * 0.05 + 's' }"
        @dragover.prevent="handleDragOver($event, stage.id)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, stage.id)"
      >
        <div class="pipeline-column__header">
          <div class="pipeline-column__title">
            <span class="pipeline-column__emoji">{{ stage.emoji }}</span>
            <span>{{ stage.name }}</span>
          </div>
          <div class="pipeline-column__meta">
            <span class="pipeline-column__count">{{ getStageDeals(stage.id).length }}</span>
            <span class="pipeline-column__value">{{ formatCurrency(getStageValue(stage.id)) }}</span>
          </div>
        </div>

        <!-- Botão adicionar no topo -->
        <button class="pipeline-column__add" @click="openNewDeal(stage.id)">
          + Adicionar deal
        </button>

        <div class="pipeline-column__body">
          <TransitionGroup name="card" tag="div" class="pipeline-column__cards">
            <div
              v-for="deal in getStageDeals(stage.id)"
              :key="deal.id"
              class="deal-card"
              :class="{ 'deal-card--dragging': draggingDeal?.id === deal.id }"
              draggable="true"
              @dragstart="handleDragStart($event, deal)"
              @dragend="handleDragEnd"
              @click="openDealDetail(deal)"
            >
              <div class="deal-card__header">
                <span class="deal-card__name">{{ deal.clientName || 'Sem nome' }}</span>
                <span class="deal-card__id">#{{ deal.pipedriveDealId || deal.id.slice(-4) }}</span>
              </div>

              <!-- Tags: Tipo Cliente + Metragem -->
              <div class="deal-card__tags" v-if="deal.tipoCliente || deal.metragemEstimadaN1">
                <span v-if="deal.tipoCliente" class="deal-card__tag deal-card__tag--tipo">
                  {{ deal.tipoCliente === 'Consumidor Final' ? '🏠' : '👷' }} {{ deal.tipoCliente }}
                </span>
                <span v-if="deal.metragemEstimadaN1" class="deal-card__tag deal-card__tag--m2">
                  📐 {{ deal.metragemEstimadaN1 }}
                </span>
              </div>

              <div class="deal-card__value">
                {{ formatCurrency(deal.value || 0) }}
              </div>

              <!-- Cidade -->
              <div class="deal-card__location" v-if="deal.cidadeExecucao">
                📍 {{ deal.cidadeExecucao }}
              </div>

              <div class="deal-card__footer">
                <div class="deal-card__avatar" :title="deal.consultor">
                  {{ getInitials(deal.consultor) }}
                </div>
                <div class="deal-card__days" :class="getDaysClass(deal.daysInStage)">
                  {{ deal.daysInStage || 0 }}d
                </div>
              </div>

              <div class="deal-card__actions">
                <button class="deal-action" title="WhatsApp" @click.stop="sendWhatsApp(deal)">
                  💬
                </button>
                <button class="deal-action" title="Pipedrive" @click.stop="openPipedriveLink(deal.pipedriveUrl)">
                  🔗
                </button>
                <button class="deal-action" title="Mais" @click.stop="openMenu(deal, $event)">
                  ⋯
                </button>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="getStageDeals(stage.id).length === 0" class="pipeline-column__empty">
            <span class="pipeline-column__empty-icon">🎯</span>
            <span>Arraste deals aqui</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Deal Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedDeal" class="modal-overlay" @click.self="closeDealDetail">
        <div class="modal modal--large">
          <div class="modal__header">
            <div class="modal__header-content">
              <h2 class="modal__title">{{ selectedDeal.clientName }}</h2>
              <div class="modal__badges">
                <span v-if="selectedDeal.tipoCliente" class="badge badge--tipo">
                  {{ selectedDeal.tipoCliente }}
                </span>
                <span v-if="selectedDeal.tipoProjeto" class="badge badge--projeto">
                  {{ selectedDeal.tipoProjeto }}
                </span>
              </div>
            </div>
            <div class="modal__actions">
              <a v-if="selectedDeal.pipedriveUrl" :href="selectedDeal.pipedriveUrl" target="_blank" class="btn btn--ghost btn--icon" title="Abrir no Pipedrive">
                🔗
              </a>
              <button class="modal__close" @click="closeDealDetail">✕</button>
            </div>
          </div>
          <div class="modal__body modal__body--scroll">
            <!-- Valor e Status -->
            <div class="detail-section">
              <h3 class="detail-section__title">Resumo</h3>
              <div class="detail-grid detail-grid--highlight">
                <div class="detail-item detail-item--highlight">
                  <span class="detail-label">Valor</span>
                  <template v-if="editingField === 'value'">
                    <input
                      type="number"
                      class="inline-edit-input inline-edit-input--large"
                      v-model="editingValue"
                      @blur="handleFieldBlur('value')"
                      @keydown="handleFieldKeydown($event, 'value')"
                      ref="editInput"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--large detail-value--editable" @click="startEditing('value', selectedDeal.value)" title="Clique para editar">
                    {{ formatCurrency(selectedDeal.value || 0) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estágio</span>
                  <span class="detail-value detail-value--stage" :style="{ '--stage-color': getStageColor(selectedDeal.status) }">
                    {{ stages.find(s => s.id === selectedDeal?.status)?.emoji }}
                    {{ stages.find(s => s.id === selectedDeal?.status)?.name || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Dias no Estágio</span>
                  <span class="detail-value" :class="getDaysClass(selectedDeal.daysInStage)">
                    {{ selectedDeal.daysInStage || 0 }} dias
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Consultor</span>
                  <template v-if="editingField === 'consultor'">
                    <select
                      class="inline-edit-select"
                      v-model="editingValue"
                      @blur="handleFieldBlur('consultor')"
                      @change="saveField('consultor')"
                      autofocus
                    >
                      <option value="">Selecione...</option>
                      <option v-for="c in availableConsultores" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('consultor', selectedDeal.consultor)" title="Clique para editar">
                    {{ selectedDeal.consultor || 'N/A' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Contato -->
            <div class="detail-section">
              <h3 class="detail-section__title">Contato</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Telefone</span>
                  <template v-if="editingField === 'phone'">
                    <input
                      type="tel"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('phone')"
                      @keydown="handleFieldKeydown($event, 'phone')"
                      placeholder="(11) 99999-9999"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('phone', selectedDeal.phone)" title="Clique para editar">
                    📱 {{ selectedDeal.phone || 'N/A' }}
                    <span class="edit-action" @click.stop="sendWhatsApp(selectedDeal)">💬</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <template v-if="editingField === 'personEmail'">
                    <input
                      type="email"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('personEmail')"
                      @keydown="handleFieldKeydown($event, 'personEmail')"
                      placeholder="email@exemplo.com"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('personEmail', selectedDeal.personEmail)" title="Clique para editar">
                    {{ selectedDeal.personEmail || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">WhatsApp (Z-API)</span>
                  <span class="detail-value">{{ selectedDeal.telefoneZapi || selectedDeal.phone || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nome Z-API</span>
                  <span class="detail-value">{{ selectedDeal.primeiroNomeZapi || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Projeto -->
            <div class="detail-section">
              <h3 class="detail-section__title">Dados do Projeto</h3>
              <div class="detail-grid">
                <div class="detail-item detail-item--full">
                  <span class="detail-label">Endereço</span>
                  <template v-if="editingField === 'endereco'">
                    <input
                      type="text"
                      class="inline-edit-input inline-edit-input--full"
                      v-model="editingValue"
                      @blur="handleFieldBlur('endereco')"
                      @keydown="handleFieldKeydown($event, 'endereco')"
                      placeholder="Rua, número, bairro, cidade"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('endereco', selectedDeal.endereco || selectedDeal.cidadeExecucaoDesc)" title="Clique para editar">
                    {{ selectedDeal.endereco || selectedDeal.cidadeExecucaoDesc || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Cidade</span>
                  <template v-if="editingField === 'cidadeExecucao'">
                    <input
                      type="text"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('cidadeExecucao')"
                      @keydown="handleFieldKeydown($event, 'cidadeExecucao')"
                      placeholder="São Paulo"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('cidadeExecucao', selectedDeal.cidadeExecucao)" title="Clique para editar">
                    {{ selectedDeal.cidadeExecucao || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">M² Estimado</span>
                  <template v-if="editingField === 'metragemEstimada'">
                    <input
                      type="number"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('metragemEstimada')"
                      @keydown="handleFieldKeydown($event, 'metragemEstimada')"
                      placeholder="150"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--metric detail-value--editable" @click="startEditing('metragemEstimada', selectedDeal.metragemEstimada || selectedDeal.m2Total)" title="Clique para editar">
                    {{ selectedDeal.metragemEstimada || selectedDeal.m2Total || 0 }} m²
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Faixa Metragem</span>
                  <span class="detail-value">{{ selectedDeal.metragemEstimadaN1 || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado da Obra</span>
                  <template v-if="editingField === 'estadoObra'">
                    <input
                      type="text"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('estadoObra')"
                      @keydown="handleFieldKeydown($event, 'estadoObra')"
                      placeholder="Em andamento"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('estadoObra', selectedDeal.estadoObra)" title="Clique para editar">
                    {{ selectedDeal.estadoObra || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Budget Estimado</span>
                  <template v-if="editingField === 'budgetEstimado'">
                    <input
                      type="text"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('budgetEstimado')"
                      @keydown="handleFieldKeydown($event, 'budgetEstimado')"
                      placeholder="R$ 50.000 - R$ 100.000"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('budgetEstimado', selectedDeal.budgetEstimado)" title="Clique para editar">
                    {{ selectedDeal.budgetEstimado || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Data Prevista Execução</span>
                  <template v-if="editingField === 'dataPrevistaExec'">
                    <input
                      type="text"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('dataPrevistaExec')"
                      @keydown="handleFieldKeydown($event, 'dataPrevistaExec')"
                      placeholder="Jan/2026"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('dataPrevistaExec', selectedDeal.dataPrevistaExec)" title="Clique para editar">
                    {{ selectedDeal.dataPrevistaExec || 'N/A' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Arquiteto/Escritório -->
            <div class="detail-section" v-if="selectedDeal.tipoCliente === 'Arquiteto' || selectedDeal.nomeEscritorio">
              <h3 class="detail-section__title">Arquiteto / Escritório</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Nome do Escritório</span>
                  <template v-if="editingField === 'nomeEscritorio'">
                    <input
                      type="text"
                      class="inline-edit-input"
                      v-model="editingValue"
                      @blur="handleFieldBlur('nomeEscritorio')"
                      @keydown="handleFieldKeydown($event, 'nomeEscritorio')"
                      placeholder="Nome do escritório"
                      autofocus
                    />
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('nomeEscritorio', selectedDeal.nomeEscritorio)" title="Clique para editar">
                    {{ selectedDeal.nomeEscritorio || 'N/A' }}
                  </span>
                </div>
                <div class="detail-item detail-item--full">
                  <span class="detail-label">Detalhes do Arquiteto</span>
                  <template v-if="editingField === 'detalhesArquiteto'">
                    <textarea
                      class="inline-edit-textarea"
                      v-model="editingValue"
                      @blur="handleFieldBlur('detalhesArquiteto')"
                      @keydown.esc="cancelEditing"
                      placeholder="Detalhes sobre o arquiteto..."
                      rows="3"
                      autofocus
                    ></textarea>
                  </template>
                  <span v-else class="detail-value detail-value--editable" @click="startEditing('detalhesArquiteto', selectedDeal.detalhesArquiteto)" title="Clique para editar">
                    {{ selectedDeal.detalhesArquiteto || 'N/A' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Resumo/Observações -->
            <div class="detail-section">
              <h3 class="detail-section__title">Observações</h3>
              <div class="detail-grid">
                <div class="detail-item detail-item--full">
                  <span class="detail-label">Resumo</span>
                  <template v-if="editingField === 'resumo'">
                    <textarea
                      class="inline-edit-textarea"
                      v-model="editingValue"
                      @blur="handleFieldBlur('resumo')"
                      @keydown.esc="cancelEditing"
                      placeholder="Resumo do projeto..."
                      rows="3"
                      autofocus
                    ></textarea>
                  </template>
                  <span v-else class="detail-value detail-value--text detail-value--editable" @click="startEditing('resumo', selectedDeal.resumo)" title="Clique para editar">
                    {{ selectedDeal.resumo || 'Clique para adicionar...' }}
                  </span>
                </div>
                <div class="detail-item detail-item--full">
                  <span class="detail-label">Descritivo da Área</span>
                  <template v-if="editingField === 'descritivoArea'">
                    <textarea
                      class="inline-edit-textarea"
                      v-model="editingValue"
                      @blur="handleFieldBlur('descritivoArea')"
                      @keydown.esc="cancelEditing"
                      placeholder="Descrição da área..."
                      rows="3"
                      autofocus
                    ></textarea>
                  </template>
                  <span v-else class="detail-value detail-value--text detail-value--editable" @click="startEditing('descritivoArea', selectedDeal.descritivoArea)" title="Clique para editar">
                    {{ selectedDeal.descritivoArea || 'Clique para adicionar...' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Anexos do Projeto -->
            <div class="detail-section">
              <div class="detail-section__header">
                <h3 class="detail-section__title">📎 Anexos</h3>
                <button class="btn btn--sm btn--primary" @click="openAnexoModal">
                  + Adicionar
                </button>
              </div>
              <div v-if="loadingAnexos" class="detail-loading">Carregando anexos...</div>
              <div v-else-if="anexos.length === 0" class="detail-empty">
                Nenhum anexo. Adicione projetos arquitetônicos, plantas e documentos.
              </div>
              <div v-else class="anexos-list">
                <div v-for="anexo in anexos" :key="anexo.id" class="anexo-item">
                  <div class="anexo-item__icon">
                    {{ anexo.mimeType?.includes('pdf') ? '📄' : anexo.mimeType?.includes('image') ? '🖼️' : '📁' }}
                  </div>
                  <div class="anexo-item__info">
                    <span class="anexo-item__nome">{{ anexo.nome }}</span>
                    <span class="anexo-item__meta">
                      {{ getTipoAnexoLabel(anexo.tipo) }}
                      <span v-if="anexo.fileSize"> • {{ formatFileSize(anexo.fileSize) }}</span>
                    </span>
                  </div>
                  <div class="anexo-item__actions">
                    <button class="btn btn--ghost btn--sm" @click="downloadAnexo(anexo)" title="Baixar">
                      ⬇️
                    </button>
                    <button class="btn btn--ghost btn--sm btn--danger" @click="deleteAnexo(anexo)" title="Excluir">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Orçamentos Enviados -->
            <div class="detail-section">
              <div class="detail-section__header">
                <h3 class="detail-section__title">📤 Orçamentos Enviados</h3>
                <button class="btn btn--sm btn--primary" @click="openOrcamentoModal">
                  + Registrar Envio
                </button>
              </div>
              <div v-if="loadingOrcamentos" class="detail-loading">Carregando orçamentos...</div>
              <div v-else-if="orcamentosEnviados.length === 0" class="detail-empty">
                Nenhum orçamento enviado registrado.
              </div>
              <div v-else class="orcamentos-list">
                <div v-for="orc in orcamentosEnviados" :key="orc.id" class="orcamento-item">
                  <div class="orcamento-item__date">
                    {{ formatOrcamentoDate(orc.dataEnvio) }}
                  </div>
                  <div class="orcamento-item__info">
                    <span class="orcamento-item__valor" v-if="orc.valor">
                      {{ formatCurrency(orc.valor) }}
                    </span>
                    <span class="orcamento-item__metragem" v-if="orc.metragem">
                      {{ orc.metragem }}m²
                    </span>
                    <span class="orcamento-item__proposta" v-if="orc.proposta">
                      Proposta v{{ orc.proposta.versao }}
                    </span>
                  </div>
                  <div class="orcamento-item__desc" v-if="orc.descricao || orc.observacoes">
                    {{ orc.descricao || orc.observacoes }}
                  </div>
                  <button class="btn btn--ghost btn--sm btn--danger" @click="deleteOrcamentoEnviado(orc)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <!-- Metadados Pipedrive -->
            <div class="detail-section detail-section--meta">
              <h3 class="detail-section__title">Metadados</h3>
              <div class="detail-grid detail-grid--small">
                <div class="detail-item">
                  <span class="detail-label">ID Pipedrive</span>
                  <span class="detail-value detail-value--mono">{{ selectedDeal.pipedriveDealId || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Criado em</span>
                  <span class="detail-value">{{ formatDate(selectedDeal.dealAddTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Atualizado em</span>
                  <span class="detail-value">{{ formatDate(selectedDeal.dealUpdateTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Última sync</span>
                  <span class="detail-value">{{ formatDate(selectedDeal.pipedriveSyncedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal__footer modal__footer--proposals">
            <div class="modal__footer-left">
              <button class="btn btn--outline" @click="closeDealDetail">Fechar</button>
            </div>
            <div class="modal__footer-right">
              <!-- Botão Ver Proposta (aparece se houver proposta com PDF) -->
              <button
                v-if="ultimaProposta && ultimaProposta.pdfBase64"
                class="btn btn--info"
                @click="abrirProposta"
              >
                📥 Ver Proposta v{{ ultimaProposta.versao }}
              </button>
              <!-- Botão Enviar Proposta (aparece se houver proposta gerada) -->
              <button
                v-if="ultimaProposta"
                class="btn btn--success"
                @click="enviarPropostaWhatsApp"
                :disabled="enviandoProposta"
              >
                <span v-if="enviandoProposta">Enviando...</span>
                <span v-else>📤 Enviar Proposta v{{ ultimaProposta.versao }}</span>
              </button>
              <!-- Botão Gerar HTML (aparece se houver proposta gerada) -->
              <button
                v-if="ultimaProposta"
                class="btn btn--info"
                @click="gerarPropostaHTML"
                :disabled="gerandoHTML"
              >
                <span v-if="gerandoHTML">Gerando HTML...</span>
                <span v-else>🌐 Gerar Link HTML</span>
              </button>
              <!-- Botão Gerar Proposta -->
              <button
                class="btn btn--gold"
                @click="gerarProposta"
                :disabled="gerandoProposta"
              >
                <span v-if="gerandoProposta">Gerando...</span>
                <span v-else>📝 Gerar Proposta</span>
              </button>
              <!-- WhatsApp simples -->
              <button class="btn btn--secondary" @click="sendWhatsApp(selectedDeal)">💬 WhatsApp</button>
            </div>
            <!-- Link HTML (se existir) -->
            <div v-if="htmlPropostaUrl" class="html-link-box">
              <div class="html-link-box__header">
                <span>🔗 Link da proposta com tracking:</span>
                <button class="btn btn--small btn--secondary" @click="copyHtmlLink">📋 Copiar</button>
              </div>
              <a :href="htmlPropostaUrl" target="_blank" class="html-link-box__url">{{ htmlPropostaUrl }}</a>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- New Deal Modal -->
    <Teleport to="body">
      <div v-if="showNewDealModal" class="modal-overlay" @click.self="closeNewDeal">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">🚀 Novo Deal</h2>
            <button class="modal__close" @click="closeNewDeal">✕</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Nome do Cliente *</label>
              <input type="text" class="form-input" v-model="newDeal.clientName" placeholder="Ex: João Silva" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Valor (R$)</label>
                <input type="number" class="form-input" v-model="newDeal.value" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Estágio</label>
                <select class="form-select" v-model="newDeal.status">
                  <option v-for="stage in stages" :key="stage.id" :value="stage.id">
                    {{ stage.emoji }} {{ stage.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input type="tel" class="form-input" v-model="newDeal.phone" placeholder="(11) 99999-9999" />
            </div>
            <div class="form-group">
              <label class="form-label">Endereço</label>
              <input type="text" class="form-input" v-model="newDeal.endereco" placeholder="Rua, número, bairro" />
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="closeNewDeal">Cancelar</button>
            <button class="btn btn--primary" @click="createDeal" :disabled="!newDeal.clientName">
              Criar Deal
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Pipeline Settings Modal -->
    <Teleport to="body">
      <div v-if="showPipelineSettings" class="modal-overlay modal-overlay--large" @click.self="showPipelineSettings = false">
        <div class="modal modal--large">
          <div class="modal__header">
            <h2 class="modal__title">⚙️ Configurar Pipeline</h2>
            <button class="modal__close" @click="showPipelineSettings = false">✕</button>
          </div>
          <div class="modal__body modal__body--scroll">
            <PipelineSettings
              :stages="stagesForSettings"
              @save="handleSaveStages"
              @reset="handleResetStages"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Specialist Selector Modal -->
    <Teleport to="body">
      <div v-if="showSpecialistModal" class="modal-overlay" @click.self="showSpecialistModal = false">
        <div class="specialist-modal">
          <div class="specialist-modal__header">
            <h3>Selecionar Especialista</h3>
            <button class="modal__close" @click="showSpecialistModal = false">✕</button>
          </div>
          <div class="specialist-modal__list">
            <button
              class="specialist-option"
              :class="{ 'specialist-option--active': !selectedSpecialist }"
              @click="selectSpecialist('')"
            >
              <span class="specialist-option__name">TODOS</span>
              <span class="specialist-option__count">{{ deals.length }} deals</span>
            </button>
            <button
              v-for="consultor in consultores"
              :key="consultor"
              class="specialist-option"
              :class="{ 'specialist-option--active': selectedSpecialist === consultor }"
              @click="selectSpecialist(consultor)"
            >
              <span class="specialist-option__avatar">{{ getInitials(consultor) }}</span>
              <span class="specialist-option__name">{{ consultor }}</span>
              <span class="specialist-option__count">{{ getConsultorDeals(consultor) }} deals</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Adicionar Anexo -->
    <Teleport to="body">
      <div v-if="showAnexoModal" class="modal-overlay" @click.self="closeAnexoModal">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">📎 Adicionar Anexo</h2>
            <button class="modal__close" @click="closeAnexoModal">✕</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <select class="form-select" v-model="novoAnexo.tipo">
                <option v-for="tipo in tiposAnexo" :key="tipo.value" :value="tipo.value">
                  {{ tipo.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Arquivo</label>
              <input type="file" class="form-input" @change="handleAnexoFileSelect" accept="*/*" />
              <p class="form-hint">Máximo 10MB. PDF, imagens, documentos.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-input" v-model="novoAnexo.nome" placeholder="Nome do arquivo" />
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-textarea" v-model="novoAnexo.descricao" placeholder="Descrição opcional..." rows="2"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="closeAnexoModal">Cancelar</button>
            <button class="btn btn--primary" @click="createAnexo" :disabled="!novoAnexo.nome">
              Adicionar Anexo
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Registrar Orçamento Enviado -->
    <Teleport to="body">
      <div v-if="showOrcamentoModal" class="modal-overlay" @click.self="closeOrcamentoModal">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">📤 Registrar Orçamento Enviado</h2>
            <button class="modal__close" @click="closeOrcamentoModal">✕</button>
          </div>
          <div class="modal__body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Data de Envio *</label>
                <input type="date" class="form-input" v-model="novoOrcamento.dataEnvio" />
              </div>
              <div class="form-group">
                <label class="form-label">Valor (R$)</label>
                <input type="number" class="form-input" v-model="novoOrcamento.valor" step="0.01" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Metragem (m²)</label>
                <input type="number" class="form-input" v-model="novoOrcamento.metragem" step="0.01" />
              </div>
              <div class="form-group" v-if="ultimaProposta">
                <label class="form-label">Vincular Proposta</label>
                <select class="form-select" v-model="novoOrcamento.propostaId">
                  <option value="">Nenhuma</option>
                  <option :value="ultimaProposta.id">Proposta v{{ ultimaProposta.versao }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <input type="text" class="form-input" v-model="novoOrcamento.descricao" placeholder="Ex: Orçamento enviado por email" />
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea class="form-textarea" v-model="novoOrcamento.observacoes" placeholder="Observações adicionais..." rows="2"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="closeOrcamentoModal">Cancelar</button>
            <button class="btn btn--primary" @click="createOrcamentoEnviado" :disabled="!novoOrcamento.dataEnvio">
              Registrar Envio
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Loading State - Pixel Train on Infinity Track -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <!-- Infinity Track with Train -->
        <div class="infinity-track-container">
          <svg class="infinity-track" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- Infinity path centered -->
              <path id="infinityPath" d="M120,50 C120,75 160,75 160,50 C160,25 120,25 120,50 C120,75 80,75 80,50 C80,25 120,25 120,50"/>
            </defs>

            <!-- Simple track: just the infinity outline -->
            <use href="#infinityPath" stroke="#1a1a1a" stroke-width="3" fill="none"/>

            <!-- Smoke -->
            <circle r="4" fill="#888">
              <animateMotion dur="3.5s" repeatCount="indefinite" rotate="auto" begin="-0.1s">
                <mpath href="#infinityPath"/>
              </animateMotion>
              <animate attributeName="r" values="3;7;12" dur="0.6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.2;0" dur="0.6s" repeatCount="indefinite"/>
              <animate attributeName="cy" values="-8;-20;-35" dur="0.6s" repeatCount="indefinite"/>
            </circle>

            <!-- Pixel Train -->
            <g>
              <animateMotion dur="3.5s" repeatCount="indefinite" rotate="auto">
                <mpath href="#infinityPath"/>
              </animateMotion>
              <g transform="scale(-0.4, 0.4) translate(-32, -20)">
                <!-- Chimney -->
                <rect x="18" y="0" width="6" height="8" fill="#1a1a1a"/>
                <!-- Boiler -->
                <rect x="12" y="6" width="24" height="14" rx="2" fill="#1a1a1a"/>
                <!-- Cabin -->
                <rect x="36" y="2" width="14" height="18" fill="#1a1a1a"/>
                <rect x="38" y="4" width="4" height="4" fill="#FFE566"/>
                <rect x="44" y="4" width="4" height="4" fill="#FFE566"/>
                <!-- Wheels -->
                <circle cx="18" cy="22" r="5" fill="#1a1a1a"/>
                <circle cx="18" cy="22" r="2" fill="#c9a962"/>
                <circle cx="30" cy="22" r="5" fill="#1a1a1a"/>
                <circle cx="30" cy="22" r="2" fill="#c9a962"/>
                <circle cx="44" cy="22" r="4" fill="#1a1a1a"/>
                <circle cx="44" cy="22" r="1.5" fill="#c9a962"/>
                <!-- Light -->
                <rect x="8" y="10" width="4" height="6" rx="1" fill="#FFE566"/>
                <!-- Gold stripes -->
                <rect x="14" y="12" width="20" height="2" fill="#c9a962"/>
                <rect x="36" y="16" width="14" height="2" fill="#c9a962"/>
              </g>
            </g>
          </svg>
        </div>

        <!-- Loading text -->
        <div class="loading-text">
          <span class="loading-title">Carregando Pipeline</span>
          <div class="loading-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>

        <!-- Progress indicator -->
        <div class="loading-progress">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { comercialApi } from '@/api';
import PipelineSettings from '@/components/crm/PipelineSettings.vue';

const authStore = useAuthStore();

interface Deal {
  id: string;
  clientName?: string;
  value?: number;
  status?: string;
  consultor?: string;
  daysInStage?: number;
  endereco?: string;
  m2Total?: number;
  phone?: string;
  [key: string]: any;
}

interface Stage {
  id: string;
  name: string;
  emoji: string;
  color: string;
  groupName?: string;
  probability?: number;
  sortOrder?: number;
}

interface StageForSettings {
  id: string;
  name: string;
  color: string;
  groupName?: string;
  probability?: number;
  sortOrder?: number;
  isDefault?: boolean;
}

interface Proposta {
  id: string;
  versao: number;
  valorTotal: number;
  valorM2?: number;
  desconto?: number;
  status: string;
  pdfUrl?: string;
  pdfBase64?: string;
  metragem?: number;
  createdAt: string;
  dadosCalculo?: {
    metragemTotalStelion?: number;
    materiaisStelion?: number;
    maoObraStelion?: number;
    impostosStelion?: number;
    valorTotalStelion?: number;
    metragemTotalLilit?: number;
    materiaisLilit?: number;
    maoObraLilit?: number;
    impostosLilit?: number;
    valorTotalLilit?: number;
    metragemTotal?: number;
    materiaisTotal?: number;
    maoObraTotal?: number;
    impostosTotal?: number;
    precoBaseStelion?: number;
    precoBaseLilit?: number;
    pisoStelion?: number;
    paredeStelion?: number;
    pisoLilit?: number;
    paredeLilit?: number;
    [key: string]: any;
  };
}

const toast = useToast();

// State
const loading = ref(true);
const deals = ref<Deal[]>([]);
const showFilters = ref(false);
const showNewDealModal = ref(false);
const showPipelineSettings = ref(false);
const selectedDeal = ref<Deal | null>(null);
const draggingDeal = ref<Deal | null>(null);
const dragOverStage = ref<string | null>(null);
const pipelineRef = ref<HTMLElement | null>(null);

// Filters
const searchQuery = ref('');
const selectedConsultor = ref('');
const selectedPeriod = ref(''); // Todos por padrão
const sortBy = ref('recent');

// Specialist Selector
const showSpecialistModal = ref(false);
const selectedSpecialist = ref('');

// Inline Editing
const editingField = ref<string | null>(null);
const editingValue = ref<string>('');
const savingField = ref(false);

// Lista de consultores para o dropdown
const availableConsultores = ref<string[]>([
  'Renata Garcia Penna',
  'João Farah',
  'Isabela de Moraes',
  'Gabriel Accardo',
  'amanda vantini',
]);

// Propostas
const ultimaProposta = ref<Proposta | null>(null);
const loadingProposta = ref(false);
const gerandoProposta = ref(false);
const enviandoProposta = ref(false);
const gerandoHTML = ref(false);
const htmlPropostaUrl = ref<string | null>(null);

// Anexos do Lead
interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  createdAt: string;
}

const anexos = ref<Anexo[]>([]);
const loadingAnexos = ref(false);
const showAnexoModal = ref(false);
const novoAnexo = ref({
  nome: '',
  tipo: 'PROJETO_ARQUITETONICO',
  descricao: '',
  fileData: '',
  mimeType: '',
  fileSize: 0
});

const tiposAnexo = [
  { value: 'PROPOSTA', label: 'Proposta' },
  { value: 'PROJETO_ARQUITETONICO', label: 'Projeto Arquitetônico' },
  { value: 'PLANTA', label: 'Planta' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'IMAGEM', label: 'Imagem' },
  { value: 'OUTRO', label: 'Outro' }
];

// Orçamentos Enviados
interface OrcamentoEnviado {
  id: string;
  dataEnvio: string;
  valor?: number;
  descricao?: string;
  metragem?: number;
  observacoes?: string;
  propostaId?: string;
  proposta?: {
    id: string;
    versao: number;
    valorTotal: number;
    status: string;
  };
  createdAt: string;
}

const orcamentosEnviados = ref<OrcamentoEnviado[]>([]);
const loadingOrcamentos = ref(false);
const showOrcamentoModal = ref(false);
const novoOrcamento = ref({
  dataEnvio: new Date().toISOString().split('T')[0],
  valor: 0,
  descricao: '',
  metragem: 0,
  observacoes: '',
  propostaId: ''
});

// New Deal Form
const newDeal = ref({
  clientName: '',
  value: 0,
  status: 'FORM_ORCAMENTO',
  phone: '',
  endereco: ''
});

// Color map for settings (hex colors)
const colorMap: Record<string, string> = {
  'indigo': '#6366f1',
  'blue': '#3b82f6',
  'sky': '#0ea5e9',
  'cyan': '#06b6d4',
  'teal': '#14b8a6',
  'emerald': '#10b981',
  'green': '#22c55e',
  'lime': '#84cc16',
  'yellow': '#eab308',
  'amber': '#f59e0b',
  'orange': '#f97316',
  'orange-light': '#fb923c',
  'peach': '#fdba74',
  'sand': '#fcd34d',
  'gold': '#c9a962',
  'success': '#22c55e',
  'danger': '#ef4444'
};

// Default stages configuration
const DEFAULT_STAGES: Stage[] = [
  // Entrada
  { id: 'FORM_ORCAMENTO', name: 'Form Orçamento', emoji: '📋', color: 'indigo', groupName: 'Entrada', probability: 10, sortOrder: 0 },
  // Contato
  { id: 'PRIMEIRO_CONTATO', name: '1º Contato', emoji: '📞', color: 'blue', groupName: 'Contato', probability: 15, sortOrder: 1 },
  { id: 'CONTATO_ARQUITETO', name: 'Contato Arquiteto', emoji: '👷', color: 'sky', groupName: 'Contato', probability: 20, sortOrder: 2 },
  { id: 'AGUARDANDO_ARQ', name: 'Aguardando Arq.', emoji: '⏳', color: 'cyan', groupName: 'Contato', probability: 20, sortOrder: 3 },
  // Levantamento
  { id: 'LEVANTAMENTO', name: 'Levantamento', emoji: '📐', color: 'teal', groupName: 'Levantamento', probability: 30, sortOrder: 4 },
  { id: 'VISITA_AGENDADA', name: 'Visita Agendada', emoji: '📅', color: 'emerald', groupName: 'Levantamento', probability: 35, sortOrder: 5 },
  { id: 'VISITA_REALIZADA', name: 'Visita Realizada', emoji: '✅', color: 'green', groupName: 'Levantamento', probability: 40, sortOrder: 6 },
  // Proposta
  { id: 'PROPOSTA_EM_ELABORACAO', name: 'Proposta em Elaboração', emoji: '📝', color: 'lime', groupName: 'Proposta', probability: 50, sortOrder: 7 },
  { id: 'PROPOSTA_ENVIADA', name: 'Proposta Enviada', emoji: '📤', color: 'yellow', groupName: 'Proposta', probability: 55, sortOrder: 8 },
  // Follow-up
  { id: 'FOLLOW_1', name: 'Follow 1', emoji: '1️⃣', color: 'amber', groupName: 'Follow-up', probability: 60, sortOrder: 9 },
  { id: 'FOLLOW_2', name: 'Follow 2', emoji: '2️⃣', color: 'orange', groupName: 'Follow-up', probability: 65, sortOrder: 10 },
  { id: 'FOLLOW_3', name: 'Follow 3', emoji: '3️⃣', color: 'orange-light', groupName: 'Follow-up', probability: 70, sortOrder: 11 },
  { id: 'FOLLOW_4', name: 'Follow 4', emoji: '4️⃣', color: 'peach', groupName: 'Follow-up', probability: 75, sortOrder: 12 },
  { id: 'FOLLOW_5', name: 'Follow 5', emoji: '5️⃣', color: 'sand', groupName: 'Follow-up', probability: 80, sortOrder: 13 },
  // Negociação
  { id: 'NEGOCIACAO', name: 'Negociação', emoji: '🤝', color: 'gold', groupName: 'Negociação', probability: 85, sortOrder: 14 },
  // Fechamento
  { id: 'GANHO', name: 'Ganho', emoji: '🏆', color: 'success', groupName: 'Fechamento', probability: 100, sortOrder: 15 },
  { id: 'PERDIDO', name: 'Perdido', emoji: '❌', color: 'danger', groupName: 'Fechamento', probability: 0, sortOrder: 16 },
];

// Pipeline Stages - 17 etapas do Pipedrive
const stages = ref<Stage[]>([...DEFAULT_STAGES]);

// Computed
const totalDeals = computed(() => deals.value.length);
const totalValue = computed(() => deals.value.reduce((sum, d) => sum + (d.value || 0), 0));

const conversionRate = computed(() => {
  const won = getStageDeals('GANHO').length;
  const lost = getStageDeals('PERDIDO').length;
  const total = won + lost;
  return total > 0 ? Math.round((won / total) * 100) : 0;
});

const avgDaysInPipeline = computed(() => {
  const dealsWithDays = deals.value.filter(d => (d.daysInStage ?? 0) > 0);
  if (dealsWithDays.length === 0) return 0;
  const total = dealsWithDays.reduce((sum, d) => sum + (d.daysInStage || 0), 0);
  return Math.round(total / dealsWithDays.length);
});

const avgTicket = computed(() => {
  const dealsWithValue = deals.value.filter(d => (d.value ?? 0) > 0);
  if (dealsWithValue.length === 0) return 0;
  return Math.round(totalValue.value / dealsWithValue.length);
});

const consultores = computed(() => {
  const set = new Set<string>();
  deals.value.forEach(d => {
    if (d.consultor) set.add(d.consultor);
  });
  return Array.from(set).sort();
});

// Primeiro nome do especialista selecionado
const selectedSpecialistFirstName = computed(() => {
  if (!selectedSpecialist.value) return '';
  const firstName = selectedSpecialist.value.split(' ')[0] ?? '';
  return firstName.toUpperCase();
});

const filteredDeals = computed(() => {
  let result = [...deals.value];

  // Filtro por busca
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.clientName?.toLowerCase().includes(q) ||
      d.endereco?.toLowerCase().includes(q) ||
      d.personEmail?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    );
  }

  // Filtro por período
  if (selectedPeriod.value) {
    const days = parseInt(selectedPeriod.value);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    result = result.filter(d => {
      if (!d.dealAddTime) return true; // Inclui deals sem data
      const dealDate = new Date(d.dealAddTime);
      return dealDate >= cutoffDate;
    });
  }

  // Filtro por consultor (filtro da barra)
  if (selectedConsultor.value) {
    result = result.filter(d => d.consultor === selectedConsultor.value);
  }

  // Filtro por especialista (seletor do header)
  if (selectedSpecialist.value) {
    result = result.filter(d => d.consultor === selectedSpecialist.value);
  }

  // Ordenação
  switch (sortBy.value) {
    case 'recent':
      // Mais recentes primeiro (por data de criação)
      result.sort((a, b) => {
        const dateA = new Date(a.dealAddTime || 0).getTime();
        const dateB = new Date(b.dealAddTime || 0).getTime();
        return dateB - dateA; // Maior data = mais recente = primeiro
      });
      break;
    case 'oldest':
      // Mais antigos primeiro (por data de criação)
      result.sort((a, b) => {
        const dateA = new Date(a.dealAddTime || 0).getTime();
        const dateB = new Date(b.dealAddTime || 0).getTime();
        return dateA - dateB; // Menor data = mais antigo = primeiro
      });
      break;
    case 'value-high':
      result.sort((a, b) => (b.value || 0) - (a.value || 0));
      break;
    case 'value-low':
      result.sort((a, b) => (a.value || 0) - (b.value || 0));
      break;
    case 'name-az':
      result.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
      break;
    case 'name-za':
      result.sort((a, b) => (b.clientName || '').localeCompare(a.clientName || ''));
      break;
    case 'days-high':
      // Mais dias no estágio = parados há mais tempo
      result.sort((a, b) => (b.daysInStage || 0) - (a.daysInStage || 0));
      break;
    case 'days-low':
      // Menos dias no estágio = entraram recentemente no estágio
      result.sort((a, b) => (a.daysInStage || 0) - (b.daysInStage || 0));
      break;
  }

  return result;
});

// Convert stages to format expected by PipelineSettings
const stagesForSettings = computed<StageForSettings[]>(() => {
  return stages.value.map((s, index) => ({
    id: s.id,
    name: s.name,
    color: colorMap[s.color] || s.color,
    groupName: s.groupName,
    probability: s.probability ?? 50,
    sortOrder: s.sortOrder ?? index,
    isDefault: DEFAULT_STAGES.some(ds => ds.id === s.id)
  }));
});

// Methods
const getStageDeals = (stageId: string) => {
  return filteredDeals.value.filter(d => d.status === stageId);
};

const getStageValue = (stageId: string) => {
  return getStageDeals(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const getDaysClass = (days?: number) => {
  if (!days) return '';
  if (days > 14) return 'deal-card__days--danger';
  if (days > 7) return 'deal-card__days--warning';
  return '';
};

const getStageColor = (stageId?: string): string => {
  const stage = stages.value.find(s => s.id === stageId);
  if (!stage) return '#6366f1';
  return colorMap[stage.color] || stage.color || '#6366f1';
};

const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Drag & Drop
const handleDragStart = (e: DragEvent, deal: Deal) => {
  draggingDeal.value = deal;
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', deal.id);

  // Add dragging class after a small delay for visual feedback
  setTimeout(() => {
    const target = e.target as HTMLElement;
    target.classList.add('deal-card--dragging');
  }, 0);
};

const handleDragEnd = () => {
  draggingDeal.value = null;
  dragOverStage.value = null;
};

const handleDragOver = (e: DragEvent, stageId: string) => {
  e.preventDefault();
  dragOverStage.value = stageId;
};

const handleDragLeave = () => {
  dragOverStage.value = null;
};

const handleDrop = async (e: DragEvent, stageId: string) => {
  e.preventDefault();
  dragOverStage.value = null;

  const dealId = e.dataTransfer?.getData('text/plain');
  if (!dealId) return;

  const deal = deals.value.find(d => d.id === dealId);
  if (!deal || deal.status === stageId) return;

  const oldStatus = deal.status;

  // Optimistic update
  deal.status = stageId;
  deal.daysInStage = 0;

  try {
    const response = await fetch(`/api/admin/comercial/${dealId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: stageId })
    });

    if (!response.ok) throw new Error('Falha ao mover deal');

    const stageName = stages.value.find(s => s.id === stageId)?.name;
    toast.success(`Deal movido para ${stageName}`);
  } catch (error) {
    // Rollback
    deal.status = oldStatus;
    toast.error('Erro ao mover deal');
  }
};

// Actions
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedConsultor.value = '';
  selectedPeriod.value = '';
  sortBy.value = 'recent';
};

// Specialist Selector
const selectSpecialist = (consultor: string) => {
  selectedSpecialist.value = consultor;
  showSpecialistModal.value = false;
};

const getConsultorDeals = (consultor: string): number => {
  return deals.value.filter(d => d.consultor === consultor).length;
};

const openNewDeal = (stageId?: string) => {
  newDeal.value = {
    clientName: '',
    value: 0,
    status: stageId || 'FORM_ORCAMENTO',
    phone: '',
    endereco: ''
  };
  showNewDealModal.value = true;
};

const closeNewDeal = () => {
  showNewDealModal.value = false;
};

const createDeal = async () => {
  if (!newDeal.value.clientName) return;

  try {
    const response = await fetch('/api/admin/comercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal.value)
    });

    if (!response.ok) throw new Error('Falha ao criar deal');

    const created = await response.json();
    deals.value.unshift(created);
    closeNewDeal();
    toast.success('Deal criado com sucesso!');
  } catch (error) {
    toast.error('Erro ao criar deal');
  }
};

const openDealDetail = async (deal: Deal) => {
  selectedDeal.value = deal;
  ultimaProposta.value = null;
  anexos.value = [];
  orcamentosEnviados.value = [];

  // Buscar última proposta, anexos e orçamentos em paralelo
  await Promise.all([
    fetchUltimaProposta(deal.id),
    fetchAnexos(deal.id),
    fetchOrcamentosEnviados(deal.id)
  ]);
};

const closeDealDetail = () => {
  selectedDeal.value = null;
  ultimaProposta.value = null;
  anexos.value = [];
  orcamentosEnviados.value = [];
};

// Funções de Proposta
const fetchUltimaProposta = async (dealId: string) => {
  loadingProposta.value = true;
  try {
    const response = await comercialApi.getUltimaProposta(dealId);
    if (response.data?.proposta) {
      ultimaProposta.value = response.data.proposta;
    }
  } catch (error: any) {
    // 404 significa que não há proposta - é esperado
    if (error.response?.status !== 404) {
      console.error('Erro ao buscar proposta:', error);
    }
  } finally {
    loadingProposta.value = false;
  }
};

// =============================================
// FUNÇÕES DE ANEXOS
// =============================================
const fetchAnexos = async (dealId: string) => {
  loadingAnexos.value = true;
  try {
    const response = await comercialApi.getAnexos(dealId);
    if (response.data.success) {
      anexos.value = response.data.anexos;
    }
  } catch (error: any) {
    console.error('Erro ao buscar anexos:', error);
  } finally {
    loadingAnexos.value = false;
  }
};

const openAnexoModal = () => {
  novoAnexo.value = {
    nome: '',
    tipo: 'PROJETO_ARQUITETONICO',
    descricao: '',
    fileData: '',
    mimeType: '',
    fileSize: 0
  };
  showAnexoModal.value = true;
};

const closeAnexoModal = () => {
  showAnexoModal.value = false;
};

const handleAnexoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Limite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Arquivo muito grande. Máximo 10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    const base64 = result?.split(',')[1] || '';
    novoAnexo.value.fileData = base64;
    novoAnexo.value.mimeType = file.type;
    novoAnexo.value.fileSize = file.size;
    novoAnexo.value.nome = novoAnexo.value.nome || file.name;
  };
  reader.readAsDataURL(file);
};

const createAnexo = async () => {
  if (!selectedDeal.value || !novoAnexo.value.nome) {
    toast.warning('Nome é obrigatório');
    return;
  }

  try {
    const response = await comercialApi.createAnexo(selectedDeal.value.id, {
      nome: novoAnexo.value.nome,
      tipo: novoAnexo.value.tipo,
      descricao: novoAnexo.value.descricao || undefined,
      fileData: novoAnexo.value.fileData || undefined,
      mimeType: novoAnexo.value.mimeType || undefined,
      fileSize: novoAnexo.value.fileSize || undefined
    });

    if (response.data.success) {
      toast.success('Anexo adicionado!');
      anexos.value.unshift(response.data.anexo);
      closeAnexoModal();
    }
  } catch (error: any) {
    console.error('Erro ao criar anexo:', error);
    toast.error('Erro ao adicionar anexo');
  }
};

const downloadAnexo = async (anexo: Anexo) => {
  if (!selectedDeal.value) return;

  try {
    const response = await comercialApi.downloadAnexo(selectedDeal.value.id, anexo.id);
    if (response.data.success && response.data.anexo.fileData) {
      const byteCharacters = atob(response.data.anexo.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: anexo.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.nome;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      toast.warning('Anexo sem arquivo para download');
    }
  } catch (error: any) {
    console.error('Erro ao baixar anexo:', error);
    toast.error('Erro ao baixar anexo');
  }
};

const deleteAnexo = async (anexo: Anexo) => {
  if (!selectedDeal.value) return;
  if (!confirm(`Excluir anexo "${anexo.nome}"?`)) return;

  try {
    const response = await comercialApi.deleteAnexo(selectedDeal.value.id, anexo.id);
    if (response.data.success) {
      toast.success('Anexo excluído!');
      anexos.value = anexos.value.filter(a => a.id !== anexo.id);
    }
  } catch (error: any) {
    console.error('Erro ao excluir anexo:', error);
    toast.error('Erro ao excluir anexo');
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTipoAnexoLabel = (tipo: string): string => {
  return tiposAnexo.find(t => t.value === tipo)?.label || tipo;
};

// =============================================
// FUNÇÕES DE ORÇAMENTOS ENVIADOS
// =============================================
const fetchOrcamentosEnviados = async (dealId: string) => {
  loadingOrcamentos.value = true;
  try {
    const response = await comercialApi.getOrcamentosEnviados(dealId);
    if (response.data.success) {
      orcamentosEnviados.value = response.data.orcamentos;
    }
  } catch (error: any) {
    console.error('Erro ao buscar orçamentos:', error);
  } finally {
    loadingOrcamentos.value = false;
  }
};

const openOrcamentoModal = () => {
  novoOrcamento.value = {
    dataEnvio: new Date().toISOString().split('T')[0],
    valor: ultimaProposta.value?.valorTotal ? Number(ultimaProposta.value.valorTotal) : 0,
    descricao: '',
    metragem: selectedDeal.value?.metragemEstimada || selectedDeal.value?.m2Total || 0,
    observacoes: '',
    propostaId: ultimaProposta.value?.id || ''
  };
  showOrcamentoModal.value = true;
};

const closeOrcamentoModal = () => {
  showOrcamentoModal.value = false;
};

const createOrcamentoEnviado = async () => {
  if (!selectedDeal.value || !novoOrcamento.value.dataEnvio) {
    toast.warning('Data de envio é obrigatória');
    return;
  }

  try {
    const response = await comercialApi.createOrcamentoEnviado(selectedDeal.value.id, {
      dataEnvio: novoOrcamento.value.dataEnvio,
      valor: novoOrcamento.value.valor || undefined,
      descricao: novoOrcamento.value.descricao || undefined,
      metragem: novoOrcamento.value.metragem || undefined,
      observacoes: novoOrcamento.value.observacoes || undefined,
      propostaId: novoOrcamento.value.propostaId || undefined
    });

    if (response.data.success) {
      toast.success('Orçamento registrado!');
      orcamentosEnviados.value.unshift(response.data.orcamento);
      closeOrcamentoModal();
    }
  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    toast.error('Erro ao registrar orçamento');
  }
};

const deleteOrcamentoEnviado = async (orcamento: OrcamentoEnviado) => {
  if (!selectedDeal.value) return;
  if (!confirm('Excluir registro de orçamento enviado?')) return;

  try {
    const response = await comercialApi.deleteOrcamentoEnviado(selectedDeal.value.id, orcamento.id);
    if (response.data.success) {
      toast.success('Registro excluído!');
      orcamentosEnviados.value = orcamentosEnviados.value.filter(o => o.id !== orcamento.id);
    }
  } catch (error: any) {
    console.error('Erro ao excluir orçamento:', error);
    toast.error('Erro ao excluir registro');
  }
};

const formatOrcamentoDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const gerarProposta = async () => {
  if (!selectedDeal.value) return;

  const deal = selectedDeal.value;

  // Montar query params para o gerador de propostas
  const params = new URLSearchParams();

  // Campos de informação do cliente
  if (deal.clientName) params.set('cliente', deal.clientName);
  if (deal.phone) params.set('telefone', deal.phone);
  if (deal.personEmail) params.set('email', deal.personEmail);
  if (deal.endereco) params.set('endereco', deal.endereco);
  if (deal.cidadeExecucao) params.set('cidade', deal.cidadeExecucao);

  // Metragem
  const metragem = deal.metragemEstimada || deal.m2Total || deal.metragemEstimadaN1;
  if (metragem) params.set('metragem', String(metragem));

  // Tipo de projeto / área
  if (deal.tipoProjeto) params.set('tipoProjeto', deal.tipoProjeto);
  if (deal.descritivoArea) params.set('area', deal.descritivoArea);

  // Estado da obra
  if (deal.estadoObra) params.set('estadoObra', deal.estadoObra);

  // Arquiteto
  if (deal.nomeEscritorio) params.set('arquiteto', deal.nomeEscritorio);

  // ID do deal para callback
  params.set('dealId', deal.id);

  // Consultor
  const consultor = selectedSpecialist.value || selectedConsultor.value || deal.consultor;
  if (consultor) params.set('consultor', consultor);

  // Data prevista de execução
  if (deal.dataPrevistaExec) {
    // dataPrevistaExec pode ser Date ou string ISO - converter para YYYY-MM-DD
    const dataExec = new Date(deal.dataPrevistaExec as string);
    if (!isNaN(dataExec.getTime())) {
      const dataStr = dataExec.toISOString().split('T')[0] as string;
      params.set('dataPrevistaExec', dataStr);
    }
  }

  // Abrir gerador de propostas em nova aba
  // Em dev local, o backend roda na porta 3000; em prod, usa a mesma origem
  const apiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = apiUrl || 'http://localhost:3000';
  const propostasUrl = `${baseUrl}/propostas.html?${params.toString()}`;

  window.open(propostasUrl, '_blank');

  toast.info('Gerador de propostas aberto em nova aba');
};

// Função para abrir/baixar PDF da proposta
const abrirProposta = () => {
  if (!ultimaProposta.value || !ultimaProposta.value.pdfBase64) {
    toast.warning('Proposta sem PDF. Gere uma nova proposta primeiro.');
    return;
  }

  try {
    // Converter base64 para blob
    const byteCharacters = atob(ultimaProposta.value.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Criar URL e abrir
    const url = window.URL.createObjectURL(blob);

    // Abrir em nova aba
    window.open(url, '_blank');

    // Limpar URL depois de um tempo
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);

    toast.success('Proposta aberta em nova aba');
  } catch (error) {
    console.error('Erro ao abrir proposta:', error);
    toast.error('Erro ao abrir proposta');
  }
};

const enviarPropostaWhatsApp = async () => {
  if (!selectedDeal.value || !ultimaProposta.value) return;

  const deal = selectedDeal.value;
  const proposta = ultimaProposta.value;

  if (!deal.phone) {
    toast.warning('Lead sem telefone cadastrado');
    return;
  }

  if (!proposta.pdfBase64) {
    toast.warning('Proposta sem PDF gerado. Gere uma nova proposta primeiro.');
    return;
  }

  enviandoProposta.value = true;

  try {
    const phone = deal.phone.replace(/\D/g, '');
    const nomeCliente = deal.primeiroNomeZapi || deal.clientName?.split(' ')[0] || 'Cliente';
    const nomeVendedor = selectedSpecialist.value?.split(' ')[0] ||
                         selectedConsultor.value?.split(' ')[0] ||
                         deal.consultor?.split(' ')[0] ||
                         authStore.user?.name?.split(' ')[0] ||
                         'especialista';

    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(proposta.valorTotal);

    const mensagem = `Olá ${nomeCliente}! Aqui é o ${nomeVendedor} da Monofloor. Conforme conversamos, segue a proposta no valor de ${valorFormatado}. Qualquer dúvida estou à disposição!`;

    // Converter base64 para blob/file
    const byteCharacters = atob(proposta.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const dataHoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `Proposta-Monofloor-${deal.clientName?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente'}-${dataHoje}.pdf`;

    const file = new File([blob], nomeArquivo, { type: 'application/pdf' });

    // Tentar usar Web Share API (funciona bem em mobile e alguns desktops)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Proposta Monofloor - ${deal.clientName}`,
          text: mensagem,
          files: [file]
        });
        toast.success('✅ Compartilhamento aberto! Selecione WhatsApp para enviar.');

        // Marcar como enviada
        await comercialApi.enviarPropostaWhatsApp(deal.id, proposta.id, {
          phoneNumber: phone,
          message: mensagem
        });
        await fetchUltimaProposta(deal.id);
        return;
      } catch (shareError: any) {
        if (shareError.name !== 'AbortError') {
          console.log('Web Share falhou, usando fallback:', shareError);
        } else {
          // Usuário cancelou o compartilhamento
          return;
        }
      }
    }

    // Baixar o PDF automaticamente
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Pequeno delay para garantir que o download iniciou
    await new Promise(resolve => setTimeout(resolve, 500));

    // Abrir WhatsApp na conversa
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');

    toast.info('📥 PDF baixado! Arraste para a conversa do WhatsApp ou clique em 📎', { duration: 6000 });

    // Marcar como enviada
    await comercialApi.enviarPropostaWhatsApp(deal.id, proposta.id, {
      phoneNumber: phone,
      message: mensagem
    });
    await fetchUltimaProposta(deal.id);

  } catch (error) {
    console.error('Erro ao enviar proposta:', error);
    toast.error('Erro ao enviar proposta via WhatsApp');
  } finally {
    enviandoProposta.value = false;
  }
};

// Gerar proposta em HTML com tracking
const gerarPropostaHTML = async () => {
  if (!selectedDeal.value || !ultimaProposta.value) {
    toast.warning('Selecione um lead e gere uma proposta primeiro');
    return;
  }

  gerandoHTML.value = true;
  try {
    const deal = selectedDeal.value;
    const proposta = ultimaProposta.value;

    // Usar os dados do cálculo da proposta
    const dadosCalculo = proposta.dadosCalculo || {};

    const payload = {
      propostaId: proposta.id,
      clienteNome: deal.personName || deal.title || 'Cliente',
      metragemTotalStelion: dadosCalculo.metragemTotalStelion || 0,
      materiaisStelion: dadosCalculo.materiaisStelion || 0,
      maoObraStelion: dadosCalculo.maoObraStelion || 0,
      impostosStelion: dadosCalculo.impostosStelion || 0,
      valorTotalStelion: dadosCalculo.valorTotalStelion || 0,
      metragemTotalLilit: dadosCalculo.metragemTotalLilit || 0,
      materiaisLilit: dadosCalculo.materiaisLilit || 0,
      maoObraLilit: dadosCalculo.maoObraLilit || 0,
      impostosLilit: dadosCalculo.impostosLilit || 0,
      valorTotalLilit: dadosCalculo.valorTotalLilit || 0,
      metragemTotal: dadosCalculo.metragemTotal || Number(proposta.metragem) || 0,
      materiaisTotal: dadosCalculo.materiaisTotal || 0,
      maoObraTotal: dadosCalculo.maoObraTotal || 0,
      impostosTotal: dadosCalculo.impostosTotal || 0,
      valorTotal: Number(proposta.valorTotal) || 0,
      precoBaseStelion: dadosCalculo.precoBaseStelion || 910,
      precoBaseLilit: dadosCalculo.precoBaseLilit || 590,
      pisoStelion: dadosCalculo.pisoStelion || 0,
      paredeStelion: dadosCalculo.paredeStelion || 0,
      pisoLilit: dadosCalculo.pisoLilit || 0,
      paredeLilit: dadosCalculo.paredeLilit || 0,
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/proposals/generate-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao gerar HTML');
    }

    const result = await response.json();
    htmlPropostaUrl.value = result.url;
    toast.success('Link HTML gerado com sucesso!');

  } catch (error: any) {
    console.error('Erro ao gerar HTML:', error);
    toast.error(error.message || 'Erro ao gerar proposta HTML');
  } finally {
    gerandoHTML.value = false;
  }
};

// Copiar link HTML para clipboard
const copyHtmlLink = () => {
  if (htmlPropostaUrl.value) {
    navigator.clipboard.writeText(htmlPropostaUrl.value).then(() => {
      toast.success('Link copiado para a área de transferência!');
    });
  }
};

// Inline Edit Functions
const startEditing = (field: string, currentValue: string | number | null | undefined) => {
  editingField.value = field;
  editingValue.value = String(currentValue || '');
};

const cancelEditing = () => {
  editingField.value = null;
  editingValue.value = '';
};

const saveField = async (field: string) => {
  if (!selectedDeal.value || savingField.value) return;

  const dealId = selectedDeal.value.id;
  const newValue = editingValue.value.trim();

  // Se o valor não mudou, apenas cancela a edição
  const originalValue = String(getFieldValue(selectedDeal.value, field) || '');
  if (newValue === originalValue) {
    cancelEditing();
    return;
  }

  savingField.value = true;

  try {
    // Mapear nome do campo do frontend para backend
    const fieldMap: Record<string, string> = {
      'clientName': 'personName',
      'phone': 'personPhone',
      'personEmail': 'personEmail',
      'endereco': 'endereco',
      'cidadeExecucao': 'cidadeExecucao',
      'metragemEstimada': 'metragemEstimada',
      'estadoObra': 'estadoObra',
      'budgetEstimado': 'budgetEstimado',
      'dataPrevistaExec': 'dataPrevistaExec',
      'nomeEscritorio': 'nomeEscritorio',
      'detalhesArquiteto': 'detalhesArquiteto',
      'resumo': 'resumo',
      'descritivoArea': 'descritivoArea',
      'consultor': 'consultorId',
      'value': 'dealValue',
    };

    const backendField = fieldMap[field] || field;
    const updateData: Record<string, any> = {};

    // Converter valor se necessário
    if (field === 'value' || field === 'metragemEstimada') {
      updateData[backendField] = parseFloat(newValue) || 0;
    } else {
      updateData[backendField] = newValue;
    }

    await comercialApi.update(dealId, updateData);

    // Atualizar o deal local
    if (selectedDeal.value) {
      (selectedDeal.value as any)[field] = field === 'value' ? parseFloat(newValue) || 0 : newValue;

      // Também atualizar na lista de deals
      const dealIndex = deals.value.findIndex(d => d.id === dealId);
      if (dealIndex !== -1) {
        (deals.value[dealIndex] as any)[field] = field === 'value' ? parseFloat(newValue) || 0 : newValue;
      }
    }

    toast.success('Campo atualizado');
  } catch (error) {
    console.error('Error saving field:', error);
    toast.error('Erro ao salvar campo');
  } finally {
    savingField.value = false;
    cancelEditing();
  }
};

const getFieldValue = (deal: Deal, field: string): string | number | null | undefined => {
  return (deal as any)[field];
};

const handleFieldBlur = (field: string) => {
  // Salvar ao sair do campo
  saveField(field);
};

const handleFieldKeydown = (event: KeyboardEvent, field: string) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveField(field);
  } else if (event.key === 'Escape') {
    cancelEditing();
  }
};

const editDeal = (deal: Deal) => {
  // Abrir o primeiro campo para edição
  startEditing('clientName', deal.clientName);
};

const sendWhatsApp = (deal: Deal) => {
  if (deal.phone) {
    const phone = deal.phone.replace(/\D/g, '');

    // Nome do cliente para Z-API (primeiro nome formatado)
    const nomeCliente = deal.primeiroNomeZapi || deal.clientName?.split(' ')[0] || 'Cliente';

    // Nome do vendedor - prioridade:
    // 1. Consultor selecionado no filtro do header (selectedSpecialist)
    // 2. Consultor selecionado no filtro da barra (selectedConsultor)
    // 3. Consultor do próprio deal
    // 4. Usuário logado como fallback
    let nomeVendedor = 'especialista';
    if (selectedSpecialist.value) {
      nomeVendedor = selectedSpecialist.value.split(' ')[0] || 'especialista';
    } else if (selectedConsultor.value) {
      nomeVendedor = selectedConsultor.value.split(' ')[0] || 'especialista';
    } else if (deal.consultor && deal.consultor !== 'N/A') {
      nomeVendedor = deal.consultor.split(' ')[0] || 'especialista';
    } else if (authStore.user?.name) {
      nomeVendedor = authStore.user.name.split(' ')[0] || 'especialista';
    }

    // Metragem do projeto
    const metragem = deal.metragemEstimada || deal.m2 || 'sua área';

    // Detectar gênero do consultor (masculino: João, Gabriel)
    const nomesMasculinos = ['joão', 'joao', 'gabriel'];
    const artigoGenero = nomesMasculinos.includes(nomeVendedor.toLowerCase()) ? 'o' : 'a';

    // Montar mensagem
    const mensagem = `Olá ${nomeCliente}, tudo bem? Sou ${nomeVendedor}, especialista da Monofloor e serei ${artigoGenero} responsável por cuidar do seu projeto. Vi que fez uma solicitação de ${metragem}m². Quer me falar um pouco mais sobre o projeto?`;

    // Encodar mensagem para URL
    const mensagemEncoded = encodeURIComponent(mensagem);

    window.open(`https://wa.me/55${phone}?text=${mensagemEncoded}`, '_blank');
  } else {
    toast.warning('Deal sem telefone cadastrado');
  }
};

const openPipedriveLink = (url: string | undefined) => {
  if (url) {
    window.open(url, '_blank');
  } else {
    toast.warning('Link do Pipedrive não disponível');
  }
};

const scheduleMeeting = (deal: Deal) => {
  toast.info('Funcionalidade em desenvolvimento');
};

const openMenu = (deal: Deal, event: MouseEvent) => {
  // TODO: Context menu
  console.log('Open menu for:', deal);
};

// Reverse color map (hex to name)
const reverseColorMap: Record<string, string> = Object.entries(colorMap).reduce(
  (acc, [name, hex]) => ({ ...acc, [hex]: name }),
  {}
);

// Pipeline Settings Handlers
const handleSaveStages = (newStages: StageForSettings[]) => {
  // Convert back from hex colors to named colors
  stages.value = newStages.map(s => {
    // Find matching emoji from existing stages or defaults
    const existingStage = stages.value.find(es => es.id === s.id) ||
                          DEFAULT_STAGES.find(ds => ds.id === s.id);
    const emoji = existingStage?.emoji || '📌';

    // Convert hex color back to name, or use hex if not found
    const colorName = reverseColorMap[s.color] || findClosestColor(s.color);

    return {
      id: s.id,
      name: s.name,
      emoji,
      color: colorName,
      groupName: s.groupName,
      probability: s.probability,
      sortOrder: s.sortOrder
    };
  });

  // Save to localStorage for persistence
  localStorage.setItem('monofloor_pipeline_stages', JSON.stringify(stages.value));

  showPipelineSettings.value = false;
  toast.success('Pipeline atualizado com sucesso!');
};

const handleResetStages = () => {
  stages.value = [...DEFAULT_STAGES];
  localStorage.removeItem('monofloor_pipeline_stages');
  toast.info('Pipeline restaurado para configuração padrão');
};

// Find closest named color from hex
const findClosestColor = (hex: string): string => {
  // Simple approach: return hex if no match
  // In production, could calculate color distance
  return reverseColorMap[hex.toLowerCase()] || hex;
};

// Load saved stages from localStorage
const loadSavedStages = () => {
  const saved = localStorage.getItem('monofloor_pipeline_stages');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stages.value = parsed;
      }
    } catch {
      // Ignore invalid JSON
    }
  }
};

// Minimum loading time for animation (ms)
const MIN_LOADING_TIME = 1800;

// Fetch Data
const fetchDeals = async () => {
  loading.value = true;
  const startTime = Date.now();

  try {
    // Carregar TODOS os deals (cache no servidor por 5 min)
    const response = await fetch(`/api/admin/comercial`);
    if (!response.ok) throw new Error('Falha ao carregar deals');

    const data = await response.json();
    console.log('API response:', data);

    // Handle different API response formats
    let rawDeals: any[] = [];
    if (Array.isArray(data)) {
      rawDeals = data;
    } else if (data.deals && Array.isArray(data.deals)) {
      rawDeals = data.deals;
    } else if (data.data && Array.isArray(data.data)) {
      rawDeals = data.data;
    }

    deals.value = rawDeals.map((d: any) => ({
      // Spread original data para manter todos os campos do Pipedrive
      ...d,
      // Campos principais formatados
      clientName: d.personName || d.project?.cliente || d.pipedriveRawData?.title || 'Sem nome',
      value: parseFloat(d.dealValue) || parseFloat(d.pipedriveRawData?.value) || 0,
      status: mapStatus(d.stageName || d.status),
      consultor: d.consultorId || d.ownerUserName || 'N/A',
      phone: d.personPhone || '',
      endereco: d.project?.endereco || d.cidadeExecucaoDesc || '',
      m2Total: parseFloat(d.project?.m2Total) || parseFloat(d.metragemEstimada) || 0,
      daysInStage: calculateDaysInStage(d.stageChangeTime || d.dealAddTime),
      // Campos do Pipedrive preservados
      personEmail: d.personEmail || '',
      tipoCliente: d.tipoCliente || '',
      tipoProjeto: d.tipoProjeto || '',
      nomeEscritorio: d.nomeEscritorio || '',
      budgetEstimado: d.budgetEstimado || '',
      cidadeExecucao: d.cidadeExecucao || '',
      metragemEstimada: d.metragemEstimada || '',
      metragemEstimadaN1: d.metragemEstimadaN1 || '',
      estadoObra: d.estadoObra || '',
      dataPrevistaExec: d.dataPrevistaExec || '',
      detalhesArquiteto: d.detalhesArquiteto || '',
      descritivoArea: d.descritivoArea || '',
      resumo: d.resumo || '',
      primeiroNomeZapi: d.primeiroNomeZapi || '',
      telefoneZapi: d.telefoneZapi || '',
      pipedriveUrl: d.pipedriveUrl || `https://monofloor.pipedrive.com/deal/${d.pipedriveDealId}`,
      pipedriveDealId: d.pipedriveDealId || '',
      dealAddTime: d.dealAddTime,
      dealUpdateTime: d.dealUpdateTime,
      pipedriveSyncedAt: d.pipedriveSyncedAt
    }));
  } catch (error) {
    console.error('Error fetching deals:', error);
    toast.error('Erro ao carregar deals');
  } finally {
    // Ensure minimum loading time for animation to be visible
    const elapsed = Date.now() - startTime;
    const remaining = MIN_LOADING_TIME - elapsed;
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    loading.value = false;
  }
};

// Calculate days in current stage
const calculateDaysInStage = (dateStr?: string): number => {
  if (!dateStr) return 0;
  const stageDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - stageDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Map Pipedrive stage names to our stage IDs
const mapStatus = (status?: string): string => {
  if (!status) return 'FORM_ORCAMENTO';

  const statusLower = status.toLowerCase().trim();

  // Direct mapping by Pipedrive stage name
  const mappings: Record<string, string> = {
    // Entrada
    'form orçamento': 'FORM_ORCAMENTO',
    'form orcamento': 'FORM_ORCAMENTO',
    // Contato
    '1º contato': 'PRIMEIRO_CONTATO',
    '1o contato': 'PRIMEIRO_CONTATO',
    'primeiro contato': 'PRIMEIRO_CONTATO',
    'contato arquiteto': 'CONTATO_ARQUITETO',
    'aguardando arq.': 'AGUARDANDO_ARQ',
    'aguardando arq': 'AGUARDANDO_ARQ',
    'aguardando arquiteto': 'AGUARDANDO_ARQ',
    // Levantamento
    'levantamento': 'LEVANTAMENTO',
    'visita agendada': 'VISITA_AGENDADA',
    'visita realizada': 'VISITA_REALIZADA',
    // Proposta
    'proposta em elaboração': 'PROPOSTA_EM_ELABORACAO',
    'proposta em elaboracao': 'PROPOSTA_EM_ELABORACAO',
    'proposta enviada': 'PROPOSTA_ENVIADA',
    // Follow-up
    'follow 1': 'FOLLOW_1',
    'follow 2': 'FOLLOW_2',
    'follow 3': 'FOLLOW_3',
    'follow 4': 'FOLLOW_4',
    'follow 5': 'FOLLOW_5',
    'follow 5 (último)': 'FOLLOW_5',
    'follow 5 (ultimo)': 'FOLLOW_5',
    // Negociação
    'negociação': 'NEGOCIACAO',
    'negociacao': 'NEGOCIACAO',
    // Fechamento
    'ganho': 'GANHO',
    'won': 'GANHO',
    'perdido': 'PERDIDO',
    'lost': 'PERDIDO'
  };

  // Try exact match first
  if (mappings[statusLower]) {
    return mappings[statusLower];
  }

  // Try partial match
  for (const [key, value] of Object.entries(mappings)) {
    if (statusLower.includes(key) || key.includes(statusLower)) {
      return value;
    }
  }

  // Fallback heuristics
  if (statusLower.includes('ganho') || statusLower.includes('won')) return 'GANHO';
  if (statusLower.includes('perdido') || statusLower.includes('lost')) return 'PERDIDO';
  if (statusLower.includes('negoci')) return 'NEGOCIACAO';
  if (statusLower.includes('follow')) return 'FOLLOW_1';
  if (statusLower.includes('proposta') && statusLower.includes('enviada')) return 'PROPOSTA_ENVIADA';
  if (statusLower.includes('proposta')) return 'PROPOSTA_EM_ELABORACAO';
  if (statusLower.includes('visita') && statusLower.includes('realizada')) return 'VISITA_REALIZADA';
  if (statusLower.includes('visita')) return 'VISITA_AGENDADA';
  if (statusLower.includes('levantamento')) return 'LEVANTAMENTO';
  if (statusLower.includes('aguardando')) return 'AGUARDANDO_ARQ';
  if (statusLower.includes('arquiteto')) return 'CONTATO_ARQUITETO';
  if (statusLower.includes('contato')) return 'PRIMEIRO_CONTATO';
  if (statusLower.includes('form') || statusLower.includes('orçamento')) return 'FORM_ORCAMENTO';

  return 'FORM_ORCAMENTO';
};

onMounted(() => {
  loadSavedStages();
  fetchDeals();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Press+Start+2P&display=swap');

/* ============================================
   NEO-BRUTALIST DESIGN SYSTEM
   ============================================ */

:root {
  --white: #FFFFFF;
  --off-white: #FAFAFA;
  --black: #1a1a1a;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-400: #a3a3a3;
  --gray-600: #525252;

  /* Accent Colors */
  --yellow: #FFE566;
  --yellow-dark: #E6C800;
  --blue: #60A5FA;
  --blue-dark: #3B82F6;
  --purple: #A855F7;
  --purple-dark: #9333EA;
  --orange: #FB923C;
  --orange-dark: #F97316;
  --coral: #FF6B6B;
  --coral-dark: #EF4444;
  --green: #4ADE80;
  --green-dark: #22C55E;
  --mint: #4ECDC4;

  /* Shadows */
  --shadow-sm: 2px 2px 0 var(--black);
  --shadow-md: 4px 4px 0 var(--black);
  --shadow-lg: 6px 6px 0 var(--black);
  --shadow-xl: 8px 8px 0 var(--black);

  /* Border */
  --border: 2px solid var(--black);
  --border-thick: 3px solid var(--black);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}

.crm {
  min-height: 100vh;
  background: #FAFAFA !important;
  font-family: var(--font-body);
  color: #1a1a1a !important;
  padding: 24px;
  position: relative;
  z-index: 1;
}

/* Override any parent dark backgrounds */
.crm * {
  color: inherit;
}

/* ============================================
   HEADER
   ============================================ */

.crm-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.crm-header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.crm-header__title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Pixel Train */
.pixel-train {
  width: 80px;
  height: 50px;
  animation: trainBounce 0.5s ease-in-out infinite alternate;
}

@keyframes trainBounce {
  from { transform: translateY(0); }
  to { transform: translateY(-3px); }
}

.train-svg {
  width: 100%;
  height: 100%;
}

/* Smoke Animation */
.smoke {
  animation: smokeRise 1.5s ease-out infinite;
}

.smoke-1 { animation-delay: 0s; }
.smoke-2 { animation-delay: 0.3s; }
.smoke-3 { animation-delay: 0.6s; }
.smoke-4 { animation-delay: 0.15s; }

@keyframes smokeRise {
  0% {
    opacity: 0.8;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: translateY(-15px) scale(1.5);
  }
}

/* Title */
.crm-header__title-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-prefix {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--gray-600);
}

.monofloor-logo-svg {
  height: 28px;
  width: auto;
  margin-left: 8px;
}

.monofloor-logo-svg.pixel-logo {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  shape-rendering: crispEdges;
}

.crm-header__actions {
  display: flex;
  gap: 12px;
}

/* Specialist Selector */
.specialist-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 16px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  margin-right: auto;
  min-width: 120px;
}

.specialist-selector:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.specialist-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--gray-600);
  text-transform: uppercase;
}

.specialist-name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--black);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.specialist-name.pixel-text {
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-size: 0.85rem;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
}

.specialist-chevron {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--gray-400);
}

.specialist-selector {
  position: relative;
}

/* Specialist Modal */
.specialist-modal {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl), 0 0 0 4px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  overflow: hidden;
  animation: modalAppear 0.2s ease;
  color: white;
}

.specialist-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(201, 169, 98, 0.2);
}

.specialist-modal__header h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.specialist-modal__list {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.specialist-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.specialist-option:hover {
  border-color: rgba(201, 169, 98, 0.5);
  background: rgba(201, 169, 98, 0.1);
}

.specialist-option--active {
  border-color: var(--yellow);
  background: rgba(201, 169, 98, 0.25);
  box-shadow: 0 0 12px rgba(201, 169, 98, 0.3);
}

.specialist-option__avatar {
  width: 36px;
  height: 36px;
  background: var(--blue);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.specialist-option__name {
  flex: 1;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
}

.specialist-option__count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: var(--radius-full);
}

.specialist-option--active .specialist-option__count {
  background: rgba(201, 169, 98, 0.3);
  color: white;
}

/* KPIs Row */
.crm-kpis {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: var(--radius-md);
  box-shadow: 3px 3px 0 var(--black);
  min-width: 140px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.kpi-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--black);
}

.kpi-card__icon {
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.kpi-card--deals .kpi-card__icon { background: #dbeafe; }
.kpi-card--pipeline .kpi-card__icon { background: #dcfce7; }
.kpi-card--won .kpi-card__icon { background: #fef9c3; }
.kpi-card--conversion .kpi-card__icon { background: #f3e8ff; }
.kpi-card--avg .kpi-card__icon { background: #ffedd5; }
.kpi-card--ticket .kpi-card__icon { background: #fce7f3; }

.kpi-card__content {
  display: flex;
  flex-direction: column;
}

.kpi-card__value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.1;
}

.kpi-card__label {
  font-size: 0.7rem;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   BUTTONS
   ============================================ */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  border: var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-md);
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-lg);
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.btn--primary {
  background: var(--yellow);
  color: var(--black);
}

.btn--outline {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.btn--outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn--ghost {
  background: transparent;
  border: none;
  box-shadow: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 8px;
}

.btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: none;
  box-shadow: none;
}

.btn--small {
  padding: 8px 14px;
  font-size: 0.85rem;
  box-shadow: var(--shadow-sm);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--shadow-sm);
}

/* ============================================
   FILTERS BAR
   ============================================ */

.filters-bar {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: var(--white);
  border: var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-600);
}

.filter-input,
.filter-select {
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  border: var(--border);
  border-radius: var(--radius-sm);
  background: var(--white);
  min-width: 180px;
  transition: box-shadow 0.15s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  box-shadow: var(--shadow-sm);
}

/* ============================================
   PIPELINE
   ============================================ */

.pipeline {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 8px 24px 8px;
  scroll-behavior: smooth;
  min-height: 500px;
}

.pipeline::-webkit-scrollbar {
  height: 8px;
}

.pipeline::-webkit-scrollbar-track {
  background: var(--gray-200);
  border-radius: var(--radius-full);
}

.pipeline::-webkit-scrollbar-thumb {
  background: var(--black);
  border-radius: var(--radius-full);
}

.pipeline-column {
  flex: 0 0 220px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  background: transparent;
  transition: all 0.2s ease;
  animation: columnAppear 0.3s ease backwards;
  animation-delay: var(--delay);
}

@keyframes columnAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pipeline-column--drag-over .pipeline-column__header {
  box-shadow: 0 0 0 3px var(--yellow), 3px 3px 0 #1a1a1a;
}

.pipeline-column--drag-over .pipeline-column__body {
  background: rgba(255, 229, 102, 0.1);
  border-radius: 8px;
}

.pipeline-column__header {
  padding: 10px 12px;
  border: 2px solid #1a1a1a;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Color variants - 21 stages */
/* Entrada */
.pipeline-column--indigo .pipeline-column__header { background: #6366f1 !important; color: white !important; }
.pipeline-column--violet .pipeline-column__header { background: #8b5cf6 !important; color: white !important; }
.pipeline-column--purple .pipeline-column__header { background: #a855f7 !important; color: white !important; }
/* Contato */
.pipeline-column--blue .pipeline-column__header { background: #3b82f6 !important; color: white !important; }
.pipeline-column--sky .pipeline-column__header { background: #0ea5e9 !important; color: white !important; }
.pipeline-column--cyan .pipeline-column__header { background: #06b6d4 !important; color: white !important; }
/* Levantamento */
.pipeline-column--teal .pipeline-column__header { background: #14b8a6 !important; color: white !important; }
.pipeline-column--emerald .pipeline-column__header { background: #10b981 !important; color: white !important; }
.pipeline-column--green .pipeline-column__header { background: #22c55e !important; color: white !important; }
/* Proposta */
.pipeline-column--lime .pipeline-column__header { background: #84cc16 !important; }
.pipeline-column--yellow .pipeline-column__header { background: #eab308 !important; }
/* Follow-up */
.pipeline-column--amber .pipeline-column__header { background: #f59e0b !important; }
.pipeline-column--orange .pipeline-column__header { background: #f97316 !important; }
.pipeline-column--orange-light .pipeline-column__header { background: #fb923c !important; }
.pipeline-column--peach .pipeline-column__header { background: #fdba74 !important; }
.pipeline-column--sand .pipeline-column__header { background: #fed7aa !important; }
/* Negociação */
.pipeline-column--gold .pipeline-column__header { background: #c9a962 !important; }
.pipeline-column--gold-light .pipeline-column__header { background: #d4b872 !important; }
/* Fechamento */
.pipeline-column--success .pipeline-column__header { background: #22c55e !important; color: white !important; }
.pipeline-column--danger .pipeline-column__header { background: #ef4444 !important; color: white !important; }
/* Especiais */
.pipeline-column--slate .pipeline-column__header { background: #64748b !important; color: white !important; }

.pipeline-column__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1.2;
}

.pipeline-column__emoji {
  font-size: 1rem;
}

.pipeline-column__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pipeline-column__count {
  background: rgba(0,0,0,0.2);
  color: inherit;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}

.pipeline-column__value {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.9;
}

.pipeline-column__body {
  flex: 1;
  padding: 8px 0;
  min-height: 200px;
  overflow-y: visible;
}

.pipeline-column__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline-column__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 15px;
  color: var(--gray-400);
  text-align: center;
  gap: 8px;
  background: rgba(0,0,0,0.02);
  border: 2px dashed var(--gray-200);
  border-radius: 8px;
  margin-top: 4px;
}

.pipeline-column__empty-icon {
  font-size: 1.5rem;
  opacity: 0.4;
}

.pipeline-column__add {
  padding: 8px 12px;
  background: var(--white);
  border: 2px solid #1a1a1a;
  border-radius: 0 0 10px 10px;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 #1a1a1a;
}

.pipeline-column__add:hover {
  background: var(--yellow);
  color: var(--black);
  box-shadow: 4px 4px 0 #1a1a1a;
}

/* ============================================
   DEAL CARDS
   ============================================ */

.deal-card {
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  padding: 10px;
  cursor: grab;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 #1a1a1a;
  position: relative;
}

.deal-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.deal-card:hover .deal-card__actions {
  opacity: 1;
  transform: translateY(0);
}

.deal-card--dragging {
  cursor: grabbing;
  transform: rotate(3deg) scale(1.05);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  opacity: 0.9;
}

.deal-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.deal-card__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1.2;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deal-card__id {
  font-size: 0.65rem;
  color: var(--gray-400);
  font-family: monospace;
}

.deal-card__value {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--green-dark);
  margin-bottom: 8px;
}

.deal-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deal-card__avatar {
  width: 22px;
  height: 22px;
  background: var(--blue);
  border: 1px solid var(--black);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
}

.deal-card__days {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--gray-100);
  border-radius: var(--radius-sm);
}

.deal-card__days--warning {
  background: var(--orange);
}

.deal-card__days--danger {
  background: var(--coral);
  color: white;
}

.deal-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.15s ease;
}

.deal-action {
  width: 28px;
  height: 28px;
  border: var(--border);
  border-radius: var(--radius-sm);
  background: var(--white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.1s ease;
}

.deal-action:hover {
  background: var(--yellow);
  transform: scale(1.1);
}

/* Card Transitions */
.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.card-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.card-move {
  transition: transform 0.3s ease;
}

/* ============================================
   MODAL
   ============================================ */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease;
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalAppear 0.2s ease;
  color: white;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(201, 169, 98, 0.2);
}

.modal__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.modal__close {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  transition: all 0.1s ease;
}

.modal__close:hover {
  background: var(--coral);
  border-color: var(--coral);
  color: white;
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
  color: white;
}

.modal__body--scroll {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

/* Large Modal Variant */
.modal--large {
  max-width: 900px;
}

.modal-overlay--large .modal__header {
  background: rgba(255, 255, 255, 0.05);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.modal__footer--proposals {
  justify-content: space-between;
}

.modal__footer-left,
.modal__footer-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn--gold {
  background: linear-gradient(135deg, #c9a962, #b8963e);
  color: #1a1a1a;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.btn--gold:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4b56e, #c9a962);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn--gold:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.btn--info:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn--info:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* HTML Link Box */
.html-link-box {
  margin-top: 16px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
}

.html-link-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #3b82f6;
  font-weight: 600;
}

.html-link-box__url {
  color: #60a5fa;
  word-break: break-all;
  font-size: 14px;
  text-decoration: none;
}

.html-link-box__url:hover {
  text-decoration: underline;
}

.btn--success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.btn--success:hover:not(:disabled) {
  background: linear-gradient(135deg, #2dd468, #22c55e);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn--success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================
   FORM ELEMENTS
   ============================================ */

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 14px;
  font-family: var(--font-body);
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  transition: all 0.15s ease;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(201, 169, 98, 0.5);
  box-shadow: 0 0 8px rgba(201, 169, 98, 0.2);
}

.form-select option {
  background: #1a1a1a;
  color: white;
}

/* ============================================
   DETAIL GRID
   ============================================ */

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-item--full {
  grid-column: span 2;
}

.detail-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 600;
  color: white;
}

.detail-value--large {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: #4ade80;
}

.detail-value--link {
  cursor: pointer;
  color: #60a5fa;
  transition: color 0.15s ease;
}

.detail-value--link:hover {
  color: #93c5fd;
  text-decoration: underline;
}

.detail-value--stage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(var(--stage-color), 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.detail-value--metric {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: #c9a962;
}

.detail-value--mono {
  font-family: monospace;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.detail-value--text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
}

/* Inline Editing */
.detail-value--editable {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
  border: 1px solid transparent;
  position: relative;
}

.detail-value--editable:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(201, 169, 98, 0.3);
}

.detail-value--editable:hover::after {
  content: '✏️';
  font-size: 0.7rem;
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
}

.inline-edit-input,
.inline-edit-select,
.inline-edit-textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #c9a962;
  border-radius: var(--radius-sm);
  outline: none;
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.2);
  transition: all 0.15s ease;
}

.inline-edit-input:focus,
.inline-edit-select:focus,
.inline-edit-textarea:focus {
  border-color: #e0c080;
  box-shadow: 0 0 0 4px rgba(201, 169, 98, 0.3);
}

.inline-edit-input--large {
  font-size: 1.25rem;
  font-weight: 800;
  color: #4ade80;
}

.inline-edit-input--full {
  width: 100%;
}

.inline-edit-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a962' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.inline-edit-select option {
  background: #1a1a1a;
  color: white;
  padding: 8px;
}

.inline-edit-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

.edit-action {
  margin-left: 8px;
  padding: 4px 8px;
  background: rgba(201, 169, 98, 0.2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.edit-action:hover {
  background: rgba(201, 169, 98, 0.4);
}

/* Detail Sections */
.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #c9a962;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(201, 169, 98, 0.3);
}

.detail-section--meta {
  opacity: 0.7;
}

.detail-section--meta .detail-section__title {
  color: rgba(255, 255, 255, 0.5);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.detail-grid--highlight {
  background: rgba(201, 169, 98, 0.1);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid rgba(201, 169, 98, 0.2);
}

.detail-grid--small .detail-item {
  padding: 8px 12px;
}

.detail-item--highlight {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.2);
}

/* Modal Header Enhanced */
.modal__header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modal__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge--tipo {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge--projeto {
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.btn--icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.btn--secondary {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.btn--secondary:hover {
  background: rgba(59, 130, 246, 0.3);
}

/* Deal Card Enhanced */
.deal-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.deal-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  font-size: 0.6rem;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.deal-card__tag--tipo {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.deal-card__tag--m2 {
  background: rgba(201, 169, 98, 0.15);
  color: #c9a962;
  border: 1px solid rgba(201, 169, 98, 0.3);
}

.deal-card__location {
  font-size: 0.7rem;
  color: var(--gray-600);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================
   LOADING
   ============================================ */

/* ============================================
   LOADING SCREEN - PIXEL TRAIN ON INFINITY
   ============================================ */

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 40px;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Infinity Track Container */
.infinity-track-container {
  width: 280px;
  height: 120px;
}

.infinity-track {
  width: 100%;
  height: 100%;
}

/* Train pixel style */
.train-group rect,
.train-group circle {
  shape-rendering: crispEdges;
}

/* Loading Text */
.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--black);
  letter-spacing: -0.02em;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots .dot {
  width: 10px;
  height: 10px;
  background: var(--yellow);
  border: 2px solid var(--black);
  border-radius: 2px;
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots .dot:nth-child(1) { animation-delay: 0s; }
.loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(1);
    background: var(--yellow);
  }
  40% {
    transform: scale(1.3);
    background: var(--gold);
  }
}

/* Progress Bar */
.loading-progress {
  width: 200px;
  height: 8px;
  background: var(--gray-200);
  border: 2px solid var(--black);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--yellow), var(--gold), var(--yellow));
  background-size: 200% 100%;
  animation: progressShimmer 1.5s ease-in-out infinite, progressGrow 2s ease-out forwards;
}

@keyframes progressShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes progressGrow {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 95%; }
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 768px) {
  .crm {
    padding: 12px;
  }

  .crm-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .crm-header__left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .crm-header__title {
    font-size: 1.25rem;
  }

  .pipeline-column {
    flex: 0 0 180px;
    min-width: 180px;
  }

  .pipeline-column__title {
    font-size: 0.7rem;
  }

  .deal-card__name {
    max-width: 110px;
    font-size: 0.75rem;
  }

  .filters-bar {
    flex-direction: column;
  }

  .filter-input,
  .filter-select {
    min-width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item--full {
    grid-column: span 1;
  }
}

/* =============================================
   ANEXOS E ORÇAMENTOS ENVIADOS
   ============================================= */

.detail-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-section__header .detail-section__title {
  margin-bottom: 0;
}

.detail-loading {
  text-align: center;
  color: #888;
  padding: 16px;
  font-size: 14px;
}

.detail-empty {
  text-align: center;
  color: #666;
  padding: 20px;
  font-size: 13px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

/* Anexos List */
.anexos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anexo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.anexo-item__icon {
  font-size: 20px;
  flex-shrink: 0;
}

.anexo-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.anexo-item__nome {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anexo-item__meta {
  font-size: 12px;
  color: #888;
}

.anexo-item__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Orçamentos List */
.orcamentos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.orcamento-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #d0e3f7;
}

.orcamento-item__date {
  font-weight: 600;
  font-size: 13px;
  color: #2563eb;
  background: #dbeafe;
  padding: 4px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.orcamento-item__info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
}

.orcamento-item__valor {
  font-weight: 600;
  color: #16a34a;
  font-size: 14px;
}

.orcamento-item__metragem {
  font-size: 13px;
  color: #666;
}

.orcamento-item__proposta {
  font-size: 12px;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.orcamento-item__desc {
  font-size: 12px;
  color: #666;
  flex: 1;
  min-width: 100px;
}

/* Form Elements */
.form-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Button Variants */
.btn--sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>
