<template>
  <div class="crm">
    <!-- Header -->
    <header class="crm-header">
      <div class="crm-header__top">
        <div class="crm-header__title-row">
          <!-- Pixel Train with Smoke -->
          <div class="pixel-train">
            <svg class="train-svg" viewBox="0 0 64 40" fill="none">
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
          <button class="btn btn--primary" @click="openNewDeal">
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
    <div v-if="showFilters" class="filters-bar">
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
    <div class="pipeline" ref="pipelineRef">
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
                <span class="deal-card__id">#{{ deal.id.slice(-4) }}</span>
              </div>

              <div class="deal-card__value">
                {{ formatCurrency(deal.value || 0) }}
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
                <button class="deal-action" title="Agendar" @click.stop="scheduleMeeting(deal)">
                  📅
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
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">{{ selectedDeal.clientName }}</h2>
            <button class="modal__close" @click="closeDealDetail">✕</button>
          </div>
          <div class="modal__body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Valor</span>
                <span class="detail-value detail-value--large">
                  {{ formatCurrency(selectedDeal.value || 0) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Estágio</span>
                <span class="detail-value">
                  {{ stages.find(s => s.id === selectedDeal.status)?.name || 'N/A' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Consultor</span>
                <span class="detail-value">{{ selectedDeal.consultor || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Dias no estágio</span>
                <span class="detail-value">{{ selectedDeal.daysInStage || 0 }} dias</span>
              </div>
              <div class="detail-item detail-item--full">
                <span class="detail-label">Endereço</span>
                <span class="detail-value">{{ selectedDeal.endereco || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">M² Total</span>
                <span class="detail-value">{{ selectedDeal.m2Total || 0 }} m²</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Telefone</span>
                <span class="detail-value">{{ selectedDeal.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="closeDealDetail">Fechar</button>
            <button class="btn btn--primary" @click="editDeal(selectedDeal)">Editar</button>
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
              <g transform="scale(0.4) translate(-32, -20)">
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
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import PipelineSettings from '@/components/crm/PipelineSettings.vue';

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
const selectedPeriod = ref('30');
const sortBy = ref('recent');

// Specialist Selector
const showSpecialistModal = ref(false);
const selectedSpecialist = ref('');

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
  const dealsWithDays = deals.value.filter(d => d.daysInStage > 0);
  if (dealsWithDays.length === 0) return 0;
  const total = dealsWithDays.reduce((sum, d) => sum + (d.daysInStage || 0), 0);
  return Math.round(total / dealsWithDays.length);
});

const avgTicket = computed(() => {
  const dealsWithValue = deals.value.filter(d => d.value > 0);
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
  return selectedSpecialist.value.split(' ')[0].toUpperCase();
});

const filteredDeals = computed(() => {
  let result = [...deals.value];

  // Filtro por busca
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.clientName?.toLowerCase().includes(q) ||
      d.endereco?.toLowerCase().includes(q)
    );
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
    case 'oldest':
      result.sort((a, b) => (a.daysInStage || 0) - (b.daysInStage || 0));
      break;
    case 'recent':
      result.sort((a, b) => (b.daysInStage || 0) - (a.daysInStage || 0));
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
      result.sort((a, b) => (b.daysInStage || 0) - (a.daysInStage || 0));
      break;
    case 'days-low':
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
  selectedPeriod.value = '30';
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

const openDealDetail = (deal: Deal) => {
  selectedDeal.value = deal;
};

const closeDealDetail = () => {
  selectedDeal.value = null;
};

const editDeal = (deal: Deal) => {
  // TODO: Implement edit
  console.log('Edit deal:', deal);
};

const sendWhatsApp = (deal: Deal) => {
  if (deal.phone) {
    const phone = deal.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  } else {
    toast.warning('Deal sem telefone cadastrado');
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
    const response = await fetch(`/api/admin/comercial?days=${selectedPeriod.value}`);
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
      ...d,
      clientName: d.personName || d.project?.cliente || d.pipedriveRawData?.title || 'Sem nome',
      value: parseFloat(d.dealValue) || parseFloat(d.pipedriveRawData?.value) || 0,
      status: mapStatus(d.stageName || d.status),
      consultor: d.ownerUserName || 'N/A',
      phone: d.personPhone || '',
      endereco: d.project?.endereco || d.cidadeExecucaoDesc || '',
      m2Total: parseFloat(d.project?.m2Total) || parseFloat(d.metragemEstimada) || 0,
      daysInStage: calculateDaysInStage(d.stageChangeTime || d.dealAddTime)
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
</style>
