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
          <button class="btn btn--outline" @click="toggleFilters">
            <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtros
          </button>

          <!-- Notification Bell - Always Visible -->
          <div class="notification-bell-container">
            <button
              class="notification-bell"
              :class="{
                'notification-bell--active': filteredActiveProposals.length > 0,
                'notification-bell--has-notifications': totalNotificationCount > 0
              }"
              @click="toggleNotificationPanel"
              ref="bellButtonRef"
            >
              <svg class="notification-bell__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div v-if="filteredActiveProposals.length > 0" class="notification-bell__eye">
                <div class="notification-bell__eye-pupil"></div>
              </div>
              <span v-if="totalNotificationCount > 0" class="notification-bell__badge">
                {{ totalNotificationCount > 9 ? '9+' : totalNotificationCount }}
              </span>
            </button>

            <!-- Notification Panel Dropdown -->
            <Transition name="panel-slide">
              <div v-if="showNotificationPanel" class="notification-panel" ref="notificationPanelRef">
                <div class="notification-panel__header">
                  <div class="notification-panel__title">
                    <svg class="notification-panel__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    CENTRAL DE ATIVIDADE
                  </div>
                  <button class="notification-panel__close" @click="showNotificationPanel = false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <!-- Live Section - Controlável pelo usuário -->
                <div class="notification-panel__section notification-panel__section--live" v-if="showLiveViewers && filteredActiveProposals.length > 0">
                  <div class="notification-panel__section-header notification-panel__section-header--closeable">
                    <div class="notification-panel__section-title">
                      <span class="notification-panel__section-dot notification-panel__section-dot--live"></span>
                      AO VIVO
                      <span class="notification-panel__section-count">{{ filteredActiveProposals.length }}</span>
                    </div>
                    <button class="notification-panel__section-close" @click="showLiveViewers = false" title="Fechar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div class="notification-panel__list">
                    <div
                      v-for="(proposal, index) in filteredActiveProposals"
                      :key="proposal.sessionId"
                      class="notification-item notification-item--live"
                      :style="{ '--item-delay': index * 0.05 + 's' }"
                      @click="openLeadFromNotification(proposal.leadId); showNotificationPanel = false;"
                    >
                      <div class="notification-item__avatar">
                        <span class="notification-item__avatar-letter">{{ proposal.clientName?.charAt(0)?.toUpperCase() || '?' }}</span>
                        <span class="notification-item__avatar-pulse"></span>
                      </div>
                      <div class="notification-item__content">
                        <div class="notification-item__name">{{ proposal.clientName }}</div>
                        <div class="notification-item__meta">
                          <span class="notification-item__device">{{ proposal.deviceType === 'mobile' ? '📱' : '💻' }}</span>
                          <span class="notification-item__owner">{{ proposal.ownerUserName }}</span>
                        </div>
                      </div>
                      <div class="notification-item__stats">
                        <div class="notification-item__timer">
                          <svg class="notification-item__timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span class="notification-item__timer-value">{{ formatLiveTime(proposal.timeOnPage) }}</span>
                        </div>
                        <div class="notification-item__scroll-bar">
                          <div class="notification-item__scroll-fill" :style="{ width: proposal.scrollDepth + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State - Apenas quando não há viewers ativos E histórico -->
                <div v-if="filteredActiveProposals.length === 0 && filteredHistoryViews.length === 0" class="notification-panel__empty">
                  <div class="notification-panel__empty-icon">👁️</div>
                  <div class="notification-panel__empty-text">Nenhuma visualização registrada</div>
                  <div class="notification-panel__empty-subtext">Você será notificado quando um cliente abrir</div>
                </div>

                <!-- History Section - Minimizável -->
                <div class="notification-panel__section notification-panel__section--history" v-if="filteredHistoryViews.length > 0">
                  <div class="notification-panel__section-header notification-panel__section-header--toggle" @click="isHistoryMinimized = !isHistoryMinimized">
                    <div class="notification-panel__section-title">
                      <span class="notification-panel__section-dot notification-panel__section-dot--history"></span>
                      HISTÓRICO (24H)
                      <span class="notification-panel__section-count">{{ filteredHistoryViews.length }}</span>
                    </div>
                    <button class="notification-panel__section-toggle" :class="{ 'notification-panel__section-toggle--minimized': isHistoryMinimized }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                  <Transition name="collapse">
                    <div v-show="!isHistoryMinimized" class="notification-panel__list notification-panel__list--compact">
                      <div
                        v-for="view in filteredHistoryViews.slice(0, 15)"
                        :key="view.id"
                        class="notification-item notification-item--history"
                        @click="openLeadFromNotification(view.leadId); showNotificationPanel = false;"
                      >
                        <div class="notification-item__type-badge" :title="view.deviceType === 'mobile' ? 'Mobile' : 'Desktop'">
                          {{ getVisitorEmoji(view.sessionId) }}
                        </div>
                        <div class="notification-item__content">
                          <div class="notification-item__name">{{ view.clientName }}</div>
                          <div class="notification-item__meta">
                            <span>{{ formatLiveTime(view.timeOnPage) }} • {{ view.scrollDepth }}% scroll</span>
                            <span class="notification-item__owner-small">{{ view.ownerUserName }}</span>
                          </div>
                        </div>
                        <div class="notification-item__time-ago">
                          {{ view.deviceType === 'mobile' ? '📱' : '💻' }}
                          {{ formatTimeAgo(view.viewedAt.getTime()) }}
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </Transition>

            <!-- Toast Notifications - Aparecem no topo quando alguém abre proposta -->
            <TransitionGroup name="toast-slide" tag="div" class="toast-notifications">
              <div
                v-for="toast in liveViewerToasts"
                :key="toast.id"
                class="toast-notification toast-notification--live"
                @click="openLeadFromNotification(toast.leadId); dismissToast(toast.id)"
              >
                <div class="toast-notification__pulse"></div>
                <div class="toast-notification__icon">
                  {{ getVisitorEmoji(toast.sessionId) }}
                </div>
                <div class="toast-notification__content">
                  <div class="toast-notification__title">{{ toast.clientName }}</div>
                  <div class="toast-notification__subtitle">
                    {{ toast.deviceType === 'mobile' ? '📱' : '💻' }} está visualizando a proposta
                  </div>
                </div>
                <button class="toast-notification__close" @click.stop="dismissToast(toast.id)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </TransitionGroup>
          </div>

          <button class="btn btn--primary" @click="openNewDeal()">
            <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Deal
          </button>
        </div>
      </div>

      <!-- KPIs Row -->
      <div class="crm-kpis">
        <div class="kpi-card kpi-card--deals">
          <div class="kpi-card__icon">
            <!-- Target Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ totalDeals }}</span>
            <span class="kpi-card__label">Deals Ativos</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--pipeline">
          <div class="kpi-card__icon">
            <!-- Money/Coins Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="9" r="7"/>
              <path d="M9 6v6M6 9h6"/>
              <circle cx="15" cy="15" r="7" fill="var(--yellow)" stroke="currentColor"/>
              <path d="M15 12v6M12 15h6"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ formatCurrency(totalValue) }}</span>
            <span class="kpi-card__label">Em Pipeline</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--won">
          <div class="kpi-card__icon">
            <!-- Trophy Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 4h12v6a6 6 0 01-12 0V4z" fill="var(--yellow)"/>
              <path d="M6 4H4a2 2 0 000 4h2M18 4h2a2 2 0 010 4h-2"/>
              <path d="M12 16v4M8 22h8"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ getStageDeals('Ganho').length }}</span>
            <span class="kpi-card__label">Ganhos</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--conversion">
          <div class="kpi-card__icon">
            <!-- Chart Up Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="4 16 8 12 12 14 20 6"/>
              <polyline points="14 6 20 6 20 12"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ conversionRate }}%</span>
            <span class="kpi-card__label">Taxa Conversão</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--avg">
          <div class="kpi-card__icon">
            <!-- Clock Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ avgDaysInPipeline }}d</span>
            <span class="kpi-card__label">Tempo Médio</span>
          </div>
        </div>

        <div class="kpi-card kpi-card--ticket">
          <div class="kpi-card__icon">
            <!-- Ticket Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M4 6h16a2 2 0 012 2v2a2 2 0 00-2 2 2 2 0 002 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 002-2 2 2 0 00-2-2V8a2 2 0 012-2z" fill="var(--yellow)"/>
              <line x1="10" y1="6" x2="10" y2="18" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__value">{{ formatCurrency(avgTicket) }}</span>
            <span class="kpi-card__label">Ticket Médio</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Search Bar with Autocomplete -->
    <div class="search-bar-container" v-if="!loading">
      <div class="search-bar" :class="{ 'search-bar--focused': showSearchSuggestions }">
        <!-- Saturn Icon -->
        <img class="search-bar__saturn" src="/images/saturn.png" alt="Saturn" />
        <input
          type="text"
          class="search-bar__input"
          placeholder="Buscar por nome, telefone ou email..."
          v-model="searchQuery"
          @focus="showSearchSuggestions = true"
          @blur="handleSearchBlur"
          @keydown.escape="showSearchSuggestions = false"
          @keydown.enter="handleSearchEnter"
          @keydown.down.prevent="navigateSuggestion(1)"
          @keydown.up.prevent="navigateSuggestion(-1)"
        />
        <button v-if="searchQuery" class="search-bar__clear" @click="clearSearch">✕</button>
      </div>

      <!-- Search Suggestions Dropdown -->
      <div v-if="showSearchSuggestions && searchQuery.length >= 2" class="search-suggestions">
        <div v-if="searchSuggestions.length === 0" class="search-suggestions__empty">
          Nenhum resultado encontrado
        </div>
        <div
          v-for="(suggestion, index) in searchSuggestions"
          :key="suggestion.id"
          class="search-suggestion"
          :class="{ 'search-suggestion--active': selectedSuggestionIndex === index }"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          <div class="search-suggestion__main">
            <span class="search-suggestion__name">{{ suggestion.clientName || 'Sem nome' }}</span>
            <span class="search-suggestion__stage" :class="`search-suggestion__stage--${getStageColorName(suggestion.status || '')}`">
              <span class="search-suggestion__stage-icon" v-html="getStageIconSvg(suggestion.status || '')"></span>
              {{ getStageName(suggestion.status || '') }}
            </span>
          </div>
          <div class="search-suggestion__details">
            <span v-if="suggestion.phone" class="search-suggestion__phone">
              <svg class="search-suggestion__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {{ suggestion.phone }}
            </span>
            <span v-if="suggestion.personEmail" class="search-suggestion__email">
              <svg class="search-suggestion__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {{ suggestion.personEmail }}
            </span>
          </div>
          <div v-if="suggestion.cidadeExecucao" class="search-suggestion__location">
            <svg class="search-suggestion__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ traduzirCidade(suggestion.cidadeExecucao) }}
          </div>
        </div>
      </div>
    </div>

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
            <span class="pipeline-column__icon" v-html="getStageIconSvg(stage.id)"></span>
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
              :class="{
                'deal-card--dragging': draggingDeal?.id === deal.id,
                'deal-card--new': newlyCreatedDealId === deal.id
              }"
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
                  <svg v-if="deal.tipoCliente === 'Consumidor Final'" class="deal-card__tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <svg v-else class="deal-card__tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 18v3h20v-3"/><path d="M6 14v4"/><path d="M18 14v4"/><path d="M12 14v4"/><path d="M4 10h16"/><path d="M4 10 12 3l8 7"/></svg>
                  {{ deal.tipoCliente }}
                </span>
                <span v-if="deal.metragemEstimadaN1" class="deal-card__tag deal-card__tag--m2">
                  <svg class="deal-card__tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="M8 17V9"/><path d="M12 17V5"/><path d="M16 17v-4"/><path d="M20 17v-8"/></svg>
                  {{ deal.metragemEstimadaN1 }}
                </span>
              </div>

              <div class="deal-card__value">
                {{ formatCurrency(deal.value || 0) }}
              </div>

              <!-- Cidade -->
              <div class="deal-card__location" v-if="deal.cidadeExecucao">
                📍 {{ traduzirCidade(deal.cidadeExecucao) }}
              </div>

              <div class="deal-card__footer">
                <div class="deal-card__specialist" :title="deal.consultor">
                  <span
                    class="deal-card__specialist-dot"
                    :style="{ backgroundColor: getSpecialistColor(deal.consultor) }"
                  ></span>
                  <span class="deal-card__specialist-name">{{ getSpecialistFirstName(deal.consultor) }}</span>
                </div>
                <div class="deal-card__views">
                  <svg class="deal-card__views-icon" viewBox="0 0 24 16" fill="none">
                    <!-- Outer eye shape -->
                    <path
                      d="M2 8C2 8 6 2 12 2C18 2 22 8 22 8C22 8 18 14 12 14C6 14 2 8 2 8Z"
                      stroke="#1a1a1a"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      fill="none"
                    />
                    <!-- Pupil -->
                    <circle cx="12" cy="8" r="3" fill="#1a1a1a"/>
                  </svg>
                  <span class="deal-card__views-count">{{ deal.proposalViews || 0 }}</span>
                </div>
                <div class="deal-card__days" :class="getDaysClass(deal.daysInStage)">
                  {{ deal.daysInStage || 0 }}d
                </div>
              </div>

              <div class="deal-card__actions">
                <button class="deal-action deal-action--whatsapp" title="WhatsApp" @click.stop="sendWhatsApp(deal)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </button>
                <button class="deal-action deal-action--link" title="Pipedrive" @click.stop="openPipedriveLink(deal.pipedriveUrl)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
                <button class="deal-action deal-action--menu" title="Mais" @click.stop="openMenu(deal, $event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="getStageDeals(stage.id).length === 0" class="pipeline-column__empty">
            <span class="pipeline-column__empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </span>
            <span>Arraste deals aqui</span>
          </div>
        </div>
      </div>

      <!-- Settings Column -->
      <div class="pipeline-settings-column" @click="showPipelineSettings = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
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
                <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </a>
              <button class="modal__close" @click="closeDealDetail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Pipeline Progress Bar -->
          <div class="pipeline-progress">
            <div class="pipeline-progress__track">
              <template v-for="(stage, index) in stages.filter(s => s.id !== 'Ganho' && s.id !== 'Perdido')" :key="stage.id">
                <!-- Connector line (before each stage except first) -->
                <div
                  v-if="index > 0"
                  class="pipeline-progress__connector"
                  :class="{
                    'pipeline-progress__connector--completed': getStageIndex(selectedDeal.status) >= index,
                    'pipeline-progress__connector--pending': getStageIndex(selectedDeal.status) < index
                  }"
                ></div>

                <!-- Stage circle -->
                <div
                  class="pipeline-progress__stage"
                  :class="{
                    'pipeline-progress__stage--completed': getStageIndex(selectedDeal.status) > index,
                    'pipeline-progress__stage--current': selectedDeal.status === stage.id,
                    'pipeline-progress__stage--pending': getStageIndex(selectedDeal.status) < index
                  }"
                  @click="changeDealStage(stage.id)"
                  :title="`${stage.name} - Clique para mover`"
                >
                  <!-- Train icon on current stage -->
                  <div v-if="selectedDeal.status === stage.id" class="pipeline-progress__train">
                    <svg viewBox="0 0 64 40" fill="none">
                      <g transform="translate(64,0) scale(-1,1)">
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
                  <span class="pipeline-progress__days">
                    {{ getStageDays(stage.id) }}d
                  </span>
                  <span class="pipeline-progress__stage-name">{{ stage.name }}</span>
                </div>
              </template>
            </div>

            <!-- Final stages: Ganho / Perdido -->
            <div class="pipeline-progress__final">
              <button
                class="pipeline-progress__final-btn pipeline-progress__final-btn--ganho"
                :class="{ 'pipeline-progress__final-btn--active': selectedDeal.status === 'Ganho' }"
                @click="changeDealStage('Ganho')"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                Ganho
              </button>
              <button
                class="pipeline-progress__final-btn pipeline-progress__final-btn--perdido"
                :class="{ 'pipeline-progress__final-btn--active': selectedDeal.status === 'Perdido' }"
                @click="changeDealStage('Perdido')"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Perdido
              </button>
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
                    {{ traduzirCidade(selectedDeal.cidadeExecucao) || 'N/A' }}
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
                <h3 class="detail-section__title">
                  <svg class="detail-section__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Orçamentos Enviados
                </h3>
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

            <!-- Analytics de Visualização da Proposta - Sempre mostra quando há proposta -->
            <div class="detail-section" v-if="ultimaProposta">
              <div class="detail-section__header">
                <h3 class="detail-section__title">
                  <svg class="detail-section__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Histórico de Visualizações
                </h3>
              </div>

              <!-- Loading state -->
              <div v-if="loadingPropostaAnalytics" class="detail-loading">
                <span class="detail-loading__spinner"></span>
                Carregando analytics...
              </div>

              <!-- Conteúdo quando há dados -->
              <template v-else-if="propostaAnalytics?.stats">
                <!-- Stats resumidos -->
                <div class="analytics-stats">
                  <div class="analytics-stat">
                    <span class="analytics-stat__value">{{ propostaAnalytics.stats.humanViews }}</span>
                    <span class="analytics-stat__label">Visualizações</span>
                  </div>
                  <div class="analytics-stat">
                    <span class="analytics-stat__value">{{ propostaAnalytics.stats.uniqueVisitors }}</span>
                    <span class="analytics-stat__label">Visitantes Únicos</span>
                  </div>
                  <div class="analytics-stat">
                    <span class="analytics-stat__value">{{ formatTime(propostaAnalytics.stats.avgTimeOnPage) }}</span>
                    <span class="analytics-stat__label">Tempo Médio</span>
                  </div>
                  <div class="analytics-stat">
                    <span class="analytics-stat__value">{{ propostaAnalytics.stats.maxScrollDepth }}%</span>
                    <span class="analytics-stat__label">Max Scroll</span>
                  </div>
                </div>

                <!-- Dispositivos -->
                <div class="analytics-devices">
                  <span class="analytics-device" title="Desktop">
                    💻 {{ propostaAnalytics.stats.deviceBreakdown.desktop }}
                  </span>
                  <span class="analytics-device" title="Mobile">
                    📱 {{ propostaAnalytics.stats.deviceBreakdown.mobile }}
                  </span>
                  <span class="analytics-device" title="Tablet">
                    📟 {{ propostaAnalytics.stats.deviceBreakdown.tablet }}
                  </span>
                </div>

                <!-- Lista de visualizações recentes -->
                <div class="analytics-views" v-if="propostaAnalytics.views.length > 0">
                  <div class="analytics-views__header">
                    Últimas Visualizações
                  </div>
                  <div class="analytics-views__list">
                    <div
                      v-for="view in propostaAnalytics.views.slice(0, 5)"
                      :key="view.id"
                      class="analytics-view-item"
                      :class="{
                        'analytics-view-item--bot': view.isBot,
                        'analytics-view-item--has-recording': getRecordingForView(view.sessionId)
                      }"
                      @click="playRecordingForView(view.sessionId)"
                    >
                      <span class="analytics-view-item__visitor" :title="`Visitante: ${view.sessionId?.slice(0, 8) || 'anônimo'}`">
                        {{ getVisitorEmoji(view.sessionId) }}
                      </span>
                      <span class="analytics-view-item__device">
                        {{ view.deviceType === 'mobile' ? '📱' : view.deviceType === 'tablet' ? '📟' : '💻' }}
                      </span>
                      <span
                        class="analytics-view-item__location"
                        :class="{ 'analytics-view-item__location--unknown': !hasViewLocation(view) }"
                        :title="getViewLocation(view)"
                        :style="{ cursor: hasViewLocation(view) ? 'help' : 'default' }"
                      >
                        📍
                      </span>
                      <span class="analytics-view-item__time">
                        {{ formatViewDate(view.viewedAt) }}
                      </span>
                      <span class="analytics-view-item__duration">
                        {{ formatTime(view.timeOnPage) }}
                      </span>
                      <span
                        class="analytics-view-item__report"
                        title="Ver detalhes da sessão"
                        @click.stop="openPageTimesModal(view)"
                      >
                        📊
                      </span>
                      <span class="analytics-view-item__scroll">
                        {{ view.scrollDepth }}%
                      </span>
                      <span
                        v-if="getRecordingForView(view.sessionId)"
                        class="analytics-view-item__play"
                        title="Assistir gravação"
                      >
                        ▶️
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Primeira e última visualização -->
                <div class="analytics-dates" v-if="propostaAnalytics.stats.firstView">
                  <span class="analytics-date">
                    Primeira: {{ formatViewDate(propostaAnalytics.stats.firstView) }}
                  </span>
                  <span class="analytics-date" v-if="propostaAnalytics.stats.lastView">
                    Última: {{ formatViewDate(propostaAnalytics.stats.lastView) }}
                  </span>
                </div>
              </template>

              <!-- Sem visualizações ainda -->
              <div v-else class="detail-empty">
                A proposta ainda não foi visualizada pelo cliente.
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
                <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Ver Proposta v{{ ultimaProposta.versao }}
              </button>
              <!-- Botão Enviar Proposta (aparece se houver proposta gerada) -->
              <button
                v-if="ultimaProposta"
                class="btn btn--success"
                @click="enviarPropostaWhatsApp"
                :disabled="enviandoProposta"
              >
                <span v-if="enviandoProposta">Enviando...</span>
                <span v-else>
                  <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Enviar Proposta v{{ ultimaProposta.versao }}
                </span>
              </button>
              <!-- Botão Gerar HTML (aparece se houver proposta gerada) -->
              <button
                v-if="ultimaProposta"
                class="btn btn--info"
                @click="gerarPropostaHTML"
                :disabled="gerandoHTML"
              >
                <span v-if="gerandoHTML">Gerando HTML...</span>
                <span v-else>
                  <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Gerar Link HTML
                </span>
              </button>
              <!-- Botão Gerar Proposta -->
              <button
                class="btn btn--gold"
                @click="gerarProposta"
                :disabled="gerandoProposta"
              >
                <span v-if="gerandoProposta">Gerando...</span>
                <span v-else>
                  <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Gerar Proposta
                </span>
              </button>
              <!-- WhatsApp simples -->
              <button class="btn btn--secondary" @click="sendWhatsApp(selectedDeal)">
                <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </button>
            </div>
            <!-- Link HTML (se existir) -->
            <div v-if="htmlPropostaUrl" class="html-link-box">
              <div class="html-link-box__header">
                <span>
                  <svg class="html-link-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Link da proposta com tracking:
                </span>
                <button class="btn btn--small btn--secondary" @click="copyHtmlLink">
                  <svg class="btn__icon--small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar
                </button>
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
            <h2 class="modal__title">🚀 Novo Lead</h2>
            <button class="modal__close" @click="closeNewDeal">✕</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Nome do Cliente *</label>
              <input type="text" class="form-input" v-model="newDeal.cliente" placeholder="Ex: João Silva" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telefone *</label>
                <input type="tel" class="form-input" v-model="newDeal.personPhone" placeholder="(11) 99999-9999" />
              </div>
              <div class="form-group">
                <label class="form-label">E-mail</label>
                <input type="email" class="form-input" v-model="newDeal.personEmail" placeholder="email@exemplo.com" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cidade</label>
                <input type="text" class="form-input" v-model="newDeal.cidade" placeholder="Ex: São Paulo" />
              </div>
              <div class="form-group">
                <label class="form-label">Metragem (m²)</label>
                <input type="number" class="form-input" v-model="newDeal.m2Total" placeholder="Ex: 150" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Endereço</label>
              <input type="text" class="form-input" v-model="newDeal.endereco" placeholder="Rua, número, bairro" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipo de Cliente</label>
                <select class="form-select" v-model="newDeal.tipoCliente">
                  <option value="FINAL">Cliente Final</option>
                  <option value="ARQUITETO">Arquiteto</option>
                  <option value="CONSTRUTORA">Construtora</option>
                  <option value="DESIGNER">Designer</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Origem</label>
                <select class="form-select" v-model="newDeal.origem">
                  <option value="CRM_MANUAL">Cadastro Manual</option>
                  <option value="INDICACAO">Indicação</option>
                  <option value="SITE">Site</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Detalhes / Observações</label>
              <textarea class="form-input" v-model="newDeal.detalhes" placeholder="Informações adicionais sobre o lead..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="closeNewDeal">Cancelar</button>
            <button class="btn btn--primary" @click="createDeal" :disabled="!newDeal.cliente || !newDeal.personPhone">
              Criar Lead
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
            <h2 class="modal__title">
              <svg class="modal__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Registrar Orçamento Enviado
            </h2>
            <button class="modal__close" @click="closeOrcamentoModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
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

    <!-- Modal Replay de Sessão -->
    <Teleport to="body">
      <div v-if="showReplayModal" class="modal-overlay modal-overlay--dark" @click.self="closeReplayModal">
        <div class="modal modal--replay">
          <div class="modal__header">
            <h2 class="modal__title">
              <svg class="modal__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              Gravação de Sessão
            </h2>
            <div class="replay-info" v-if="selectedRecording">
              <span class="replay-device">
                {{ selectedRecording.deviceType === 'mobile' ? '📱' : selectedRecording.deviceType === 'tablet' ? '📟' : '💻' }}
                {{ selectedRecording.screenWidth }}x{{ selectedRecording.screenHeight }}
              </span>
              <span class="replay-duration">
                {{ formatTime(selectedRecording.duration || 0) }}
              </span>
            </div>
            <button class="modal__close" @click="closeReplayModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal__body modal__body--replay">
            <!-- Loading -->
            <div v-if="loadingReplayEvents" class="replay-loading">
              <div class="replay-loading__spinner"></div>
              <span>Carregando gravação...</span>
            </div>
            <!-- Player Container -->
            <div v-else-if="replayEvents.length > 0" class="replay-player-container" ref="replayContainer">
              <div id="rrweb-player"></div>
            </div>
            <!-- No events -->
            <div v-else class="replay-empty">
              Nenhum evento encontrado nesta gravação.
            </div>
          </div>
          <div class="modal__footer modal__footer--replay">
            <div class="replay-footer-controls">
              <button class="replay-footer-btn replay-footer-btn--play" @click="toggleReplayPlay" :title="isReplayPlaying ? 'Pausar' : 'Reproduzir'">
                {{ isReplayPlaying ? '⏸' : '▶' }}
              </button>
              <input
                type="range"
                class="replay-footer-progress"
                min="0"
                max="100"
                :value="replayProgress"
                @input="seekReplay($event)"
              >
              <span class="replay-footer-time">{{ replayCurrentTime }} / {{ replayTotalTime }}</span>
              <button
                class="replay-footer-btn replay-footer-btn--skip"
                :class="{ active: replaySkipInactive }"
                @click="toggleSkipInactive"
                title="Pular períodos inativos"
              >⏩</button>
              <div class="replay-footer-speeds">
                <button
                  v-for="speed in [1, 2, 4]"
                  :key="speed"
                  class="replay-footer-btn replay-footer-btn--speed"
                  :class="{ active: replaySpeed === speed }"
                  @click="setReplaySpeed(speed)"
                >{{ speed }}x</button>
              </div>
            </div>
            <button class="btn btn--outline" @click="closeReplayModal">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Tempo por Página -->
    <Teleport to="body">
      <div v-if="showPageTimesModal" class="modal-overlay" @click.self="showPageTimesModal = false">
        <div class="modal modal--page-times">
          <div class="modal__header">
            <h2 class="modal__title">
              <svg class="modal__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 3v18h18"/>
                <path d="M8 17V9"/>
                <path d="M12 17V5"/>
                <path d="M16 17v-4"/>
                <path d="M20 17v-8"/>
              </svg>
              Tempo por Página
            </h2>
            <button class="modal__close" @click="showPageTimesModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal__body">
            <!-- Info da visualização -->
            <div class="page-times-info" v-if="selectedPageTimesView">
              <span class="page-times-info__device">
                {{ selectedPageTimesView.deviceType === 'mobile' ? '📱' : selectedPageTimesView.deviceType === 'tablet' ? '📟' : '💻' }}
              </span>
              <span class="page-times-info__date">
                {{ formatViewDate(selectedPageTimesView.viewedAt) }}
              </span>
              <span class="page-times-info__total">
                Total: {{ formatTime(selectedPageTimesView.timeOnPage) }}
              </span>
            </div>

            <!-- Gráfico de barras por página -->
            <div class="page-times-chart" v-if="selectedPageTimesView?.pageTimes && Object.keys(selectedPageTimesView.pageTimes).length > 0">
              <div
                v-for="(time, page) in selectedPageTimesView.pageTimes"
                :key="page"
                class="page-time-bar"
              >
                <span class="page-time-bar__label">Página {{ page }}</span>
                <div class="page-time-bar__track">
                  <div
                    class="page-time-bar__fill"
                    :style="{ width: getPageTimePercentage(time) + '%' }"
                  ></div>
                </div>
                <span class="page-time-bar__value">{{ formatTime(time) }}</span>
              </div>
            </div>

            <!-- Mensagem quando não há dados detalhados -->
            <div class="page-times-empty" v-if="!selectedPageTimesView?.pageTimes || Object.keys(selectedPageTimesView.pageTimes).length === 0">
              <p>Dados detalhados de páginas não disponíveis para esta sessão.</p>
              <p class="page-times-empty__hint">Sessões muito curtas podem não ter tempo suficiente para coletar dados por página.</p>
            </div>

            <!-- Páginas visualizadas -->
            <div class="page-times-pages" v-if="selectedPageTimesView?.pagesViewed && selectedPageTimesView.pagesViewed.length > 0">
              <span class="page-times-pages__label">Páginas vistas:</span>
              <span class="page-times-pages__list">
                {{ Array.isArray(selectedPageTimesView.pagesViewed) ? selectedPageTimesView.pagesViewed.join(', ') : selectedPageTimesView.pagesViewed }}
              </span>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" @click="showPageTimesModal = false">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== NOTIFICAÇÕES DE PROPOSTA EM TEMPO REAL ===== -->
    <div class="proposal-notifications" v-if="filteredActiveProposals.length > 0 || filteredProposalNotifications.length > 0">
      <!-- Propostas sendo visualizadas agora -->
      <div class="proposal-notifications__live" v-if="filteredActiveProposals.length > 0">
        <div class="proposal-notifications__header">
          <span class="proposal-notifications__icon">👁️</span>
          <span class="proposal-notifications__title">Visualizando Agora</span>
          <span class="proposal-notifications__count">{{ filteredActiveProposals.length }}</span>
        </div>
        <div class="proposal-notifications__list">
          <div
            v-for="proposal in filteredActiveProposals"
            :key="proposal.sessionId"
            class="proposal-notification proposal-notification--live"
            @click="openLeadFromNotification(proposal.leadId)"
          >
            <div class="proposal-notification__avatar">
              {{ proposal.clientName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="proposal-notification__content">
              <span class="proposal-notification__name">{{ proposal.clientName }}</span>
              <span class="proposal-notification__meta">
                <span class="proposal-notification__time-live">{{ formatTime(proposal.timeOnPage) }}</span>
                <span class="proposal-notification__device">{{ proposal.deviceType === 'mobile' ? '📱' : '💻' }}</span>
                <span class="proposal-notification__scroll">{{ proposal.scrollDepth }}%</span>
              </span>
            </div>
            <div class="proposal-notification__pulse"></div>
          </div>
        </div>
      </div>

      <!-- Histórico de notificações -->
      <div class="proposal-notifications__history" v-if="filteredProposalNotifications.length > 0">
        <div class="proposal-notifications__header">
          <span class="proposal-notifications__icon">📋</span>
          <span class="proposal-notifications__title">Histórico</span>
        </div>
        <div class="proposal-notifications__list proposal-notifications__list--compact">
          <div
            v-for="notif in filteredProposalNotifications.slice(0, 5)"
            :key="notif.id"
            class="proposal-notification proposal-notification--history"
            :class="{ 'proposal-notification--closed': notif.type === 'closed' }"
            @click="openLeadFromNotification(notif.leadId)"
          >
            <div class="proposal-notification__type">
              {{ notif.type === 'opened' ? '🟢' : '🔴' }}
            </div>
            <div class="proposal-notification__content">
              <span class="proposal-notification__name">{{ notif.clientName }}</span>
              <span class="proposal-notification__meta">
                {{ notif.type === 'opened' ? 'Abriu' : 'Fechou' }}
                <template v-if="notif.timeOnPage"> • {{ formatTime(notif.timeOnPage) }}</template>
              </span>
            </div>
            <button
              class="proposal-notification__dismiss"
              @click.stop="dismissNotification(notif.id)"
              title="Dispensar"
            >×</button>
          </div>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { comercialApi } from '@/api';
import PipelineSettings from '@/components/crm/PipelineSettings.vue';
import {
  connectSocket,
  onProposalOpened,
  onProposalViewing,
  onProposalClosed,
  onProposalGPSUpdated,
} from '@/services/socket';
import type {
  ProposalOpenedEvent,
  ProposalViewingEvent,
  ProposalClosedEvent,
  ProposalGPSUpdatedEvent,
} from '@/services/socket';

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

// Analytics de visualização de proposta
interface ProposalViewRecord {
  id: string;
  sessionId?: string;
  viewedAt: string;
  deviceType: string;
  timeOnPage: number;
  scrollDepth: number;
  isBot: boolean;
  pageTimes?: Record<string, number>; // Tempo por página: {"1": 30, "2": 15, ...}
  pagesViewed?: number[]; // Páginas visualizadas: [1, 2, 3, ...]
  currentPage?: number; // Página atual
  // Localização
  city?: string;
  region?: string;
  country?: string;
  gpsCity?: string;
  gpsState?: string;
  gpsNeighbourhood?: string;
  gpsRoad?: string;
  gpsGranted?: boolean;
}

interface ProposalAnalytics {
  proposta: {
    id: string;
    htmlSlug: string;
    publicUrl: string;
    createdAt: string;
  };
  views: ProposalViewRecord[];
  stats: {
    totalViews: number;
    humanViews: number;
    botViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    maxScrollDepth: number;
    deviceBreakdown: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    firstView: string | null;
    lastView: string | null;
  } | null;
}

// Session Recordings (Gravações de Tela)
interface SessionRecording {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  eventsCount: number;
  deviceType: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
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
const replayContainer = ref<HTMLElement | null>(null);

// Filters
const searchQuery = ref('');
const selectedConsultor = ref('');
const selectedPeriod = ref(''); // Todos por padrão
const sortBy = ref('recent');

// Search Autocomplete
const showSearchSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);

// Specialist Selector
const showSpecialistModal = ref(false);
const selectedSpecialist = ref('');

// Notification Bell
const showNotificationPanel = ref(false);
const isHistoryMinimized = ref(false);
const showLiveViewers = ref(false); // Mostra seção AO VIVO apenas quando há novas visualizações
const liveViewerToasts = ref<Array<{
  id: string;
  clientName: string;
  ownerUserName: string;
  leadId: string;
  deviceType: string;
  sessionId: string;
  timestamp: Date;
}>>([]);
const bellButtonRef = ref<HTMLElement | null>(null);
const notificationPanelRef = ref<HTMLElement | null>(null);

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
  'Rodrigo',
  'Maria Clara',
]);

// Mapeamento de email para nome do vendedor (para pré-seleção no login)
const EMAIL_TO_SPECIALIST: Record<string, string> = {
  'gabriel': 'Gabriel Accardo',
  'isabela': 'Isabela de Moraes',
  'amanda': 'Amanda Vantini',
  'joao': 'João Farah',
  'renata': 'Renata Garcia Penna',
  'rodrigo': 'Rodrigo',
  'maria': 'Maria Clara',
  'mariaclara': 'Maria Clara',
};

// Mapeamento de IDs e códigos de cidade do Pipedrive para nomes legíveis
const CIDADE_ID_MAP: Record<string, string> = {
  // IDs numéricos
  '179': 'São Paulo (Capital)',
  '180': 'Rio de Janeiro (Capital)',
  '181': 'Curitiba',
  '182': 'Interior ou Litoral Paulista',
  '183': 'Interior ou Litoral Carioca',
  '184': 'Santa Catarina',
  '185': 'Litoral Paranaense',
  '186': 'Outro',
  // Códigos string (formato antigo)
  'SP_CAPITAL': 'São Paulo (Capital)',
  'RJ_CAPITAL': 'Rio de Janeiro (Capital)',
  'CURITIBA': 'Curitiba',
  'SP_INTERIOR': 'Interior ou Litoral Paulista',
  'SP_LITORAL': 'Interior ou Litoral Paulista',
  'RJ_INTERIOR': 'Interior ou Litoral Carioca',
  'RJ_LITORAL': 'Interior ou Litoral Carioca',
  'SANTA_CATARINA': 'Santa Catarina',
  'SC': 'Santa Catarina',
  'PR_LITORAL': 'Litoral Paranaense',
  'OUTRO': 'Outro',
  'OUTROS': 'Outro',
};

// Função para traduzir ID/código de cidade para nome legível
const traduzirCidade = (cidade: string | null | undefined): string => {
  if (!cidade) return '';
  // Verificar se está no mapa (IDs numéricos ou códigos string)
  if (CIDADE_ID_MAP[cidade]) {
    return CIDADE_ID_MAP[cidade];
  }
  // Verificar em maiúsculas também
  const upperCidade = cidade.toUpperCase();
  if (CIDADE_ID_MAP[upperCidade]) {
    return CIDADE_ID_MAP[upperCidade];
  }
  // Se não encontrar, retornar como está
  return cidade;
};

// Função para pré-selecionar vendedor baseado no email do usuário logado
const preSelectSpecialistFromEmail = () => {
  const userEmail = authStore.user?.email?.toLowerCase() || '';
  if (!userEmail) return;

  const emailPrefix = userEmail.split('@')[0] || ''; // pega só a parte antes do @

  // Procurar match no mapeamento
  for (const [key, specialistName] of Object.entries(EMAIL_TO_SPECIALIST)) {
    if (emailPrefix.includes(key)) {
      selectedSpecialist.value = specialistName;
      console.log(`[Comercial] Pré-selecionado vendedor: ${specialistName} (email: ${userEmail})`);
      return;
    }
  }
};

// =============================================
// CACHE SYSTEM - Evita re-fetches desnecessários
// =============================================
interface CacheEntry {
  data: any;
  timestamp: number;
}

const frontendCache = new Map<string, CacheEntry>();
const FRONTEND_CACHE_TTL = 30 * 1000; // 30 segundos

const getCached = <T>(key: string): T | null => {
  const cached = frontendCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < FRONTEND_CACHE_TTL) {
    console.log(`[FE Cache] HIT: ${key}`);
    return cached.data as T;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  frontendCache.set(key, { data, timestamp: Date.now() });
  console.log(`[FE Cache] SET: ${key}`);
};

const invalidateCache = (leadId: string) => {
  const keysToDelete = Array.from(frontendCache.keys()).filter(k => k.includes(leadId));
  keysToDelete.forEach(k => frontendCache.delete(k));
  console.log(`[FE Cache] INVALIDATED: ${keysToDelete.length} keys for ${leadId}`);
};

// Propostas
const ultimaProposta = ref<Proposta | null>(null);
const loadingProposta = ref(false);
const gerandoProposta = ref(false);
const enviandoProposta = ref(false);
const gerandoHTML = ref(false);
const htmlPropostaUrl = ref<string | null>(null);

// Analytics de visualização de proposta
const propostaAnalytics = ref<ProposalAnalytics | null>(null);
const loadingPropostaAnalytics = ref(false);

// Session Recordings (Gravações de Tela)
const sessionRecordings = ref<SessionRecording[]>([]);
const loadingRecordings = ref(false);
const showReplayModal = ref(false);
const selectedRecording = ref<SessionRecording | null>(null);
const replayEvents = ref<any[]>([]);
const loadingReplayEvents = ref(false);

// Page Times Modal (Relatório de tempo por página)
const showPageTimesModal = ref(false);
const selectedPageTimesView = ref<any>(null);

// Replay player state
const isReplayPlaying = ref(false);
const replayProgress = ref(0);
const replayCurrentTime = ref('00:00');
const replayTotalTime = ref('00:00');
const replaySpeed = ref(1);
const replaySkipInactive = ref(false);
let rrwebPlayer: any = null;
let replayAnimationId: number | null = null;
let replayTotalDurationMs = 0;

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

// ===== PROPOSTAS EM VISUALIZAÇÃO (Real-time) =====
interface ActiveProposalView {
  sessionId: string;
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  deviceType: string;
  timeOnPage: number;
  scrollDepth: number;
  startedAt: Date;
  timestamp: Date;
}

interface ProposalNotification {
  id: string;
  type: 'opened' | 'closed' | 'gps';
  clientName: string;
  ownerUserName: string;
  leadId: string;
  timeOnPage?: number;
  deviceType?: string;
  location?: string;
  timestamp: Date;
}

const activeProposalViews = ref<Map<string, ActiveProposalView>>(new Map());
const proposalNotifications = ref<ProposalNotification[]>([]);
// Histórico de visualizações do banco de dados (últimas 24h)
const historyViews = ref<Array<{
  id: string;
  sessionId: string;
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  deviceType: string;
  timeOnPage: number;
  scrollDepth: number;
  viewedAt: Date;
}>>([]);
const unsubscribeProposalOpened = ref<(() => void) | null>(null);
const unsubscribeProposalViewing = ref<(() => void) | null>(null);
const unsubscribeProposalClosed = ref<(() => void) | null>(null);
const unsubscribeProposalGPSUpdated = ref<(() => void) | null>(null);

// New Deal Form
const newDeal = ref({
  cliente: '',
  personPhone: '',
  personEmail: '',
  endereco: '',
  cidade: '',
  m2Total: '',
  tipoCliente: 'FINAL',
  origem: 'CRM_MANUAL',
  detalhes: ''
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

// Default stages configuration - EXATAMENTE como no Pipedrive (Pipeline 1)
const DEFAULT_STAGES: Stage[] = [
  // Entrada (Form)
  { id: 'Form Orçamento', name: 'Form Orçamento', emoji: '📋', color: 'indigo', groupName: 'Entrada', probability: 5, sortOrder: 0 },
  // 1º Contato
  { id: '1º Contato', name: '1º Contato', emoji: '📞', color: 'blue', groupName: 'Contato', probability: 10, sortOrder: 1 },
  { id: '1º Contato Feito', name: '1º Contato Feito', emoji: '✅', color: 'blue', groupName: 'Contato', probability: 15, sortOrder: 2 },
  { id: 'Follow 1º Contato', name: 'Follow 1º Contato', emoji: '🔄', color: 'sky', groupName: 'Contato', probability: 18, sortOrder: 3 },
  { id: 'Follow 1º Contato Feito', name: 'Follow 1º Contato Feito', emoji: '✅', color: 'sky', groupName: 'Contato', probability: 20, sortOrder: 4 },
  // Arquiteto
  { id: 'Form Arquiteto', name: 'Form Arquiteto', emoji: '📝', color: 'cyan', groupName: 'Arquiteto', probability: 22, sortOrder: 5 },
  { id: 'Contato Arquiteto', name: 'Contato Arquiteto', emoji: '👷', color: 'cyan', groupName: 'Arquiteto', probability: 25, sortOrder: 6 },
  // Levantamento
  { id: 'Proposta Escopo Minimo', name: 'Proposta Escopo Mínimo', emoji: '📐', color: 'teal', groupName: 'Levantamento', probability: 28, sortOrder: 7 },
  { id: 'Cálculo de Projeto', name: 'Cálculo de Projeto', emoji: '🔢', color: 'teal', groupName: 'Levantamento', probability: 30, sortOrder: 8 },
  { id: 'Projeto levantado', name: 'Projeto Levantado', emoji: '📊', color: 'emerald', groupName: 'Levantamento', probability: 35, sortOrder: 9 },
  { id: 'Cálculo Deslocamento', name: 'Cálculo Deslocamento', emoji: '🚗', color: 'emerald', groupName: 'Levantamento', probability: 38, sortOrder: 10 },
  { id: 'Deslocamento Levantado', name: 'Deslocamento Levantado', emoji: '✅', color: 'green', groupName: 'Levantamento', probability: 40, sortOrder: 11 },
  // Proposta
  { id: 'Proposta enviada', name: 'Proposta Enviada', emoji: '📤', color: 'yellow', groupName: 'Proposta', probability: 45, sortOrder: 12 },
  // Follow-up
  { id: 'Fazer Follow 1', name: 'Fazer Follow 1', emoji: '1️⃣', color: 'amber', groupName: 'Follow-up', probability: 50, sortOrder: 13 },
  { id: 'Follow 1 Feito', name: 'Follow 1 Feito', emoji: '✅', color: 'amber', groupName: 'Follow-up', probability: 55, sortOrder: 14 },
  { id: 'Fazer Follow 2', name: 'Fazer Follow 2', emoji: '2️⃣', color: 'orange', groupName: 'Follow-up', probability: 60, sortOrder: 15 },
  { id: 'Follow 2 Feito', name: 'Follow 2 Feito', emoji: '✅', color: 'orange', groupName: 'Follow-up', probability: 65, sortOrder: 16 },
  { id: 'Fazer Follow 3', name: 'Fazer Follow 3', emoji: '3️⃣', color: 'peach', groupName: 'Follow-up', probability: 70, sortOrder: 17 },
  { id: 'Follow 3 Feito', name: 'Follow 3 Feito', emoji: '✅', color: 'peach', groupName: 'Follow-up', probability: 75, sortOrder: 18 },
  // Negociação
  { id: 'Negociações', name: 'Negociações', emoji: '🤝', color: 'gold', groupName: 'Negociação', probability: 80, sortOrder: 19 },
  // Fechamento
  { id: 'Ganho', name: 'Ganho', emoji: '🏆', color: 'success', groupName: 'Fechamento', probability: 100, sortOrder: 20 },
  { id: 'Perdido', name: 'Perdido', emoji: '❌', color: 'danger', groupName: 'Fechamento', probability: 0, sortOrder: 21 },
];

// Pipeline Stages - 17 etapas do Pipedrive
const stages = ref<Stage[]>([...DEFAULT_STAGES]);

// Computed
const totalDeals = computed(() => deals.value.length);
const totalValue = computed(() => deals.value.reduce((sum, d) => sum + (d.value || 0), 0));

const conversionRate = computed(() => {
  const won = getStageDeals('Ganho').length;
  const lost = getStageDeals('Perdido').length;
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

// Especialistas a serem excluídos da lista (admins, testes, etc)
const EXCLUDED_SPECIALISTS = [
  'x', 'admin', 'admin final', 'admin test', 'administrador', 'rodrigo'
];

const consultores = computed(() => {
  const set = new Set<string>();
  deals.value.forEach(d => {
    if (d.consultor) set.add(d.consultor);
  });
  return Array.from(set)
    .filter(c => !EXCLUDED_SPECIALISTS.includes(c.toLowerCase()))
    .sort();
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

// Propostas ativas filtradas pelo vendedor selecionado
const filteredActiveProposals = computed(() => {
  const proposals = Array.from(activeProposalViews.value.values());
  if (!selectedSpecialist.value) return proposals;

  // Filtrar por vendedor (normalizado para lowercase)
  const specialistLower = selectedSpecialist.value.toLowerCase();
  return proposals.filter(p =>
    p.ownerUserName?.toLowerCase() === specialistLower
  );
});

// Histórico de visualizações filtrado pelo vendedor selecionado (do banco de dados)
const filteredHistoryViews = computed(() => {
  if (!selectedSpecialist.value) return historyViews.value;

  const specialistLower = selectedSpecialist.value.toLowerCase();
  return historyViews.value.filter(v =>
    v.ownerUserName?.toLowerCase() === specialistLower
  );
});

// Notificações filtradas pelo vendedor selecionado (eventos de sessão)
const filteredProposalNotifications = computed(() => {
  if (!selectedSpecialist.value) return proposalNotifications.value;

  const specialistLower = selectedSpecialist.value.toLowerCase();
  return proposalNotifications.value.filter(n =>
    n.ownerUserName?.toLowerCase() === specialistLower
  );
});

// Total de notificações (ao vivo + histórico do banco)
const totalNotificationCount = computed(() => {
  return filteredActiveProposals.value.length + filteredHistoryViews.value.length;
});

// Toggle painel de notificações
const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value;
};

// Formatar tempo ao vivo (segundos para MM:SS)
const formatLiveTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Formatar tempo atrás (timestamp para "há X min")
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

// Limpar todas as notificações
const clearAllNotifications = () => {
  proposalNotifications.value = [];
};

// Dismiss toast notification
const dismissToast = (toastId: string) => {
  liveViewerToasts.value = liveViewerToasts.value.filter(t => t.id !== toastId);
};

// Adicionar toast para nova visualização
const addViewerToast = (viewer: { clientName: string; ownerUserName: string; leadId: string; deviceType: string; sessionId?: string }) => {
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Verificar se já existe toast para este lead
  const existing = liveViewerToasts.value.find(t => t.leadId === viewer.leadId);
  if (existing) return;

  liveViewerToasts.value.unshift({
    id: toastId,
    clientName: viewer.clientName,
    ownerUserName: viewer.ownerUserName,
    leadId: viewer.leadId,
    deviceType: viewer.deviceType,
    sessionId: viewer.sessionId || toastId,
    timestamp: new Date(),
  });

  // Limitar a 3 toasts
  if (liveViewerToasts.value.length > 3) {
    liveViewerToasts.value = liveViewerToasts.value.slice(0, 3);
  }

  // Auto-dismiss após 8 segundos
  setTimeout(() => {
    dismissToast(toastId);
  }, 8000);

  // Mostrar seção "AO VIVO" no painel
  showLiveViewers.value = true;
};

// Click outside handler para fechar painel
const handleClickOutsideNotification = (event: MouseEvent) => {
  if (!showNotificationPanel.value) return;

  const target = event.target as HTMLElement;
  const panel = notificationPanelRef.value;
  const bell = bellButtonRef.value;

  if (panel && !panel.contains(target) && bell && !bell.contains(target)) {
    showNotificationPanel.value = false;
  }
};

// Search suggestions computed
const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return [];

  const q = searchQuery.value.toLowerCase();
  return deals.value
    .filter(d =>
      d.clientName?.toLowerCase().includes(q) ||
      d.personEmail?.toLowerCase().includes(q) ||
      d.phone?.includes(q) ||
      d.cidadeExecucao?.toLowerCase().includes(q)
    )
    .slice(0, 8); // Limita a 8 sugestões
});

// Search helper functions
const getStageEmoji = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId);
  return stage?.emoji || '📋';
};

// Neobrutalist SVG icons for each pipeline stage
// Keys match both old UPPER_CASE format and new Pipedrive names format
const stageIcons: Record<string, string> = {
  // Entrada
  'Form Orçamento': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  'FORM_ORCAMENTO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  // Contato
  '1º Contato': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  'PRIMEIRO_CONTATO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  'CONTATO_ARQUITETO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18v3h20v-3"/><path d="M6 14v4"/><path d="M18 14v4"/><path d="M12 14v4"/><path d="M4 10h16"/><path d="M4 10 12 3l8 7"/></svg>',
  'AGUARDANDO_ARQ': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
  'LEVANTAMENTO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M8 17V9"/><path d="M12 17V5"/><path d="M16 17v-4"/><path d="M20 17v-8"/></svg>',
  'VISITA_AGENDADA': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>',
  'VISITA_REALIZADA': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'PROPOSTA_EM_ELABORACAO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  'PROPOSTA_ENVIADA': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  'FOLLOW_1': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'FOLLOW_2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'FOLLOW_3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'FOLLOW_4': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'FOLLOW_5': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  'NEGOCIACAO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  'Ganho': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  'Perdido': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
};

const getStageIconSvg = (stageId: string) => {
  return stageIcons[stageId] || stageIcons['Form Orçamento'] || stageIcons['FORM_ORCAMENTO'];
};

const getStageName = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId);
  return stage?.name || stageId;
};

const getStageColorName = (stageId: string) => {
  const stage = stages.value.find(s => s.id === stageId);
  return stage?.color || 'gray';
};

const handleSearchBlur = () => {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSearchSuggestions.value = false;
    selectedSuggestionIndex.value = -1;
  }, 200);
};

const handleSearchEnter = () => {
  const suggestion = searchSuggestions.value[selectedSuggestionIndex.value];
  if (selectedSuggestionIndex.value >= 0 && suggestion) {
    selectSuggestion(suggestion);
  }
};

const navigateSuggestion = (direction: number) => {
  if (!showSearchSuggestions.value || searchSuggestions.value.length === 0) return;

  const newIndex = selectedSuggestionIndex.value + direction;
  if (newIndex >= -1 && newIndex < searchSuggestions.value.length) {
    selectedSuggestionIndex.value = newIndex;
  }
};

const selectSuggestion = (deal: Deal) => {
  showSearchSuggestions.value = false;
  selectedSuggestionIndex.value = -1;
  openDealDetail(deal);
};

const clearSearch = () => {
  searchQuery.value = '';
  showSearchSuggestions.value = false;
  selectedSuggestionIndex.value = -1;
};

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

// Mapeamento fixo de cores por vendedor (máximo contraste)
const SPECIALIST_COLOR_MAP: Record<string, string> = {
  'gabriel accardo': '#e63946',    // vermelho
  'isabela de moraes': '#2563eb',  // azul
  'amanda vantini': '#16a34a',     // verde
  'joão farah': '#f59e0b',         // amarelo/laranja
  'joao farah': '#f59e0b',         // amarelo/laranja (sem acento)
  'renata garcia penna': '#7c3aed', // roxo
  'rodrigo': '#06b6d4',            // cyan
  'maria clara': '#ec4899',        // rosa
};

// Cores fallback para novos vendedores
const SPECIALIST_COLORS_FALLBACK = [
  '#e63946', // vermelho
  '#2563eb', // azul
  '#16a34a', // verde
  '#f59e0b', // amarelo/laranja
  '#7c3aed', // roxo
  '#06b6d4', // cyan
  '#ec4899', // rosa
  '#84cc16', // lima
  '#f97316', // laranja
  '#0d9488', // teal
];

// Cache de cores por especialista para consistência
const specialistColorCache = new Map<string, string>();

const getSpecialistColor = (name: string | undefined | null): string => {
  if (!name || name === 'N/A') return '#6b7280'; // gray

  // Normalizar nome para lowercase
  const nameNormalized = name.toLowerCase().trim();

  // Verificar cache
  const cached = specialistColorCache.get(nameNormalized);
  if (cached) {
    return cached;
  }

  // Primeiro tentar mapeamento fixo
  const fixedColor = SPECIALIST_COLOR_MAP[nameNormalized];
  if (fixedColor) {
    specialistColorCache.set(nameNormalized, fixedColor);
    return fixedColor;
  }

  // Fallback: hash para novos vendedores
  let hash = 0;
  for (let i = 0; i < nameNormalized.length; i++) {
    hash = ((hash << 5) - hash) + nameNormalized.charCodeAt(i);
    hash = hash & hash;
  }

  const colorIndex = Math.abs(hash) % SPECIALIST_COLORS_FALLBACK.length;
  const color = SPECIALIST_COLORS_FALLBACK[colorIndex] ?? '#6b7280';
  specialistColorCache.set(nameNormalized, color);

  return color;
};

const getSpecialistFirstName = (name: string | undefined | null): string => {
  if (!name || name === 'N/A') return '';
  const firstName = name.split(' ')[0] || '';
  // Capitalizar primeira letra (amanda → Amanda)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
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

// Pipeline Progress Bar helpers
const getStageIndex = (stageId?: string): number => {
  if (!stageId) return -1;
  const filteredStages = stages.value.filter(s => s.id !== 'Ganho' && s.id !== 'Perdido');
  return filteredStages.findIndex(s => s.id === stageId);
};

const getStageDays = (stageId: string): number => {
  // For now, return the days in stage if it's the current stage, otherwise 0
  // In the future, this could be tracked per-stage in the deal history
  if (selectedDeal.value?.status === stageId) {
    return selectedDeal.value?.daysInStage || 0;
  }
  // Could implement stage history tracking here
  return 0;
};

const changeDealStage = async (newStageId: string) => {
  if (!selectedDeal.value || selectedDeal.value.status === newStageId) return;

  const deal = selectedDeal.value;
  const oldStage = deal.status;
  const dealId = deal.id;

  // Optimistic update
  deal.status = newStageId;
  deal.daysInStage = 0;

  // Update in deals array
  const dealIndex = deals.value.findIndex(d => d.id === dealId);
  if (dealIndex >= 0) {
    const dealInList = deals.value[dealIndex];
    if (dealInList) {
      dealInList.status = newStageId;
      dealInList.daysInStage = 0;
    }
  }

  try {
    // Call API to update deal (same endpoint as drag&drop)
    const response = await fetch(`/api/admin/comercial/${dealId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStageId })
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar estágio');
    }

    toast.success(`Movido para ${stages.value.find(s => s.id === newStageId)?.name || newStageId}`);
  } catch (error) {
    // Revert on error
    deal.status = oldStage;
    if (dealIndex >= 0) {
      const dealInList = deals.value[dealIndex];
      if (dealInList) {
        dealInList.status = oldStage;
      }
    }
    toast.error('Erro ao atualizar estágio');
    console.error('Error updating stage:', error);
  }
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

// Format view date (mais compacto para a lista de visualizações)
const formatViewDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Se foi há menos de 1 hora, mostra minutos
  if (diffMins < 60) {
    return diffMins <= 1 ? 'agora' : `há ${diffMins}min`;
  }
  // Se foi há menos de 24 horas, mostra horas
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }
  // Se foi há menos de 7 dias, mostra dias
  if (diffDays < 7) {
    return `há ${diffDays}d`;
  }
  // Caso contrário, mostra data completa
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Verificar se tem dados de localização
const hasViewLocation = (view: ProposalViewRecord): boolean => {
  return !!(view.gpsRoad || view.gpsNeighbourhood || view.gpsCity || view.gpsState || view.city || view.region || view.country);
};

// Lista de emojis para identificar visitantes únicos
const visitorEmojis = [
  '🦊', '🐱', '🐶', '🦁', '🐯', '🐻', '🐼', '🐨', '🐵', '🦄',
  '🐸', '🐙', '🦋', '🦅', '🦉', '🐬', '🦈', '🐢', '🦩', '🦜',
  '🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🍁', '🌿', '🌵', '🌴',
  '⭐', '🌙', '☀️', '⚡', '🔥', '💧', '❄️', '🌈', '💎', '🎯',
  '🎨', '🎭', '🎪', '🎡', '🚀', '✈️', '🎸', '🎹', '🎺', '🎻'
];

// Cache de emojis por sessionId para consistência durante a sessão
const sessionEmojiCache = new Map<string, string>();

// Gerar emoji determinístico para um sessionId
const getVisitorEmoji = (sessionId: string | undefined): string => {
  if (!sessionId) return '👤';

  // Verificar cache primeiro
  const cached = sessionEmojiCache.get(sessionId);
  if (cached) {
    return cached;
  }

  // Gerar índice baseado no hash do sessionId
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % visitorEmojis.length;
  const emoji: string = visitorEmojis[index] ?? '👤';

  // Cachear para consistência
  sessionEmojiCache.set(sessionId, emoji);

  return emoji;
};

// Obter localização da visualização (para tooltip do pino)
const getViewLocation = (view: ProposalViewRecord): string => {
  const parts: string[] = [];

  // Prioriza GPS (mais preciso) sobre IP geolocation
  if (view.gpsRoad) {
    parts.push(view.gpsRoad);
  }
  if (view.gpsNeighbourhood) {
    parts.push(view.gpsNeighbourhood);
  }
  if (view.gpsCity) {
    parts.push(view.gpsCity);
  }
  if (view.gpsState) {
    parts.push(view.gpsState);
  }

  // Se temos dados de GPS, retornar
  if (parts.length > 0) {
    return parts.join(', ');
  }

  // Fallback para geolocalização por IP
  if (view.city && view.region) {
    return `${view.city}, ${view.region}`;
  }
  if (view.city) {
    return view.city;
  }
  if (view.region) {
    return view.region;
  }
  if (view.country) {
    return view.country;
  }
  return 'Localização não disponível';
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

const openNewDeal = (_stageId?: string) => {
  newDeal.value = {
    cliente: '',
    personPhone: '',
    personEmail: '',
    endereco: '',
    cidade: '',
    m2Total: '',
    tipoCliente: 'FINAL',
    origem: 'CRM_MANUAL',
    detalhes: ''
  };
  showNewDealModal.value = true;
};

const closeNewDeal = () => {
  showNewDealModal.value = false;
};

// ID do deal recém-criado para animação
const newlyCreatedDealId = ref<string | null>(null);

const createDeal = async () => {
  if (!newDeal.value.cliente || !newDeal.value.personPhone) return;

  // Pegar nome do consultor atual
  const consultorNome = authStore.user?.name || authStore.user?.email || '';

  try {
    const response = await comercialApi.create({
      cliente: newDeal.value.cliente,
      personPhone: newDeal.value.personPhone,
      personEmail: newDeal.value.personEmail || undefined,
      endereco: newDeal.value.endereco || undefined,
      cidade: newDeal.value.cidade || undefined,
      m2Total: newDeal.value.m2Total ? parseFloat(newDeal.value.m2Total) : undefined,
      tipoCliente: newDeal.value.tipoCliente,
      origem: newDeal.value.origem,
      detalhes: newDeal.value.detalhes || undefined,
      consultor: consultorNome
    });

    if (response.data?.success && response.data?.data) {
      // Converter o retorno da API para o formato Deal esperado pelo frontend
      const created = response.data.data;
      const dealId = created.comercialData?.id || created.id;

      const newDealItem: Deal = {
        id: dealId,
        personName: created.cliente || newDeal.value.cliente,
        clientName: created.cliente || newDeal.value.cliente,
        consultor: consultorNome,
        ownerUserName: consultorNome,
        status: 'Form Orçamento',
        stageName: 'Form Orçamento',
        dealValue: undefined,
        m2Total: newDeal.value.m2Total ? parseFloat(newDeal.value.m2Total) : undefined,
        addTime: new Date().toISOString(),
        dealAddTime: new Date().toISOString(),
        stageId: 'Form Orçamento',
        stageChangedTime: new Date().toISOString(),
        pipedriveId: undefined,
        personPhone: newDeal.value.personPhone,
        phone: newDeal.value.personPhone,
        personEmail: newDeal.value.personEmail || undefined,
        cidadeExecucao: newDeal.value.cidade || undefined,
        endereco: newDeal.value.endereco || undefined,
        tipoCliente: newDeal.value.tipoCliente,
        origem: newDeal.value.origem,
        resumo: newDeal.value.detalhes || undefined,
        daysInStage: 0
      };

      // Fechar modal primeiro para transição suave
      closeNewDeal();

      // Adicionar deal com animação
      newlyCreatedDealId.value = dealId;
      deals.value.unshift(newDealItem);

      toast.success(`Lead "${newDeal.value.cliente}" criado com sucesso!`);

      // Remover destaque após animação
      setTimeout(() => {
        newlyCreatedDealId.value = null;
      }, 3000);
    } else {
      throw new Error(response.data?.error || 'Falha ao criar lead');
    }
  } catch (error: any) {
    console.error('Erro ao criar lead:', error);
    toast.error(error.message || 'Erro ao criar lead');
  }
};

const openDealDetail = async (deal: Deal) => {
  selectedDeal.value = deal;
  ultimaProposta.value = null;
  propostaAnalytics.value = null;
  anexos.value = [];
  orcamentosEnviados.value = [];

  // OTIMIZADO: Usar endpoint combinado que busca TUDO de uma vez
  await fetchAllLeadDetails(deal.id);
};

// Função otimizada: busca todos os dados do lead em uma única chamada
const fetchAllLeadDetails = async (dealId: string, forceRefresh = false) => {
  const cacheKey = `details:${dealId}`;
  const startTime = Date.now();

  // Verificar cache primeiro
  if (!forceRefresh) {
    const cached = getCached<any>(cacheKey);
    if (cached) {
      console.log(`[FE] Cache HIT details (${Date.now() - startTime}ms)`);
      ultimaProposta.value = cached.proposta;
      propostaAnalytics.value = cached.analytics;
      anexos.value = cached.anexos || [];
      orcamentosEnviados.value = cached.orcamentos || [];
      // Buscar recordings separadamente (não está no endpoint combinado)
      if (cached.proposta?.id) {
        fetchRecordings(cached.proposta.id);
      }
      return;
    }
  }

  // Mostrar loading states
  loadingProposta.value = true;
  loadingPropostaAnalytics.value = true;
  loadingAnexos.value = true;
  loadingOrcamentos.value = true;

  try {
    const response = await comercialApi.getLeadDetails(dealId);

    if (response.data.success) {
      ultimaProposta.value = response.data.proposta;
      propostaAnalytics.value = response.data.analytics;
      anexos.value = response.data.anexos || [];
      orcamentosEnviados.value = response.data.orcamentos || [];

      // Salvar no cache
      setCache(cacheKey, response.data);

      console.log(`[FE] Loaded all details in ${response.data.loadTime}ms (total: ${Date.now() - startTime}ms)`);

      // Buscar recordings se tem proposta
      if (response.data.proposta?.id) {
        fetchRecordings(response.data.proposta.id);
      }
    }
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do lead:', error);
    // Fallback para chamadas individuais se o endpoint combinado falhar
    await Promise.all([
      fetchUltimaProposta(dealId),
      fetchAnexos(dealId),
      fetchOrcamentosEnviados(dealId)
    ]);
    const proposta = ultimaProposta.value as Proposta | null;
    if (proposta?.id) {
      fetchPropostaAnalytics(proposta.id);
      fetchRecordings(proposta.id);
    }
  } finally {
    loadingProposta.value = false;
    loadingPropostaAnalytics.value = false;
    loadingAnexos.value = false;
    loadingOrcamentos.value = false;
  }
};

const closeDealDetail = () => {
  selectedDeal.value = null;
  ultimaProposta.value = null;
  propostaAnalytics.value = null;
  sessionRecordings.value = [];
  anexos.value = [];
  orcamentosEnviados.value = [];
};

// Funções de Proposta
const fetchUltimaProposta = async (dealId: string, forceRefresh = false) => {
  const cacheKey = `proposta:${dealId}`;

  // Verificar cache primeiro (a menos que forceRefresh)
  if (!forceRefresh) {
    const cached = getCached<Proposta>(cacheKey);
    if (cached) {
      ultimaProposta.value = cached;
      return;
    }
  }

  loadingProposta.value = true;
  try {
    const response = await comercialApi.getUltimaProposta(dealId);
    if (response.data?.proposta) {
      ultimaProposta.value = response.data.proposta;
      setCache(cacheKey, response.data.proposta);
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

// Buscar analytics de visualização da proposta
const fetchPropostaAnalytics = async (propostaId: string, forceRefresh = false) => {
  const cacheKey = `analytics:${propostaId}`;

  // Analytics tem cache mais curto (15s) pois muda com frequência
  if (!forceRefresh) {
    const cached = getCached<ProposalAnalytics>(cacheKey);
    if (cached) {
      propostaAnalytics.value = cached;
      return;
    }
  }

  loadingPropostaAnalytics.value = true;
  try {
    const response = await comercialApi.getPropostaAnalytics(propostaId);
    if (response.data?.stats) {
      propostaAnalytics.value = response.data;
      setCache(cacheKey, response.data);
    }
  } catch (error: any) {
    // 404 significa que não há analytics ainda
    if (error.response?.status !== 404) {
      console.error('Erro ao buscar analytics:', error);
    }
  } finally {
    loadingPropostaAnalytics.value = false;
  }
};

// Buscar gravações de sessão (recordings)
const fetchRecordings = async (propostaId: string) => {
  loadingRecordings.value = true;
  try {
    const response = await comercialApi.getRecordings(propostaId);
    if (response.data?.recordings) {
      sessionRecordings.value = response.data.recordings;
    }
  } catch (error: any) {
    // 404 significa que não há recordings ainda
    if (error.response?.status !== 404) {
      console.error('Erro ao buscar recordings:', error);
    }
    sessionRecordings.value = [];
  } finally {
    loadingRecordings.value = false;
  }
};

// Abrir replay de uma sessão
const openReplay = async (recording: SessionRecording) => {
  selectedRecording.value = recording;
  loadingReplayEvents.value = true;
  showReplayModal.value = true;

  try {
    const response = await comercialApi.getRecording(recording.id);
    if (response.data?.events) {
      replayEvents.value = response.data.events;
    }
  } catch (error: any) {
    console.error('Erro ao carregar eventos do recording:', error);
    toast.error('Erro ao carregar gravação');
    replayEvents.value = [];
  } finally {
    loadingReplayEvents.value = false;
  }
};

// Fechar modal de replay
const closeReplayModal = () => {
  showReplayModal.value = false;
  selectedRecording.value = null;
  replayEvents.value = [];
};

// Abrir modal de tempo por página
const openPageTimesModal = (view: any) => {
  selectedPageTimesView.value = view;
  showPageTimesModal.value = true;
};

// Calcular percentual do tempo da página em relação ao máximo
const getPageTimePercentage = (time: number): number => {
  if (!selectedPageTimesView.value?.pageTimes) return 0;
  const times = Object.values(selectedPageTimesView.value.pageTimes) as number[];
  const maxTime = Math.max(...times, 1);
  return Math.min(100, (time / maxTime) * 100);
};

// Encontrar gravação por sessionId
const getRecordingForView = (sessionId: string | undefined): SessionRecording | undefined => {
  if (!sessionId) return undefined;
  return sessionRecordings.value.find(r => r.sessionId === sessionId);
};

// Abrir replay a partir do sessionId da view
const playRecordingForView = (sessionId: string | undefined) => {
  const recording = getRecordingForView(sessionId);
  if (recording) {
    openReplay(recording);
  }
};

// Formatar tempo para MM:SS
const formatReplayTime = (seconds: number) => {
  const mins = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const secs = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

// Atualizar tempo do player
const updateReplayTime = () => {
  if (!rrwebPlayer) return;
  const currentMs = Math.max(0, rrwebPlayer.getCurrentTime());
  const currentSec = currentMs / 1000;
  replayCurrentTime.value = formatReplayTime(currentSec);
  if (replayTotalDurationMs > 0) {
    replayProgress.value = (currentMs / replayTotalDurationMs) * 100;
  }
  if (isReplayPlaying.value) {
    replayAnimationId = requestAnimationFrame(updateReplayTime);
  }
};

// Toggle play/pause
const toggleReplayPlay = () => {
  if (!rrwebPlayer) return;
  if (isReplayPlaying.value) {
    rrwebPlayer.pause();
    if (replayAnimationId) cancelAnimationFrame(replayAnimationId);
    isReplayPlaying.value = false;
  } else {
    rrwebPlayer.play();
    isReplayPlaying.value = true;
    updateReplayTime();
  }
};

// Seek no replay
const seekReplay = (e: Event) => {
  if (!rrwebPlayer) return;
  const value = parseInt((e.target as HTMLInputElement).value);
  const seekTime = (value / 100) * replayTotalDurationMs;
  rrwebPlayer.pause();
  rrwebPlayer.play(seekTime);
  isReplayPlaying.value = true;
  updateReplayTime();
};

// Mudar velocidade
const setReplaySpeed = (speed: number) => {
  if (!rrwebPlayer) return;
  replaySpeed.value = speed;
  rrwebPlayer.setConfig({ speed });
};

// Toggle skip inactive
const toggleSkipInactive = () => {
  if (!rrwebPlayer) return;
  replaySkipInactive.value = !replaySkipInactive.value;
  rrwebPlayer.setConfig({ skipInactive: replaySkipInactive.value });
};

// Inicializar player rrweb quando eventos são carregados
watch(replayEvents, async (events) => {
  if (events.length > 0) {
    await nextTick();

    // Reset state
    isReplayPlaying.value = false;
    replayProgress.value = 0;
    replayCurrentTime.value = '00:00';
    replaySpeed.value = 1;
    replaySkipInactive.value = false;

    // Verificar se tem FullSnapshot
    const hasFullSnapshot = events.some((e: any) => e.type === 2);
    if (!hasFullSnapshot) {
      console.warn('[Replay] Gravação sem FullSnapshot - não é possível reproduzir');
      toast.error('Esta gravação está incompleta (sem snapshot inicial)');
      return;
    }

    // Limpar player anterior se existir
    const playerContainer = document.getElementById('rrweb-player');
    if (playerContainer) {
      playerContainer.innerHTML = '';
    }

    // Usar rrweb Replayer diretamente
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/rrweb@1.1.3/dist/rrweb.min.js';
    script.onload = () => {
      // Carregar CSS do rrweb
      if (!document.getElementById('rrweb-css')) {
        const link = document.createElement('link');
        link.id = 'rrweb-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/rrweb@1.1.3/dist/rrweb.min.css';
        document.head.appendChild(link);
      }

      setTimeout(() => {
        const rrwebLib = (window as any).rrweb;

        if (playerContainer && rrwebLib?.Replayer) {
          try {
            // Log Meta event dimensions
            const metaEvent = events.find((e: any) => e.type === 4);
            console.log('[Replay] Meta event:', metaEvent);
            if (metaEvent?.data) {
              console.log('[Replay] Recorded viewport:', metaEvent.data.width, 'x', metaEvent.data.height);
            }

            // O rrweb Replayer cria sua própria estrutura dentro do container
            rrwebPlayer = new rrwebLib.Replayer(events, {
              root: playerContainer,
              skipInactive: false, // Tempo real - não pular períodos inativos
              showWarning: false,
              showDebug: false,
              blockClass: 'rr-block',
              speed: 1,
            });

            // Log estrutura criada
            setTimeout(() => {
              const wrapper = playerContainer.querySelector('.replayer-wrapper') as HTMLElement | null;
              const iframe = playerContainer.querySelector('iframe') as HTMLIFrameElement | null;
              console.log('[Replay] Wrapper element:', wrapper);
              console.log('[Replay] Wrapper dimensions:', wrapper?.offsetWidth, 'x', wrapper?.offsetHeight);
              console.log('[Replay] Iframe element:', iframe);
              console.log('[Replay] Iframe dimensions:', iframe?.offsetWidth, 'x', iframe?.offsetHeight);
              if (iframe) {
                console.log('[Replay] Iframe style.width:', iframe.style.width);
                console.log('[Replay] Iframe style.height:', iframe.style.height);
              }
            }, 500);

            // Calcular duração total
            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            replayTotalDurationMs = Math.max(0, lastEvent.timestamp - firstEvent.timestamp);
            replayTotalTime.value = formatReplayTime(replayTotalDurationMs / 1000);

          } catch (err) {
            console.error('[Replay] Error initializing player:', err);
            toast.error('Erro ao inicializar o player');
          }
        }
      }, 200);
    };
    script.onerror = () => {
      toast.error('Erro ao carregar biblioteca de replay');
    };
    document.head.appendChild(script);
  }
});

// =============================================
// FUNÇÕES DE ANEXOS
// =============================================
const fetchAnexos = async (dealId: string, forceRefresh = false) => {
  const cacheKey = `anexos:${dealId}`;

  if (!forceRefresh) {
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      anexos.value = cached;
      return;
    }
  }

  loadingAnexos.value = true;
  try {
    const response = await comercialApi.getAnexos(dealId);
    if (response.data.success) {
      anexos.value = response.data.anexos;
      setCache(cacheKey, response.data.anexos);
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
      // Invalidar cache de anexos
      invalidateCache(selectedDeal.value.id);
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
      // Invalidar cache
      invalidateCache(selectedDeal.value.id);
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
const fetchOrcamentosEnviados = async (dealId: string, forceRefresh = false) => {
  const cacheKey = `orcamentos:${dealId}`;

  if (!forceRefresh) {
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      orcamentosEnviados.value = cached;
      return;
    }
  }

  loadingOrcamentos.value = true;
  try {
    const response = await comercialApi.getOrcamentosEnviados(dealId);
    if (response.data.success) {
      orcamentosEnviados.value = response.data.orcamentos;
      setCache(cacheKey, response.data.orcamentos);
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
      // Invalidar cache
      invalidateCache(selectedDeal.value.id);
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
      // Invalidar cache
      invalidateCache(selectedDeal.value.id);
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

  // Detalhes (campo resumo do Pipedrive - contém informações de metragem como "90 metros de piso")
  if (deal.resumo) params.set('detalhes', deal.resumo);

  // Descritivo da área (backup se resumo estiver vazio)
  if (!deal.resumo && deal.descritivoArea) params.set('detalhes', deal.descritivoArea);

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
  // Em produção e dev usa /propostas.html
  const propostasUrl = `/propostas.html?${params.toString()}`;

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

    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/proposals/generate-html`, {
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

// Armazenamento de versão de mensagem por deal
const getWhatsAppMessageVersion = (dealId: string): number => {
  const stored = localStorage.getItem(`whatsapp_msg_version_${dealId}`);
  return stored ? parseInt(stored) : 0;
};

const setWhatsAppMessageVersion = (dealId: string, version: number) => {
  localStorage.setItem(`whatsapp_msg_version_${dealId}`, version.toString());
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

    // 4 variações da mensagem de primeiro contato
    const mensagens = [
      `Olá ${nomeCliente}, tudo bem? Sou ${nomeVendedor}, especialista da Monofloor e serei ${artigoGenero} responsável por cuidar do seu projeto. Vi que fez uma solicitação de ${metragem}m². Quer me falar um pouco mais sobre o projeto?`,
      `Oi ${nomeCliente}! Aqui é ${artigoGenero} ${nomeVendedor} da Monofloor. Vou te acompanhar no seu projeto de ${metragem}m². Me conta mais sobre o que você tem em mente?`,
      `${nomeCliente}, tudo certo? ${nomeVendedor} aqui, da equipe Monofloor. Recebi sua solicitação para ${metragem}m² e estou à disposição. Como posso te ajudar com o projeto?`,
      `Olá ${nomeCliente}! Sou ${nomeVendedor}, seu contato na Monofloor para o projeto de ${metragem}m². Conta pra mim um pouco mais sobre o que você precisa?`
    ];

    // Obter versão atual e avançar para próxima
    const dealId = String(deal.id || deal.pipedriveDealId || phone);
    const currentVersion = getWhatsAppMessageVersion(dealId);
    const nextVersion = (currentVersion + 1) % 4;
    setWhatsAppMessageVersion(dealId, nextVersion);

    // Selecionar mensagem (sempre terá valor pois currentVersion está entre 0-3)
    const mensagem = mensagens[currentVersion] as string;

    // Mostrar qual versão está sendo usada
    toast.info(`Mensagem versão ${currentVersion + 1}/4`, { duration: 2000 });

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

// Cache local para deals (5 minutos)
const DEALS_CACHE_KEY = 'comercial_deals_cache';
const DEALS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface DealsCache {
  data: any[];
  timestamp: number;
}

const getDealsFromCache = (): any[] | null => {
  try {
    const cached = sessionStorage.getItem(DEALS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: DealsCache = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < DEALS_CACHE_TTL) {
      console.log(`[Cache] HIT - ${data.length} deals (age: ${Math.round(age / 1000)}s)`);
      return data;
    }
    console.log(`[Cache] EXPIRED (age: ${Math.round(age / 1000)}s)`);
    return null;
  } catch {
    return null;
  }
};

const saveDealsToCache = (data: any[]) => {
  try {
    const cache: DealsCache = { data, timestamp: Date.now() };
    sessionStorage.setItem(DEALS_CACHE_KEY, JSON.stringify(cache));
    console.log(`[Cache] SAVED - ${data.length} deals`);
  } catch (e) {
    console.warn('[Cache] Failed to save:', e);
  }
};

// Fetch Data com cache local
const fetchDeals = async (forceRefresh = false) => {
  loading.value = true;
  const startTime = Date.now();

  try {
    // Verificar cache local primeiro (se não forçar refresh)
    if (!forceRefresh) {
      const cached = getDealsFromCache();
      if (cached) {
        deals.value = cached;
        loading.value = false;
        // Atualizar em background para próximo acesso
        setTimeout(() => fetchDealsFromAPI(true), 100);
        return;
      }
    }

    await fetchDealsFromAPI(false);
  } catch (error) {
    console.error('Error fetching deals:', error);
    toast.error('Erro ao carregar deals');
  } finally {
    // Ensure minimum loading time for animation to be visible
    const elapsed = Date.now() - startTime;
    const remaining = MIN_LOADING_TIME - elapsed;
    if (remaining > 0 && loading.value) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    loading.value = false;
  }
};

// Buscar deals da API
const fetchDealsFromAPI = async (isBackground: boolean) => {
  const apiStart = Date.now();

  const response = await fetch(`/api/admin/comercial`);
  if (!response.ok) throw new Error('Falha ao carregar deals');

  const data = await response.json();
  console.log(`[API] ${isBackground ? 'Background' : 'Direct'} fetch: ${Date.now() - apiStart}ms`);

  // Handle different API response formats
  let rawDeals: any[] = [];
  if (Array.isArray(data)) {
    rawDeals = data;
  } else if (data.deals && Array.isArray(data.deals)) {
    rawDeals = data.deals;
  } else if (data.data && Array.isArray(data.data)) {
    rawDeals = data.data;
  }

  const processedDeals = rawDeals.map((d: any) => ({
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

  // Salvar no cache
  saveDealsToCache(processedDeals);

  // Sempre atualizar UI para refletir dados atualizados (proposalViews, etc)
  deals.value = processedDeals;
};

// Calculate days in current stage
const calculateDaysInStage = (dateStr?: string): number => {
  if (!dateStr) return 0;
  const stageDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - stageDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Map Pipedrive stage names to our stage IDs (matching DEFAULT_STAGES)
const mapStatus = (status?: string): string => {
  if (!status) return 'Form Orçamento';

  const statusLower = status.toLowerCase().trim();

  // Direct mapping by Pipedrive stage name → DEFAULT_STAGES id
  // IMPORTANTE: Os valores devem corresponder EXATAMENTE aos IDs em DEFAULT_STAGES
  const mappings: Record<string, string> = {
    // Entrada
    'form orçamento': 'Form Orçamento',
    'form orcamento': 'Form Orçamento',
    // 1º Contato
    '1º contato': '1º Contato',
    '1o contato': '1º Contato',
    'primeiro contato': '1º Contato',
    '1º contato feito': '1º Contato Feito',
    '1o contato feito': '1º Contato Feito',
    'follow 1º contato': 'Follow 1º Contato',
    'follow 1o contato': 'Follow 1º Contato',
    'follow 1º contato feito': 'Follow 1º Contato Feito',
    'follow 1o contato feito': 'Follow 1º Contato Feito',
    // Arquiteto
    'form arquiteto': 'Form Arquiteto',
    'contato arquiteto': 'Contato Arquiteto',
    // Levantamento
    'proposta escopo minimo': 'Proposta Escopo Minimo',
    'proposta escopo mínimo': 'Proposta Escopo Minimo',
    'cálculo de projeto': 'Cálculo de Projeto',
    'calculo de projeto': 'Cálculo de Projeto',
    'projeto levantado': 'Projeto levantado',
    'cálculo deslocamento': 'Cálculo Deslocamento',
    'calculo deslocamento': 'Cálculo Deslocamento',
    'deslocamento levantado': 'Deslocamento Levantado',
    // Proposta
    'proposta enviada': 'Proposta enviada',
    // Follow-up
    'fazer follow 1': 'Fazer Follow 1',
    'follow 1 feito': 'Follow 1 Feito',
    'fazer follow 2': 'Fazer Follow 2',
    'follow 2 feito': 'Follow 2 Feito',
    'fazer follow 3': 'Fazer Follow 3',
    'follow 3 feito': 'Follow 3 Feito',
    // Negociação
    'negociações': 'Negociações',
    'negociacoes': 'Negociações',
    'negociação': 'Negociações',
    'negociacao': 'Negociações',
    // Fechamento
    'ganho': 'Ganho',
    'won': 'Ganho',
    'perdido': 'Perdido',
    'lost': 'Perdido',
    // Também mapear status do banco (ComercialStatus enum - sem duplicar)
    'lead': 'Form Orçamento',
    'primeiro_contato': '1º Contato',
    'contato_arquiteto': 'Contato Arquiteto',
    'levantamento': 'Cálculo de Projeto',
    'proposta_enviada': 'Proposta enviada',
    'follow_up': 'Fazer Follow 1'
    // 'negociacao' já mapeado acima
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

  // Fallback heuristics - usando nomes que correspondem a DEFAULT_STAGES
  if (statusLower.includes('ganho') || statusLower.includes('won')) return 'Ganho';
  if (statusLower.includes('perdido') || statusLower.includes('lost')) return 'Perdido';
  if (statusLower.includes('negoci')) return 'Negociações';
  if (statusLower.includes('follow') && statusLower.includes('3')) return 'Fazer Follow 3';
  if (statusLower.includes('follow') && statusLower.includes('2')) return 'Fazer Follow 2';
  if (statusLower.includes('follow') && statusLower.includes('1') && statusLower.includes('feito')) return 'Follow 1 Feito';
  if (statusLower.includes('follow') && statusLower.includes('1')) return 'Fazer Follow 1';
  if (statusLower.includes('follow')) return 'Fazer Follow 1';
  if (statusLower.includes('proposta') && statusLower.includes('enviada')) return 'Proposta enviada';
  if (statusLower.includes('proposta') && statusLower.includes('escopo')) return 'Proposta Escopo Minimo';
  if (statusLower.includes('deslocamento') && statusLower.includes('levant')) return 'Deslocamento Levantado';
  if (statusLower.includes('deslocamento')) return 'Cálculo Deslocamento';
  if (statusLower.includes('projeto') && statusLower.includes('levant')) return 'Projeto levantado';
  if (statusLower.includes('cálculo') || statusLower.includes('calculo')) return 'Cálculo de Projeto';
  if (statusLower.includes('arquiteto') && statusLower.includes('form')) return 'Form Arquiteto';
  if (statusLower.includes('arquiteto')) return 'Contato Arquiteto';
  if (statusLower.includes('contato') && statusLower.includes('feito')) return '1º Contato Feito';
  if (statusLower.includes('contato')) return '1º Contato';
  if (statusLower.includes('form') || statusLower.includes('orçamento') || statusLower.includes('orcamento')) return 'Form Orçamento';

  // Se o status já é um dos nomes válidos, retornar como está
  const validStages = [
    'Form Orçamento', '1º Contato', '1º Contato Feito', 'Follow 1º Contato', 'Follow 1º Contato Feito',
    'Form Arquiteto', 'Contato Arquiteto', 'Proposta Escopo Minimo', 'Cálculo de Projeto',
    'Projeto levantado', 'Cálculo Deslocamento', 'Deslocamento Levantado', 'Proposta enviada',
    'Fazer Follow 1', 'Follow 1 Feito', 'Fazer Follow 2', 'Follow 2 Feito',
    'Fazer Follow 3', 'Follow 3 Feito', 'Negociações', 'Ganho', 'Perdido'
  ];
  if (validStages.includes(status)) return status;

  return 'Form Orçamento';
};

// ===== HANDLERS DE PROPOSTA EM TEMPO REAL =====
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const handleProposalOpened = (data: ProposalOpenedEvent) => {
  console.log('[CRM] Proposta aberta:', data.clientName);

  // Adicionar à lista de visualizações ativas
  activeProposalViews.value.set(data.sessionId, {
    sessionId: data.sessionId,
    propostaId: data.propostaId,
    leadId: data.leadId,
    clientName: data.clientName,
    ownerUserName: data.ownerUserName,
    deviceType: data.deviceType,
    timeOnPage: 0,
    scrollDepth: 0,
    startedAt: new Date(data.timestamp),
    timestamp: new Date(data.timestamp),
  });

  // Atualizar contador de views no deal card em tempo real
  const deal = deals.value.find(d => d.id === data.leadId);
  if (deal) {
    deal.proposalViews = (deal.proposalViews || 0) + 1;
    console.log(`[CRM] Views incrementado para ${data.clientName}: ${deal.proposalViews}`);
  }

  // Adicionar notificação
  proposalNotifications.value.unshift({
    id: `opened-${data.sessionId}`,
    type: 'opened',
    clientName: data.clientName,
    ownerUserName: data.ownerUserName,
    leadId: data.leadId,
    deviceType: data.deviceType,
    timestamp: new Date(data.timestamp),
  });

  // Limitar a 20 notificações
  if (proposalNotifications.value.length > 20) {
    proposalNotifications.value = proposalNotifications.value.slice(0, 20);
  }
};

const handleProposalViewing = (data: ProposalViewingEvent) => {
  // Atualizar a visualização ativa
  const existing = activeProposalViews.value.get(data.sessionId);
  if (existing) {
    existing.timeOnPage = data.timeOnPage;
    existing.scrollDepth = data.scrollDepth;
    existing.timestamp = new Date(data.timestamp);
  }
};

const handleProposalClosed = (data: ProposalClosedEvent) => {
  console.log('[CRM] Proposta fechada:', data.clientName, `(${data.totalTimeOnPage}s)`);

  // Remover da lista de visualizações ativas
  activeProposalViews.value.delete(data.sessionId);

  // Adicionar notificação de fechamento
  proposalNotifications.value.unshift({
    id: `closed-${data.sessionId}`,
    type: 'closed',
    clientName: data.clientName,
    ownerUserName: data.ownerUserName,
    leadId: data.leadId,
    timeOnPage: data.totalTimeOnPage,
    timestamp: new Date(data.timestamp),
  });

  // Limitar a 20 notificações
  if (proposalNotifications.value.length > 20) {
    proposalNotifications.value = proposalNotifications.value.slice(0, 20);
  }
};

const handleProposalGPSUpdated = (data: ProposalGPSUpdatedEvent) => {
  console.log('[CRM] GPS atualizado:', data.clientName, data.city, data.state);

  // Se o lead está aberto, recarregar todos os detalhes (forçar refresh do cache)
  if (selectedDeal.value && selectedDeal.value.id === data.leadId) {
    console.log('[CRM] Lead aberto - recarregando detalhes (force refresh)...');
    fetchAllLeadDetails(data.leadId, true); // forceRefresh = true
  }

  // Adicionar notificação de localização
  proposalNotifications.value.unshift({
    id: `gps-${data.sessionId}`,
    type: 'gps',
    clientName: data.clientName,
    ownerUserName: '',
    leadId: data.leadId,
    location: data.city && data.state ? `${data.city}, ${data.state}` : (data.city || 'Local detectado'),
    timestamp: new Date(data.timestamp),
  });

  // Limitar a 20 notificações
  if (proposalNotifications.value.length > 20) {
    proposalNotifications.value = proposalNotifications.value.slice(0, 20);
  }
};

const dismissNotification = (notificationId: string) => {
  proposalNotifications.value = proposalNotifications.value.filter(n => n.id !== notificationId);
};

const openLeadFromNotification = (leadId: string) => {
  const deal = deals.value.find(d => d.id === leadId);
  if (deal) {
    openDealDetail(deal);
  }
};

const setupProposalSocketListeners = () => {
  // Conectar ao socket
  connectSocket();

  // Registrar listeners
  unsubscribeProposalOpened.value = onProposalOpened(handleProposalOpened);
  unsubscribeProposalViewing.value = onProposalViewing(handleProposalViewing);
  unsubscribeProposalClosed.value = onProposalClosed(handleProposalClosed);
  unsubscribeProposalGPSUpdated.value = onProposalGPSUpdated(handleProposalGPSUpdated);

  console.log('[CRM] Listeners de proposta configurados');
};

const cleanupProposalSocketListeners = () => {
  if (unsubscribeProposalOpened.value) {
    unsubscribeProposalOpened.value();
    unsubscribeProposalOpened.value = null;
  }
  if (unsubscribeProposalViewing.value) {
    unsubscribeProposalViewing.value();
    unsubscribeProposalViewing.value = null;
  }
  if (unsubscribeProposalClosed.value) {
    unsubscribeProposalClosed.value();
    unsubscribeProposalClosed.value = null;
  }
  if (unsubscribeProposalGPSUpdated.value) {
    unsubscribeProposalGPSUpdated.value();
    unsubscribeProposalGPSUpdated.value = null;
  }
  console.log('[CRM] Listeners de proposta limpos');
};

// ===== POLLING DE VISUALIZAÇÕES (usa /all-views para ativos + histórico) =====
let activeViewersPollingInterval: ReturnType<typeof setInterval> | null = null;

const fetchAllViews = async () => {
  try {
    const response = await comercialApi.getAllViews();
    if (response.data?.success) {
      const { activeViewers, historyViews: historyData, totalActive, totalHistory } = response.data;

      // ===== ATUALIZAR VIEWERS ATIVOS =====
      const currentSessionIds = new Set(activeProposalViews.value.keys());
      const newSessionIds = new Set(activeViewers.map((v: any) => v.sessionId).filter(Boolean));

      // Adicionar/atualizar viewers ativos
      activeViewers.forEach((viewer: any) => {
        if (viewer.sessionId) {
          const existing = activeProposalViews.value.get(viewer.sessionId);
          if (!existing) {
            // Nova visualização - adicionar notificação toast de "abriu"
            proposalNotifications.value.unshift({
              id: `opened-${viewer.sessionId}`,
              type: 'opened',
              clientName: viewer.clientName,
              ownerUserName: viewer.ownerUserName,
              leadId: viewer.leadId,
              deviceType: viewer.deviceType,
              timestamp: new Date(viewer.viewedAt),
            });
            if (proposalNotifications.value.length > 20) {
              proposalNotifications.value = proposalNotifications.value.slice(0, 20);
            }

            // Disparar toast notification para o novo viewer
            addViewerToast({
              clientName: viewer.clientName,
              ownerUserName: viewer.ownerUserName,
              leadId: viewer.leadId,
              deviceType: viewer.deviceType,
              sessionId: viewer.sessionId,
            });
          }
          // Atualizar/adicionar no Map
          activeProposalViews.value.set(viewer.sessionId, {
            sessionId: viewer.sessionId,
            propostaId: viewer.propostaId,
            leadId: viewer.leadId,
            clientName: viewer.clientName,
            ownerUserName: viewer.ownerUserName,
            deviceType: viewer.deviceType,
            timeOnPage: viewer.timeOnPage,
            scrollDepth: viewer.scrollDepth,
            startedAt: new Date(viewer.viewedAt),
            timestamp: new Date(viewer.viewedAt),
          });
        }
      });

      // Remover viewers que não estão mais ativos
      currentSessionIds.forEach(sessionId => {
        if (!newSessionIds.has(sessionId)) {
          activeProposalViews.value.delete(sessionId);
        }
      });

      // ===== ATUALIZAR HISTÓRICO DO BANCO =====
      historyViews.value = historyData.map((view: any) => ({
        id: view.id,
        sessionId: view.sessionId,
        propostaId: view.propostaId,
        leadId: view.leadId,
        clientName: view.clientName,
        ownerUserName: view.ownerUserName,
        deviceType: view.deviceType,
        timeOnPage: view.timeOnPage,
        scrollDepth: view.scrollDepth,
        viewedAt: new Date(view.viewedAt),
      }));

      // Log para debug
      console.log(`[CRM] Polling: ${totalActive} ativo(s), ${totalHistory} no histórico`);
    }
  } catch (error) {
    console.error('[CRM] Erro no polling:', error);
  }
};

const startActiveViewersPolling = () => {
  // Buscar imediatamente
  fetchAllViews();
  // Configurar polling a cada 10 segundos
  activeViewersPollingInterval = setInterval(fetchAllViews, 10000);
  console.log('[CRM] Polling de visualizações iniciado (10s)');
};

const stopActiveViewersPolling = () => {
  if (activeViewersPollingInterval) {
    clearInterval(activeViewersPollingInterval);
    activeViewersPollingInterval = null;
    console.log('[CRM] Polling de visualizações ativas parado');
  }
};

onMounted(() => {
  loadSavedStages();
  preSelectSpecialistFromEmail(); // Pré-selecionar vendedor baseado no email do login
  fetchDeals();
  setupProposalSocketListeners(); // Configurar listeners de proposta (mantém para fallback)
  startActiveViewersPolling(); // Inicia polling como método principal
  document.addEventListener('click', handleClickOutsideNotification);
});

onUnmounted(() => {
  cleanupProposalSocketListeners(); // Limpar listeners ao sair
  stopActiveViewersPolling(); // Parar polling
  document.removeEventListener('click', handleClickOutsideNotification);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Press+Start+2P&family=VT323&display=swap');

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
  overflow: visible;
}

.crm-header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  overflow: visible;
}

.crm-header__title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: visible;
}

/* Pixel Train */
.pixel-train {
  width: 80px;
  height: 50px;
  overflow: visible;
  animation: trainBounce 0.5s ease-in-out infinite alternate;
}

.pixel-train svg {
  overflow: visible;
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

/* Specialist Selector - Neobrutalista */
.specialist-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 40px 10px 14px;
  background: #FFFFFF;
  border: 3px solid #1a1a1a;
  border-radius: 10px;
  box-shadow: 4px 4px 0 #1a1a1a;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-right: auto;
  min-width: 180px;
}

.specialist-selector:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #1a1a1a;
}

.specialist-selector:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #1a1a1a;
}

.specialist-label {
  font-family: 'Syne', sans-serif;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #1a1a1a;
  text-transform: uppercase;
  opacity: 0.6;
}

.specialist-name {
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-transform: uppercase;
}

.specialist-name.pixel-text {
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-size: 0.75rem;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  text-transform: none;
}

.specialist-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #1a1a1a;
  transition: transform 0.2s ease;
}

.specialist-selector:hover .specialist-chevron {
  transform: translateY(-50%) translateY(2px);
}

/* Specialist Modal - Neobrutalista */
.specialist-modal {
  background: #FAFAFA;
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  box-shadow: 6px 6px 0 #1a1a1a, 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 340px;
  max-height: 80vh;
  overflow: hidden;
  animation: modalBounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalBounce {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.specialist-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 3px solid #1a1a1a;
  background: #c9a962;
}

.specialist-modal__header h3 {
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  color: #1a1a1a;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.specialist-modal__close {
  width: 28px;
  height: 28px;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  box-shadow: 2px 2px 0 #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.specialist-modal__close:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #1a1a1a;
}

.specialist-modal__close:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #1a1a1a;
}

.specialist-modal__list {
  padding: 12px;
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #FAFAFA;
}

.specialist-modal__list::-webkit-scrollbar {
  width: 8px;
}

.specialist-modal__list::-webkit-scrollbar-track {
  background: #e5e5e5;
  border-radius: 4px;
}

.specialist-modal__list::-webkit-scrollbar-thumb {
  background: #1a1a1a;
  border-radius: 4px;
}

.specialist-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #1a1a1a;
  cursor: pointer;
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  width: 100%;
}

.specialist-option:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #1a1a1a;
  border-color: #c9a962;
}

.specialist-option:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #1a1a1a;
}

.specialist-option--active {
  background: #c9a962;
  border-color: #1a1a1a;
  box-shadow: 3px 3px 0 #1a1a1a;
}

.specialist-option--active:hover {
  box-shadow: 5px 5px 0 #1a1a1a;
}

.specialist-option__avatar {
  width: 38px;
  height: 38px;
  background: #3b82f6;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  color: #FFFFFF;
  flex-shrink: 0;
  text-transform: uppercase;
}

.specialist-option--active .specialist-option__avatar {
  background: #1a1a1a;
  color: #c9a962;
}

.specialist-option__name {
  flex: 1;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a1a1a;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.specialist-option--active .specialist-option__name {
  color: #1a1a1a;
}

.specialist-option__count {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1a1a1a;
  background: #e5e5e5;
  padding: 4px 10px;
  border-radius: 20px;
  border: 2px solid #1a1a1a;
}

.specialist-option--active .specialist-option__count {
  background: #FFFFFF;
  color: #1a1a1a;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 2px solid #1a1a1a;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.kpi-card__icon svg {
  width: 22px;
  height: 22px;
  color: #1a1a1a;
}

.kpi-card--deals .kpi-card__icon { background: #93c5fd; }
.kpi-card--pipeline .kpi-card__icon { background: #86efac; }
.kpi-card--won .kpi-card__icon { background: var(--yellow); }
.kpi-card--conversion .kpi-card__icon { background: #c4b5fd; }
.kpi-card--avg .kpi-card__icon { background: #fdba74; }
.kpi-card--ticket .kpi-card__icon { background: #f9a8d4; }

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
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 3px 3px 0 #1a1a1a;
  background: #FFFFFF;
  color: #1a1a1a;
  white-space: nowrap;
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #1a1a1a;
}

.btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #1a1a1a;
}

.btn--primary {
  background: #c9a962;
  color: #1a1a1a;
}

.btn--primary:hover:not(:disabled) {
  background: #d4b872;
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--outline {
  background: #FFFFFF;
  color: #1a1a1a;
}

.btn--outline:hover {
  background: #F5F5F5;
}

.btn__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
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

/* =============================================
   SEARCH BAR WITH AUTOCOMPLETE
   ============================================= */

.search-bar-container {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #1a1a1a;
  transition: all 0.15s ease;
}

.search-bar--focused {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #1a1a1a;
}

.search-bar__saturn {
  width: 32px;
  height: auto;
  flex-shrink: 0;
  animation: saturnFloat 3s ease-in-out infinite;
}

@keyframes saturnFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.search-bar__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-family: var(--font-body);
  color: var(--black);
  outline: none;
}

.search-bar__input::placeholder {
  color: var(--gray-400);
}

.search-bar__clear {
  background: var(--gray-200);
  border: 2px solid var(--black);
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.search-bar__clear:hover {
  background: var(--coral);
  color: var(--white);
}

/* Search Suggestions Dropdown */
.search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  box-shadow: 4px 4px 0 #1a1a1a;
  max-height: 380px;
  overflow-y: auto;
  z-index: 1000;
  animation: dropdownSlide 0.15s ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-suggestions__empty {
  padding: 20px;
  text-align: center;
  color: var(--gray-400);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.search-suggestion {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--gray-200);
  transition: all 0.1s ease;
  background: #FFFFFF;
}

.search-suggestion:last-child {
  border-bottom: none;
}

.search-suggestion:hover,
.search-suggestion--active {
  background: var(--yellow);
}

.search-suggestion__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.search-suggestion__name {
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--black);
  font-size: 0.9rem;
}

.search-suggestion__stage {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
  border: 2px solid var(--black);
  background: var(--gray-100);
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 1px 1px 0 var(--black);
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-suggestion__stage-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
}

.search-suggestion__stage-icon svg {
  width: 12px;
  height: 12px;
}

.search-suggestion__detail-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.search-suggestion__stage--success { background: #dcfce7; }
.search-suggestion__stage--danger { background: #fee2e2; }
.search-suggestion__stage--indigo { background: #e0e7ff; }
.search-suggestion__stage--blue { background: #dbeafe; }
.search-suggestion__stage--sky { background: #e0f2fe; }
.search-suggestion__stage--cyan { background: #cffafe; }
.search-suggestion__stage--teal { background: #ccfbf1; }
.search-suggestion__stage--emerald { background: #d1fae5; }
.search-suggestion__stage--green { background: #dcfce7; }
.search-suggestion__stage--lime { background: #ecfccb; }
.search-suggestion__stage--yellow { background: #fef9c3; }
.search-suggestion__stage--amber { background: #fef3c7; }
.search-suggestion__stage--orange { background: #ffedd5; }
.search-suggestion__stage--orange-light { background: #fed7aa; }
.search-suggestion__stage--peach { background: #fed7aa; }
.search-suggestion__stage--sand { background: #fef08a; }
.search-suggestion__stage--gold { background: #fef3c7; }

.search-suggestion__details {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: var(--gray-600);
  flex-wrap: wrap;
}

.search-suggestion__phone,
.search-suggestion__email {
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-suggestion__location {
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-top: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .search-bar-container {
    max-width: 100%;
  }

  .search-suggestion__main {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .search-suggestion__details {
    flex-direction: column;
    gap: 4px;
  }
}

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
   NOTIFICATION BELL SYSTEM
   ============================================ */

.notification-bell-container {
  position: relative;
  margin-left: auto;
}

.notification-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 var(--black);
}

.notification-bell:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--black);
}

.notification-bell:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--black);
}

.notification-bell--active {
  background: #FEF3C7;
  animation: bellPulse 2s ease-in-out infinite;
}

.notification-bell--has-notifications {
  background: #FEE2E2;
}

.notification-bell--active.notification-bell--has-notifications {
  background: linear-gradient(135deg, #FEF3C7 0%, #FEE2E2 100%);
}

@keyframes bellPulse {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1px, -1px) rotate(-3deg); }
  20% { transform: translate(1px, 1px) rotate(3deg); }
  30% { transform: translate(-1px, 0) rotate(-2deg); }
  40% { transform: translate(1px, 0) rotate(2deg); }
  50% { transform: translate(0, 0); }
}

.notification-bell__icon {
  width: 24px;
  height: 24px;
  color: var(--black);
}

.notification-bell__eye {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 10px;
  height: 10px;
  background: #c9a962;
  border-radius: 50%;
  border: 2px solid var(--black);
  animation: eyeBlink 3s ease-in-out infinite;
}

.notification-bell__eye-pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--black);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pupilMove 4s ease-in-out infinite;
}

@keyframes eyeBlink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

@keyframes pupilMove {
  0%, 100% { transform: translate(-50%, -50%); }
  25% { transform: translate(-30%, -50%); }
  50% { transform: translate(-50%, -30%); }
  75% { transform: translate(-70%, -50%); }
}

.notification-bell__badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: #ef4444;
  color: white;
  font-family: var(--font-primary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 2px solid var(--black);
  box-shadow: 2px 2px 0 var(--black);
}

/* Notification Panel */
.notification-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 380px;
  max-height: 500px;
  overflow-y: auto;
  background: #FFFFFF;
  border: 2px solid var(--black);
  border-radius: 16px;
  box-shadow: 6px 6px 0 var(--black);
  z-index: 1000;
}

.notification-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 2px solid var(--black);
  background: #c9a962;
}

.notification-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-primary);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--black);
}

.notification-panel__title-icon {
  width: 20px;
  height: 20px;
}

.notification-panel__close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.notification-panel__close:hover {
  background: #ef4444;
  color: white;
  transform: rotate(90deg);
}

.notification-panel__close svg {
  width: 14px;
  height: 14px;
}

/* Section Styles */
.notification-panel__section {
  padding: 16px;
}

.notification-panel__section--live {
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border-bottom: 2px solid var(--black);
}

.notification-panel__section--history {
  background: #F5F5F5;
}

.notification-panel__section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  color: var(--black);
}

.notification-panel__section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notification-panel__section-dot--live {
  background: #22c55e;
  animation: dotPulse 1.5s ease-in-out infinite;
}

.notification-panel__section-dot--history {
  background: var(--gray-400);
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.notification-panel__section-count {
  background: var(--black);
  color: var(--white);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: auto;
}

.notification-panel__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-panel__list--compact {
  gap: 6px;
}

/* Notification Items */
.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  animation: itemSlideIn 0.2s ease forwards;
  animation-delay: var(--item-delay, 0s);
  opacity: 0;
}

@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--black);
}

.notification-item--live {
  box-shadow: 3px 3px 0 #22c55e;
  border-color: #22c55e;
}

.notification-item--live:hover {
  box-shadow: 5px 5px 0 #22c55e;
}

.notification-item--history {
  box-shadow: 2px 2px 0 var(--gray-400);
  padding: 10px;
}

.notification-item--opened {
  border-left: 4px solid #22c55e;
}

.notification-item--closed {
  border-left: 4px solid #ef4444;
}

.notification-item--gps {
  border-left: 4px solid #3b82f6;
}

.notification-item__avatar {
  position: relative;
  width: 40px;
  height: 40px;
  background: #c9a962;
  border: 2px solid var(--black);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-item__avatar-letter {
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: 700;
  color: var(--black);
}

.notification-item__avatar-pulse {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 2px solid var(--black);
  border-radius: 50%;
  animation: pulseLive 1.5s ease-in-out infinite;
}

@keyframes pulseLive {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
}

.notification-item__content {
  flex: 1;
  min-width: 0;
}

.notification-item__name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--gray-600);
  margin-top: 2px;
}

.notification-item__device {
  font-size: 14px;
}

.notification-item__owner-small {
  font-size: 11px;
  color: var(--gray-400);
  margin-left: auto;
}

.notification-item__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.notification-item__timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-primary);
  font-size: 14px;
  font-weight: 700;
  color: #22c55e;
}

.notification-item__timer-icon {
  width: 14px;
  height: 14px;
}

.notification-item__scroll-bar {
  width: 50px;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--black);
}

.notification-item__scroll-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a962 0%, #22c55e 100%);
  transition: width 0.3s ease;
}

.notification-item__type-badge {
  font-size: 16px;
  flex-shrink: 0;
}

.notification-item__time-ago {
  font-size: 11px;
  color: var(--gray-400);
  white-space: nowrap;
}

/* Empty State */
.notification-panel__empty {
  padding: 40px 20px;
  text-align: center;
}

.notification-panel__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.notification-panel__empty-text {
  font-family: var(--font-primary);
  font-size: 14px;
  font-weight: 600;
  color: var(--black);
  margin-bottom: 4px;
}

.notification-panel__empty-subtext {
  font-size: 13px;
  color: var(--gray-600);
}

.notification-panel__see-more {
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  background: transparent;
  border: 2px dashed var(--gray-400);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s ease;
}

.notification-panel__see-more:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #FEE2E2;
}

/* Panel Slide Transition */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.2s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Toast Notifications - Bottom Right */
.toast-notifications {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
  pointer-events: none;
}

.toast-notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 12px;
  box-shadow: 6px 6px 0 #1a1a1a;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 300px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
}

.toast-notification:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 var(--black);
}

.toast-notification--live {
  border-color: #22c55e;
  box-shadow: 6px 6px 0 #22c55e;
}

.toast-notification--live:hover {
  box-shadow: 9px 9px 0 #22c55e;
}

.toast-notification__pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.15), transparent);
  animation: toastPulse 2s ease-in-out infinite;
}

@keyframes toastPulse {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.toast-notification__icon {
  width: 40px;
  height: 40px;
  background: #c9a962;
  border: 2px solid var(--black);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.toast-notification__content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.toast-notification__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-notification__subtitle {
  font-size: 12px;
  color: #22c55e;
  font-weight: 600;
}

.toast-notification__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border: 2px solid var(--black);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  z-index: 1;
  font-size: 14px;
  color: var(--gray-600);
}

.toast-notification__close:hover {
  background: #ef4444;
  color: white;
}

.toast-notification__close svg {
  width: 12px;
  height: 12px;
}

/* Toast Slide Animation */
.toast-slide-enter-active {
  animation: toastSlideIn 0.3s ease;
}

.toast-slide-leave-active {
  animation: toastSlideOut 0.3s ease;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(50px);
  }
}

/* Section Close Button (for AO VIVO) */
.notification-panel__section-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.notification-panel__section-close:hover {
  background: #ef4444;
  color: white;
}

.notification-panel__section-close svg {
  width: 12px;
  height: 12px;
}

/* Section Toggle Button (for HISTÓRICO) */
.notification-panel__section-header--toggle {
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  padding: 8px;
  margin: -8px;
  border-radius: 8px;
}

.notification-panel__section-header--toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notification-panel__section-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: auto;
  flex-shrink: 0;
}

.notification-panel__section-toggle svg {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
}

.notification-panel__section-toggle--minimized svg {
  transform: rotate(-90deg);
}

.notification-panel__section-toggle:hover {
  background: var(--gray-200);
}

/* History Collapse Transition */
.history-collapse-enter-active,
.history-collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.history-collapse-enter-from,
.history-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.history-collapse-enter-to,
.history-collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ============================================
   PIPELINE
   ============================================ */

/* Pipeline Settings Column */
.pipeline-settings-column {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  max-width: 50px;
  padding: 16px 8px;
  background: var(--gray-100);
  border: 2px dashed var(--gray-400);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--gray-400);
  flex-shrink: 0;
}

.pipeline-settings-column:hover {
  background: var(--yellow);
  border-color: #1a1a1a;
  border-style: solid;
  color: #1a1a1a;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.pipeline-settings-column svg {
  width: 24px;
  height: 24px;
}

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

.pipeline-column__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.pipeline-column__icon svg {
  width: 16px;
  height: 16px;
  color: #1a1a1a;
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
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
}

.pipeline-column__empty-icon svg {
  width: 24px;
  height: 24px;
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

/* Animação para novo deal criado */
.deal-card--new {
  animation: newDealPulse 2s ease-in-out;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3), 3px 3px 0 #1a1a1a;
}

@keyframes newDealPulse {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1.02);
  }
  40% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(201, 169, 98, 0.4), 3px 3px 0 #1a1a1a;
  }
  60% {
    box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3), 3px 3px 0 #1a1a1a;
  }
  80% {
    box-shadow: 0 0 0 6px rgba(201, 169, 98, 0.2), 3px 3px 0 #1a1a1a;
  }
  100% {
    box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3), 3px 3px 0 #1a1a1a;
  }
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

.deal-card__specialist {
  display: flex;
  align-items: center;
  gap: 6px;
}

.deal-card__specialist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.deal-card__specialist-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--gray-600);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Views Counter - Clean */
.deal-card__views {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.deal-card__views-icon {
  width: 18px;
  height: 12px;
  flex-shrink: 0;
}

.deal-card__views-count {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.deal-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-6px);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.deal-action {
  width: 32px;
  height: 32px;
  border: 2.5px solid #1a1a1a;
  border-radius: 8px;
  background: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 2px 2px 0 #1a1a1a;
  position: relative;
  overflow: hidden;
}

.deal-action::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%);
  pointer-events: none;
}

.deal-action svg {
  width: 16px;
  height: 16px;
  color: #1a1a1a;
  transition: all 0.15s ease;
  position: relative;
  z-index: 1;
}

.deal-action:hover {
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 #1a1a1a;
}

.deal-action:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #1a1a1a;
}

/* WhatsApp Button - Verde vibrante */
.deal-action--whatsapp {
  background: #DCFCE7;
  border-color: #166534;
  box-shadow: 2px 2px 0 #166534;
}

.deal-action--whatsapp svg {
  color: #166534;
}

.deal-action--whatsapp:hover {
  background: #22C55E;
  box-shadow: 5px 5px 0 #166534;
}

.deal-action--whatsapp:hover svg {
  color: #FFFFFF;
  transform: scale(1.15);
}

.deal-action--whatsapp:active {
  box-shadow: 1px 1px 0 #166534;
}

/* Pipedrive Link Button - Azul vibrante */
.deal-action--link {
  background: #DBEAFE;
  border-color: #1E40AF;
  box-shadow: 2px 2px 0 #1E40AF;
}

.deal-action--link svg {
  color: #1E40AF;
}

.deal-action--link:hover {
  background: #3B82F6;
  box-shadow: 5px 5px 0 #1E40AF;
}

.deal-action--link:hover svg {
  color: #FFFFFF;
  transform: scale(1.15) rotate(-12deg);
}

.deal-action--link:active {
  box-shadow: 1px 1px 0 #1E40AF;
}

/* Menu Button - Dourado Monofloor */
.deal-action--menu {
  background: #FEF9C3;
  border-color: #92400E;
  box-shadow: 2px 2px 0 #92400E;
}

.deal-action--menu svg {
  color: #92400E;
}

.deal-action--menu:hover {
  background: #c9a962;
  box-shadow: 5px 5px 0 #92400E;
}

.deal-action--menu:hover svg {
  color: #FFFFFF;
  transform: scale(1.1);
}

.deal-action--menu:active {
  box-shadow: 1px 1px 0 #92400E;
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
  background: #FFFFFF;
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  box-shadow: 8px 8px 0 #1a1a1a;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalAppear 0.2s ease;
  color: #1a1a1a;
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
  padding: 16px 20px;
  border-bottom: 3px solid #1a1a1a;
  background: var(--yellow);
}

.modal__header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.modal__badges {
  display: flex;
  gap: 6px;
}

.modal__title-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
}

.modal__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.modal__close {
  width: 32px;
  height: 32px;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.modal__close:hover {
  background: #ef4444;
  color: white;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #1a1a1a;
}

.modal__close:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #1a1a1a;
}

.modal__close svg {
  width: 16px;
  height: 16px;
}

.modal__body {
  padding: 20px;
  overflow-y: auto;
  color: #1a1a1a;
  background: #FFFFFF;
}

.modal__body--scroll {
  max-height: calc(90vh - 280px);
  overflow-y: auto;
}

/* Pipeline Progress Bar - Neobrutalist */
.pipeline-progress {
  padding: 24px 20px 16px;
  background: #f5f5f5;
  border-bottom: 3px solid #1a1a1a;
}

.pipeline-progress__track {
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 32px 4px 8px;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: #1a1a1a #e5e5e5;
}

.pipeline-progress__track::-webkit-scrollbar {
  height: 6px;
}

.pipeline-progress__track::-webkit-scrollbar-track {
  background: #e5e5e5;
  border-radius: 3px;
}

.pipeline-progress__track::-webkit-scrollbar-thumb {
  background: #1a1a1a;
  border-radius: 3px;
}

.pipeline-progress__connector {
  width: 20px;
  height: 4px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  border-radius: 0;
}

.pipeline-progress__connector--completed {
  background: #22c55e;
}

.pipeline-progress__connector--pending {
  background: #d4d4d4;
}

.pipeline-progress__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0 2px;
}

.pipeline-progress__stage:hover {
  transform: translateY(-2px);
}

.pipeline-progress__stage:hover .pipeline-progress__days {
  box-shadow: 3px 3px 0 #1a1a1a;
}

.pipeline-progress__days {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-display);
  border: 2px solid #1a1a1a;
  transition: all 0.15s ease;
  background: #FFFFFF;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.pipeline-progress__stage--completed .pipeline-progress__days {
  background: #22c55e;
  color: #FFFFFF;
}

.pipeline-progress__stage--current .pipeline-progress__days {
  background: var(--yellow);
  color: #1a1a1a;
  box-shadow: 3px 3px 0 #1a1a1a;
}

.pipeline-progress__stage--pending .pipeline-progress__days {
  background: #FFFFFF;
  color: #a3a3a3;
  border-color: #d4d4d4;
  box-shadow: 2px 2px 0 #d4d4d4;
}

.pipeline-progress__stage-name {
  font-size: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 6px;
  color: #737373;
  white-space: nowrap;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.pipeline-progress__stage--current .pipeline-progress__stage-name {
  color: #1a1a1a;
  font-weight: 700;
}

.pipeline-progress__stage--completed .pipeline-progress__stage-name {
  color: #22c55e;
}

.pipeline-progress__train {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 28px;
  z-index: 10;
  animation: pipelineTrainBounce 0.6s ease-in-out infinite alternate;
}

.pipeline-progress__train svg {
  width: 100%;
  height: 100%;
}

@keyframes pipelineTrainBounce {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-4px); }
}

.pipeline-progress__final {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: center;
}

.pipeline-progress__final-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 2px solid #1a1a1a;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #FFFFFF;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.pipeline-progress__final-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #1a1a1a;
}

.pipeline-progress__final-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #1a1a1a;
}

.pipeline-progress__final-btn svg {
  width: 14px;
  height: 14px;
}

.pipeline-progress__final-btn--ganho {
  color: #22c55e;
}

.pipeline-progress__final-btn--ganho:hover,
.pipeline-progress__final-btn--ganho.pipeline-progress__final-btn--active {
  background: #22c55e;
  color: #FFFFFF;
}

.pipeline-progress__final-btn--perdido {
  color: #ef4444;
}

.pipeline-progress__final-btn--perdido:hover,
.pipeline-progress__final-btn--perdido.pipeline-progress__final-btn--active {
  background: #ef4444;
  color: #FFFFFF;
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
  padding: 20px 24px;
  border-top: 3px solid #1a1a1a;
  background: #F5F5F5;
}

.modal__footer--proposals {
  justify-content: space-between;
}

.modal__footer-left,
.modal__footer-right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* ========== NEOBRUTAL BUTTONS ========== */

.btn--gold {
  background: #c9a962;
  color: #1a1a1a;
}

.btn--gold:hover:not(:disabled) {
  background: #d4b872;
}

.btn--gold:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--info {
  background: #3B82F6;
  color: #FFFFFF;
  border-color: #1E40AF;
  box-shadow: 3px 3px 0 #1E40AF;
}

.btn--info:hover:not(:disabled) {
  background: #60A5FA;
  box-shadow: 5px 5px 0 #1E40AF;
}

.btn--info:disabled {
  opacity: 0.5;
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

.html-link-box__header span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.html-link-box__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn__icon--small {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
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
  background: #22C55E;
  color: #FFFFFF;
  border-color: #166534;
  box-shadow: 3px 3px 0 #166534;
}

.btn--success:hover:not(:disabled) {
  background: #4ADE80;
  box-shadow: 5px 5px 0 #166534;
}

.btn--success:disabled {
  opacity: 0.5;
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

/* Form elements inside modal (white background) */
.modal__body .form-label {
  color: #374151;
}

.modal__body .form-input,
.modal__body .form-select {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  color: #1a1a1a;
}

.modal__body .form-input::placeholder {
  color: #9ca3af;
}

.modal__body .form-input:focus,
.modal__body .form-select:focus {
  border-color: #c9a962;
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.15);
}

.modal__body .form-select option {
  background: white;
  color: #1a1a1a;
}

/* ============================================
   DETAIL GRID
   ============================================ */

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  padding: 12px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 2px solid #1a1a1a;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.detail-item--full {
  grid-column: span 2;
}

.detail-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #737373;
  margin-bottom: 4px;
}

.detail-value {
  font-weight: 600;
  color: #1a1a1a;
}

.detail-value--large {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: #22c55e;
}

.detail-value--link {
  cursor: pointer;
  color: #3b82f6;
  transition: color 0.15s ease;
}

.detail-value--link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.detail-value--stage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--yellow);
  border-radius: 6px;
  border: 2px solid #1a1a1a;
  font-size: 0.85rem;
  font-weight: 700;
}

.detail-value--metric {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.detail-value--mono {
  font-family: monospace;
  font-size: 0.8rem;
  color: #525252;
}

.detail-value--text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #404040;
}

/* Inline Editing */
.detail-value--editable {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  border: 2px solid transparent;
  position: relative;
}

.detail-value--editable:hover {
  background: #fef9c3;
  border-color: #1a1a1a;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  outline: none;
  box-shadow: 2px 2px 0 #1a1a1a;
  transition: all 0.15s ease;
}

.inline-edit-input:focus,
.inline-edit-select:focus,
.inline-edit-textarea:focus {
  border-color: var(--yellow);
  box-shadow: 3px 3px 0 #1a1a1a;
  background: #fef9c3;
}

.inline-edit-input--large {
  font-size: 1.2rem;
  font-weight: 800;
  color: #22c55e;
}

.inline-edit-input--full {
  width: 100%;
}

.inline-edit-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.inline-edit-select option {
  background: #FFFFFF;
  color: #1a1a1a;
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
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section__title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-section__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.detail-section--meta {
  opacity: 0.7;
}

.detail-section--meta .detail-section__title {
  color: #737373;
  border-bottom-color: #d4d4d4;
}

.detail-grid--highlight {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  border: 2px solid #1a1a1a;
}

.detail-grid--small .detail-item {
  padding: 8px 12px;
}

.detail-item--highlight {
  background: #dcfce7;
  border-color: #22c55e;
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
  background: #dbeafe;
  color: #1d4ed8;
  border: 2px solid #1a1a1a;
  box-shadow: 1px 1px 0 #1a1a1a;
}

.badge--projeto {
  background: #f3e8ff;
  color: #7c3aed;
  border: 2px solid #1a1a1a;
  box-shadow: 1px 1px 0 #1a1a1a;
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
  background: #25D366;
  color: #FFFFFF;
  border-color: #128C7E;
  box-shadow: 3px 3px 0 #128C7E;
}

.btn--secondary:hover {
  background: #4AE97E;
  box-shadow: 5px 5px 0 #128C7E;
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

.deal-card__tag-icon {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: #888;
  padding: 20px;
  font-size: 13px;
  background: #f9f9f9;
  border-radius: 8px;
}

.detail-loading__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #c9a962;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
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

/* ===== PROPOSAL NOTIFICATIONS ===== */
.proposal-notifications {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
  font-family: var(--font-body);
}

.proposal-notifications__live,
.proposal-notifications__history {
  background: #fff;
  border: 2px solid #1a1a1a;
  border-radius: 12px;
  box-shadow: 4px 4px 0 #1a1a1a;
  overflow: hidden;
}

.proposal-notifications__live {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  animation: notificationPulse 2s ease-in-out infinite;
}

@keyframes notificationPulse {
  0%, 100% { box-shadow: 4px 4px 0 #1a1a1a; }
  50% { box-shadow: 6px 6px 0 #1a1a1a, 0 0 20px rgba(251, 146, 60, 0.3); }
}

.proposal-notifications__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 2px solid #1a1a1a;
}

.proposal-notifications__icon {
  font-size: 16px;
}

.proposal-notifications__title {
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #1a1a1a;
}

.proposal-notifications__count {
  margin-left: auto;
  background: #1a1a1a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.proposal-notifications__list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
}

.proposal-notifications__list--compact {
  max-height: 180px;
}

.proposal-notification {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.proposal-notification:hover {
  transform: translateX(-2px);
  box-shadow: 2px 2px 0 #1a1a1a;
}

.proposal-notification--live {
  background: #fff;
  border-color: #f97316;
}

.proposal-notification--closed {
  opacity: 0.7;
}

.proposal-notification__avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  border: 2px solid #1a1a1a;
}

.proposal-notification__type {
  font-size: 16px;
  flex-shrink: 0;
}

.proposal-notification__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.proposal-notification__name {
  font-weight: 600;
  font-size: 13px;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proposal-notification__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}

.proposal-notification__time-live {
  font-weight: 700;
  color: #f97316;
  background: #ffedd5;
  padding: 1px 6px;
  border-radius: 4px;
}

.proposal-notification__scroll {
  background: #e0e7ff;
  color: #4338ca;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.proposal-notification__pulse {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.proposal-notification__dismiss {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: none;
  background: #e5e5e5;
  color: #666;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.proposal-notification:hover .proposal-notification__dismiss {
  opacity: 1;
}

.proposal-notification__dismiss:hover {
  background: #ef4444;
  color: #fff;
}

/* ===== ANALYTICS DE PROPOSTA ===== */
.analytics-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.analytics-stat {
  background: #f8fafc;
  border: 2px solid #1a1a1a;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  box-shadow: 2px 2px 0 #1a1a1a;
}

.analytics-stat__value {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  color: #1a1a1a;
  font-family: var(--font-display);
}

.analytics-stat__label {
  display: block;
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.analytics-devices {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.analytics-device {
  font-size: 13px;
  color: #0369a1;
}

.analytics-views {
  margin-bottom: 12px;
}

.analytics-views__header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  margin-bottom: 8px;
}

.analytics-views__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analytics-view-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
}

.analytics-view-item--bot {
  opacity: 0.5;
  background: #fef2f2;
}

.analytics-view-item__visitor {
  font-size: 16px;
  cursor: default;
}

.analytics-view-item__device {
  font-size: 14px;
}

.analytics-view-item__location {
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s, filter 0.2s;
}

.analytics-view-item__location:hover {
  opacity: 1;
}

.analytics-view-item__location--unknown {
  opacity: 0.4;
  filter: grayscale(100%);
}

.analytics-view-item__time {
  flex: 1;
  color: #666;
}

.analytics-view-item__duration {
  font-weight: 600;
  color: #f97316;
  background: #ffedd5;
  padding: 2px 6px;
  border-radius: 4px;
}

.analytics-view-item__scroll {
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.analytics-view-item--has-recording {
  cursor: pointer;
  border: 1px solid rgba(201, 169, 98, 0.2);
  transition: all 0.15s ease;
}

.analytics-view-item--has-recording:hover {
  background: rgba(201, 169, 98, 0.1);
  border-color: rgba(201, 169, 98, 0.4);
}

.analytics-view-item__play {
  font-size: 14px;
  opacity: 0.7;
  transition: all 0.15s ease;
  margin-left: auto;
}

.analytics-view-item--has-recording:hover .analytics-view-item__play {
  opacity: 1;
  transform: scale(1.1);
}

.analytics-view-item__report {
  font-size: 14px;
  opacity: 0.6;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 6px;
  margin-right: 4px;
}

.analytics-view-item__report:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* ===== PAGE TIMES MODAL ===== */
.modal--page-times {
  width: 400px;
  max-width: 90vw;
}

.page-times-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 2px solid #1a1a1a;
}

.page-times-info__device {
  font-size: 20px;
}

.page-times-info__date {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.page-times-info__total {
  font-weight: 700;
  font-size: 14px;
  color: #c9a962;
  background: rgba(201, 169, 98, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
}

.page-times-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.page-time-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-time-bar__label {
  width: 80px;
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
}

.page-time-bar__track {
  flex: 1;
  height: 20px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #d1d5db;
}

.page-time-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a962 0%, #d4b87a 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  min-width: 2px;
}

.page-time-bar__value {
  width: 50px;
  font-size: 12px;
  font-weight: 700;
  color: #f97316;
  text-align: right;
}

.page-times-pages {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.page-times-pages__label {
  font-size: 11px;
  color: #16a34a;
  font-weight: 600;
  text-transform: uppercase;
}

.page-times-pages__list {
  font-size: 13px;
  color: #166534;
  font-weight: 500;
}

.page-times-empty {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}

.page-times-empty__hint {
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.analytics-dates {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.analytics-date {
  font-size: 11px;
  color: #666;
}

/* ===== SESSION RECORDINGS ===== */
.recordings-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(201, 169, 98, 0.1);
}

.recordings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #c9a962;
  margin-bottom: 12px;
}

.recordings-icon {
  width: 16px;
  height: 16px;
  stroke: #c9a962;
}

.recordings-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recording-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(201, 169, 98, 0.05);
  border: 1px solid rgba(201, 169, 98, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.recording-item:hover {
  background: rgba(201, 169, 98, 0.1);
  border-color: rgba(201, 169, 98, 0.3);
}

.recording-device {
  font-size: 16px;
}

.recording-date {
  font-size: 12px;
  color: #888;
  flex: 1;
}

.recording-duration {
  font-size: 12px;
  font-weight: 600;
  color: #c9a962;
}

.recording-events {
  font-size: 11px;
  color: #666;
}

.recording-play {
  font-size: 12px;
  color: #22c55e;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.recording-item:hover .recording-play {
  opacity: 1;
}

/* ===== REPLAY MODAL ===== */
.modal-overlay--dark {
  background: rgba(0, 0, 0, 0.9);
}

.modal--replay {
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
}

.modal--replay .modal__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.replay-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  margin-right: 24px;
}

.replay-device {
  font-size: 13px;
  color: #888;
}

.replay-duration {
  font-size: 13px;
  font-weight: 600;
  color: #c9a962;
}

.modal__body--replay {
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  background: #0a0a0a;
}

.replay-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #888;
  min-height: 400px;
}

.replay-loading__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top-color: #c9a962;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.replay-player-container {
  width: 100%;
  height: 450px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0a0a0a;
  overflow: hidden;
}

/* Player escalado para caber no container */
#rrweb-player {
  border: 3px solid #c9a962;
  background: #0a0a0a;
  box-shadow: 6px 6px 0 rgba(201, 169, 98, 0.5);
  transform: scale(0.4);
  transform-origin: center center;
}

.replay-empty {
  color: #666;
  font-size: 14px;
  text-align: center;
  padding: 60px 20px;
}

/* ===== FOOTER COM CONTROLES DO REPLAY ===== */
.modal__footer--replay {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 24px !important;
  background: #1a1a1a !important;
  border-top: 3px solid #c9a962 !important;
}

.replay-footer-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.replay-footer-btn {
  padding: 10px 14px;
  cursor: pointer;
  background: #333;
  border: 2px solid #555;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.replay-footer-btn:hover {
  background: #444;
  border-color: #c9a962;
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0 #c9a962;
}

.replay-footer-btn--play {
  background: #c9a962 !important;
  border-color: #c9a962 !important;
  color: #1a1a1a !important;
  font-size: 16px;
  min-width: 44px;
}

.replay-footer-btn--play:hover {
  background: #d4b872 !important;
  border-color: #fff !important;
  box-shadow: 2px 2px 0 #fff;
}

.replay-footer-btn--speed {
  padding: 8px 12px;
  font-size: 12px;
  min-width: 40px;
}

.replay-footer-btn--speed.active {
  background: #c9a962 !important;
  border-color: #c9a962 !important;
  color: #1a1a1a !important;
}

.replay-footer-btn--skip {
  padding: 8px 12px;
  font-size: 14px;
}

.replay-footer-btn--skip.active {
  background: #c9a962 !important;
  border-color: #c9a962 !important;
  color: #1a1a1a !important;
}

.replay-footer-progress {
  flex: 1;
  height: 10px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border: 2px solid #555;
  cursor: pointer;
  min-width: 150px;
}

.replay-footer-progress::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #c9a962;
  border: 2px solid #1a1a1a;
  cursor: pointer;
}

.replay-footer-progress::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #c9a962;
  border: 2px solid #1a1a1a;
  cursor: pointer;
}

.replay-footer-time {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: #c9a962;
  white-space: nowrap;
  min-width: 90px;
}

.replay-footer-speeds {
  display: flex;
  gap: 6px;
}
</style>

<!-- Estilos NÃO scoped para o modal teleportado -->
<style>
/* ============================================
   SPECIALIST MODAL - TELEPORTED (unscoped)
   ============================================ */

/* Overlay específico para specialist modal */
.modal-overlay:has(.specialist-modal) {
  background: rgba(26, 26, 26, 0.7);
  backdrop-filter: blur(8px);
}

/* Specialist Modal - Neobrutalista */
.specialist-modal {
  background: #FAFAFA !important;
  border: 3px solid #1a1a1a !important;
  border-radius: 12px !important;
  box-shadow: 6px 6px 0 #1a1a1a, 0 20px 40px -10px rgba(0, 0, 0, 0.25) !important;
  width: 100%;
  max-width: 340px;
  max-height: 80vh;
  overflow: hidden;
  animation: specialistModalBounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #1a1a1a !important;
}

@keyframes specialistModalBounce {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.specialist-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 3px solid #1a1a1a !important;
  background: #c9a962 !important;
}

.specialist-modal__header h3 {
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  margin: 0;
  color: #1a1a1a !important;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Botão fechar no header do specialist modal */
.specialist-modal__header .modal__close {
  width: 28px;
  height: 28px;
  background: #FFFFFF;
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  box-shadow: 2px 2px 0 #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #1a1a1a;
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.specialist-modal__header .modal__close:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #1a1a1a;
  background: #ef4444;
  color: white;
}

.specialist-modal__list {
  padding: 12px;
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #FAFAFA !important;
}

.specialist-modal__list::-webkit-scrollbar {
  width: 8px;
}

.specialist-modal__list::-webkit-scrollbar-track {
  background: #e5e5e5;
  border-radius: 4px;
}

.specialist-modal__list::-webkit-scrollbar-thumb {
  background: #1a1a1a;
  border-radius: 4px;
}

.specialist-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #FFFFFF !important;
  border: 2px solid #1a1a1a !important;
  border-radius: 8px;
  box-shadow: 3px 3px 0 #1a1a1a;
  cursor: pointer;
  transition: all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  width: 100%;
  color: #1a1a1a !important;
}

.specialist-option:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #1a1a1a;
  border-color: #c9a962 !important;
}

.specialist-option:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #1a1a1a;
}

.specialist-option--active {
  background: #c9a962 !important;
  border-color: #1a1a1a !important;
  box-shadow: 3px 3px 0 #1a1a1a;
}

.specialist-option--active:hover {
  box-shadow: 5px 5px 0 #1a1a1a;
}

.specialist-option__avatar {
  width: 38px;
  height: 38px;
  background: #3b82f6;
  border: 2px solid #1a1a1a !important;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  color: #FFFFFF;
  flex-shrink: 0;
  text-transform: uppercase;
}

.specialist-option--active .specialist-option__avatar {
  background: #1a1a1a;
  color: #c9a962;
}

.specialist-option__name {
  flex: 1;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a1a1a !important;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.specialist-option__count {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1a1a1a !important;
  background: #e5e5e5 !important;
  padding: 4px 10px;
  border-radius: 20px;
  border: 2px solid #1a1a1a;
}

.specialist-option--active .specialist-option__count {
  background: #FFFFFF !important;
  color: #1a1a1a !important;
}
</style>
