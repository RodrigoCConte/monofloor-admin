<template>
  <div class="pre-obra">
    <!-- Header -->
    <header class="pre-obra-header">
      <div class="header-content">
        <div class="header-title-section">
          <h1 class="page-title">
            <span class="title-icon">⚙️</span>
            Pre-Obra
          </h1>
          <p class="page-subtitle">Planejamento pos-contrato</p>
        </div>
        <div class="header-actions">
          <button class="btn btn--outline" @click="openCreateModal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nova Pre-Obra
          </button>
        </div>
      </div>
    </header>

    <!-- KPI Stats -->
    <section class="kpi-section">
      <div class="kpi-row">
        <div class="kpi-card kpi-card--aguardando" @click="filterByStatus('AGUARDANDO_ORIENTACOES')">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats.aguardandoOrientacoes }}</span>
            <span class="kpi-label">Aguardando</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--andamento" @click="filterByStatus('EM_ANDAMENTO')">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats.emAndamento }}</span>
            <span class="kpi-label">Em Andamento</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--concluido" @click="filterByStatus('PRONTO_EXECUCAO')">
          <div class="kpi-icon">✅</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats.concluido }}</span>
            <span class="kpi-label">Concluido</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--total" @click="filterByStatus('ALL')">
          <div class="kpi-icon">📊</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats.total }}</span>
            <span class="kpi-label">Total</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Capacity Dashboard -->
    <section class="capacity-section">
      <div class="capacity-header">
        <h2 class="capacity-title">📅 Planejamento de Capacidade</h2>
        <div class="capacity-legend">
          <span class="legend-item"><span class="legend-color legend-color--available"></span> Disponivel</span>
          <span class="legend-item"><span class="legend-color legend-color--allocated"></span> Alocado</span>
          <span class="legend-item"><span class="legend-color legend-color--over"></span> Excedido</span>
        </div>
      </div>

      <!-- Unallocated Projects -->
      <div class="unallocated-projects" v-if="capacityData.unallocated.length > 0">
        <h3 class="unallocated-title">Projetos sem alocacao (arraste para um mes):</h3>
        <div class="unallocated-list">
          <div
            v-for="project in capacityData.unallocated"
            :key="project.id"
            class="unallocated-card"
            draggable="true"
            @dragstart="onDragStart($event, project)"
          >
            <div class="unallocated-card__name">{{ project.cliente }}</div>
            <div class="unallocated-card__hours">
              <input
                type="number"
                v-model.number="project.horasEstimadas"
                @change="updateProjectHours(project)"
                @click.stop
                class="hours-input"
                min="0"
                step="10"
              />
              <span>h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 12 Month Bars -->
      <div class="capacity-grid">
        <div
          v-for="month in capacityData.months"
          :key="month.month"
          class="capacity-month"
          :class="{ 'capacity-month--over': month.allocated > month.capacity }"
          @dragover.prevent
          @drop="onDrop($event, month.month)"
        >
          <div class="month-header">
            <span class="month-label">{{ month.label }}</span>
            <span class="month-stats">{{ formatNumber(month.allocated) }} / {{ formatNumber(month.capacity) }}h</span>
          </div>
          <div class="month-bar">
            <div
              class="month-bar__fill"
              :style="{ width: Math.min((month.allocated / month.capacity) * 100, 100) + '%' }"
              :class="{
                'month-bar__fill--low': month.allocated / month.capacity <= 0.5,
                'month-bar__fill--medium': month.allocated / month.capacity > 0.5 && month.allocated / month.capacity <= 0.8,
                'month-bar__fill--high': month.allocated / month.capacity > 0.8 && month.allocated <= month.capacity,
                'month-bar__fill--over': month.allocated > month.capacity
              }"
            ></div>
          </div>
          <div class="month-percentage">{{ Math.round((month.allocated / month.capacity) * 100) }}%</div>
          <div class="month-projects" v-if="month.projects.length > 0">
            <div
              v-for="proj in month.projects"
              :key="proj.id"
              class="month-project"
              @click="removeFromMonth(proj)"
              title="Clique para remover"
            >
              <span class="month-project__name">{{ proj.cliente }}</span>
              <span class="month-project__hours">{{ proj.horasEstimadas }}h</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="pre-obra-content">
      <!-- List Panel -->
      <aside class="list-panel">
        <div class="list-header">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Buscar cliente ou endereco..."
            class="search-input"
            @input="debouncedSearch"
          />
        </div>
        <div class="list-items" v-if="!loading">
          <div
            v-for="item in preObras"
            :key="item.id"
            class="list-item"
            :class="{ 'list-item--active': selectedPreObra?.id === item.id }"
            @click="selectPreObra(item)"
          >
            <div class="list-item__status" :class="getStatusClass(item.status)"></div>
            <div class="list-item__content">
              <span class="list-item__cliente">{{ item.project?.cliente || 'Sem cliente' }}</span>
              <span class="list-item__endereco">{{ item.project?.endereco || 'Sem endereco' }}</span>
            </div>
            <div class="list-item__progress">
              <div class="progress-bar">
                <div class="progress-bar__fill" :style="{ width: getProgress(item) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getProgress(item) }}%</span>
            </div>
          </div>
          <div v-if="preObras.length === 0" class="list-empty">
            Nenhuma pre-obra encontrada
          </div>
        </div>
        <div v-else class="list-loading">
          Carregando...
        </div>
      </aside>

      <!-- Detail Panel -->
      <main class="detail-panel" v-if="selectedPreObra">
        <!-- Project Info -->
        <div class="project-info">
          <div class="project-info__header">
            <h2 class="project-info__title">{{ selectedPreObra.project?.cliente }}</h2>
            <span class="status-badge" :class="getStatusClass(selectedPreObra.status)">
              {{ formatStatus(selectedPreObra.status) }}
            </span>
          </div>
          <p class="project-info__address">{{ selectedPreObra.project?.endereco }}</p>
          <div class="project-info__meta">
            <span class="meta-item">
              <strong>{{ selectedPreObra.project?.m2Total || 0 }}</strong> m2 total
            </span>
            <span class="meta-item">
              <strong>{{ selectedPreObra.project?.m2Piso || 0 }}</strong> m2 piso
            </span>
            <span class="meta-item">
              <strong>{{ selectedPreObra.project?.m2Parede || 0 }}</strong> m2 parede
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Tab 1: Visao Geral -->
          <div v-if="activeTab === 'visao-geral'" class="tab-visao-geral">
            <h3 class="section-title">Checklist de Preparacao</h3>
            <div class="checklist">
              <div
                v-for="item in checklistItems"
                :key="item.field"
                class="checklist-item"
                :class="{ 'checklist-item--completed': getChecklistValue(item.field) }"
                @click="toggleChecklistItem(item.field)"
              >
                <div class="checklist-item__checkbox">
                  <svg v-if="getChecklistValue(item.field)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div class="checklist-item__content">
                  <span class="checklist-item__title">{{ item.label }}</span>
                  <span class="checklist-item__date" v-if="item.dateField && getChecklistDateValue(item.dateField)">
                    {{ formatDate(getChecklistDateValue(item.dateField)) }}
                  </span>
                </div>
                <div class="checklist-item__icon">{{ item.icon }}</div>
              </div>
            </div>

            <h3 class="section-title">Progresso Geral</h3>
            <div class="progress-overview">
              <div class="progress-bar progress-bar--large">
                <div class="progress-bar__fill" :style="{ width: getProgress(selectedPreObra) + '%' }"></div>
              </div>
              <span class="progress-percentage">{{ getProgress(selectedPreObra) }}% completo</span>
            </div>
          </div>

          <!-- Tab 2: Cronograma -->
          <div v-if="activeTab === 'cronograma'" class="tab-cronograma">
            <div class="cronograma-header">
              <h3 class="section-title">Tarefas</h3>
              <div class="cronograma-actions">
                <button class="btn btn--small btn--outline" @click="generateTarefas">
                  ⚙️ Gerar Padrao
                </button>
                <button class="btn btn--small btn--primary" @click="showTarefaModal = true">
                  + Nova Tarefa
                </button>
              </div>
            </div>
            <div class="tarefas-list">
              <div
                v-for="(tarefa, index) in tarefas"
                :key="tarefa.id"
                class="tarefa-card"
                :class="{ 'tarefa-card--completed': tarefa.status === 'CONCLUIDA' }"
              >
                <div class="tarefa-card__number">{{ index + 1 }}</div>
                <div class="tarefa-card__content">
                  <div class="tarefa-card__header">
                    <span class="tarefa-card__tipo" :class="getTipoClass(tarefa.tipo)">
                      {{ formatTipo(tarefa.tipo) }}
                    </span>
                    <select
                      class="tarefa-card__status-select"
                      :value="tarefa.status"
                      @change="updateTarefaStatus(tarefa, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDA">Concluida</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                    </select>
                  </div>
                  <h4 class="tarefa-card__title">{{ tarefa.titulo }}</h4>
                  <div class="tarefa-card__meta">
                    <span v-if="tarefa.dataAgendada" class="tarefa-card__date">
                      📅 {{ formatDate(tarefa.dataAgendada) }}
                      <span v-if="tarefa.horaAgendada"> - {{ tarefa.horaAgendada }}</span>
                    </span>
                    <span v-if="tarefa.responsavelNome" class="tarefa-card__responsavel">
                      👤 {{ tarefa.responsavelNome }}
                    </span>
                  </div>
                </div>
                <div class="tarefa-card__actions">
                  <button class="btn-icon" @click="editTarefa(tarefa)" title="Editar">
                    ✏️
                  </button>
                  <button class="btn-icon btn-icon--danger" @click="deleteTarefa(tarefa)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
              <div v-if="tarefas.length === 0" class="empty-state">
                <span class="empty-state__icon">📋</span>
                <p>Nenhuma tarefa cadastrada</p>
                <button class="btn btn--primary" @click="generateTarefas">
                  Gerar Tarefas Padrao
                </button>
              </div>
            </div>
          </div>

          <!-- Tab 3: Materiais -->
          <div v-if="activeTab === 'materiais'" class="tab-materiais">
            <div class="calculator-widget">
              <h3 class="calculator-widget__title">Calculadora de Materiais</h3>
              <div class="calculator-widget__info">
                <div class="calculator-info-item">
                  <span class="label">m2 Piso</span>
                  <span class="value">{{ selectedPreObra.project?.m2Piso || 0 }}</span>
                </div>
                <div class="calculator-info-item">
                  <span class="label">m2 Parede</span>
                  <span class="value">{{ selectedPreObra.project?.m2Parede || 0 }}</span>
                </div>
                <div class="calculator-info-item">
                  <span class="label">m2 Total</span>
                  <span class="value">{{ selectedPreObra.project?.m2Total || 0 }}</span>
                </div>
              </div>
              <button class="btn btn--gold" @click="calculateProvisionamentos" :disabled="calculatingMaterials">
                {{ calculatingMaterials ? 'Calculando...' : '⚙️ Calcular Materiais' }}
              </button>
            </div>

            <div class="materiais-header">
              <h3 class="section-title">Provisionamentos</h3>
              <button class="btn btn--small btn--primary" @click="showProvisionamentoModal = true">
                + Adicionar Item
              </button>
            </div>

            <div class="materiais-tabs">
              <button
                v-for="tipo in tiposProvisionamento"
                :key="tipo.value"
                class="materiais-tab"
                :class="{ 'materiais-tab--active': filtroTipo === tipo.value }"
                @click="filtroTipo = tipo.value"
              >
                {{ tipo.label }}
                <span class="materiais-tab__count">{{ getProvisionamentoCount(tipo.value) }}</span>
              </button>
            </div>

            <div class="provisionamentos-list">
              <div
                v-for="prov in filteredProvisionamentos"
                :key="prov.id"
                class="prov-card"
                :class="getProvStatusClass(prov.status)"
              >
                <div class="prov-card__icon">{{ getProvIcon(prov.tipo) }}</div>
                <div class="prov-card__content">
                  <h4 class="prov-card__nome">{{ prov.nome }}</h4>
                  <div class="prov-card__quantidade">
                    <strong>{{ prov.quantidade }}</strong> {{ prov.unidade }}
                    <span v-if="prov.baseadoEmM2" class="prov-card__badge">Auto</span>
                  </div>
                </div>
                <div class="prov-card__status">
                  <select
                    class="prov-status-select"
                    :value="prov.status"
                    @change="updateProvStatus(prov, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="SOLICITADO">Solicitado</option>
                    <option value="EM_TRANSITO">Em Transito</option>
                    <option value="RECEBIDO">Recebido</option>
                  </select>
                </div>
                <button class="btn-icon btn-icon--danger" @click="deleteProvisionamento(prov)">
                  🗑️
                </button>
              </div>
              <div v-if="filteredProvisionamentos.length === 0" class="empty-state">
                <span class="empty-state__icon">📦</span>
                <p>Nenhum item {{ filtroTipo !== 'ALL' ? 'deste tipo' : '' }}</p>
              </div>
            </div>
          </div>

          <!-- Tab 4: Cores -->
          <div v-if="activeTab === 'cores'" class="tab-cores">
            <div class="cores-header">
              <h3 class="section-title">Amostras de Cor</h3>
              <button class="btn btn--small btn--primary" @click="showAmostraModal = true">
                + Nova Amostra
              </button>
            </div>

            <div class="cor-selecionada" v-if="corSelecionada">
              <div class="cor-selecionada__badge">✅ Cor Definida</div>
              <div class="cor-selecionada__swatch" :style="{ backgroundColor: corSelecionada.corHex || '#c9a962' }"></div>
              <div class="cor-selecionada__info">
                <h4>{{ corSelecionada.corNome }}</h4>
                <span v-if="corSelecionada.corCodigo">Codigo: {{ corSelecionada.corCodigo }}</span>
              </div>
            </div>

            <div class="amostras-grid">
              <div
                v-for="amostra in amostras"
                :key="amostra.id"
                class="amostra-card"
                :class="{ 'amostra-card--selected': amostra.selecionadaFinal }"
              >
                <div class="amostra-card__swatch" :style="{ backgroundColor: amostra.corHex || '#ccc' }"></div>
                <div class="amostra-card__content">
                  <h4 class="amostra-card__nome">{{ amostra.corNome }}</h4>
                  <span class="amostra-card__codigo" v-if="amostra.corCodigo">{{ amostra.corCodigo }}</span>
                </div>
                <div class="amostra-card__workflow">
                  <span
                    v-for="step in amostraSteps"
                    :key="step.status"
                    class="workflow-step"
                    :class="{
                      'workflow-step--completed': isStepCompleted(amostra, step.status),
                      'workflow-step--current': amostra.status === step.status
                    }"
                  >
                    {{ step.label }}
                  </span>
                </div>
                <div class="amostra-card__actions">
                  <select
                    class="amostra-status-select"
                    :value="amostra.status"
                    @change="updateAmostraStatus(amostra, ($event.target as HTMLSelectElement).value)"
                    :disabled="amostra.selecionadaFinal"
                  >
                    <option value="AMOSTRA_PENDENTE">Pendente</option>
                    <option value="ENVIADA">Enviada</option>
                    <option value="RECEBIDA">Recebida</option>
                    <option value="EM_AVALIACAO">Em Avaliacao</option>
                    <option value="APROVADA">Aprovada</option>
                    <option value="REJEITADA">Rejeitada</option>
                  </select>
                  <button
                    v-if="!amostra.selecionadaFinal && amostra.status === 'APROVADA'"
                    class="btn btn--small btn--gold"
                    @click="selectAmostra(amostra)"
                  >
                    Selecionar
                  </button>
                  <button
                    v-if="!amostra.selecionadaFinal"
                    class="btn-icon btn-icon--danger"
                    @click="deleteAmostra(amostra)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div v-if="amostras.length === 0" class="empty-state">
                <span class="empty-state__icon">🎨</span>
                <p>Nenhuma amostra cadastrada</p>
                <button class="btn btn--primary" @click="showAmostraModal = true">
                  Adicionar Amostra
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Empty State -->
      <main class="detail-panel detail-panel--empty" v-else>
        <div class="empty-detail">
          <span class="empty-detail__icon">📋</span>
          <h3>Selecione uma Pre-Obra</h3>
          <p>Escolha um item da lista para ver os detalhes</p>
        </div>
      </main>
    </div>

    <!-- Modal: Criar Pre-Obra -->
    <div class="modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
      <div class="modal modal--wide">
        <div class="modal__header">
          <h3>Nova Pre-Obra</h3>
          <button class="modal__close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="modal__body">
          <!-- Mode Tabs -->
          <div class="mode-tabs">
            <button
              class="mode-tab"
              :class="{ 'mode-tab--active': createMode === 'manual' }"
              @click="createMode = 'manual'"
            >
              Criar Manualmente
            </button>
            <button
              class="mode-tab"
              :class="{ 'mode-tab--active': createMode === 'select' }"
              @click="createMode = 'select'"
            >
              Selecionar Projeto
            </button>
          </div>

          <!-- Manual Mode -->
          <div v-if="createMode === 'manual'" class="manual-form">
            <div class="form-group">
              <label>Cliente *</label>
              <input type="text" v-model="manualProjectForm.cliente" placeholder="Nome do cliente" />
            </div>
            <div class="form-group">
              <label>Endereco</label>
              <input
                ref="addressInput"
                type="text"
                v-model="manualProjectForm.endereco"
                placeholder="Digite o endereco..."
                autocomplete="off"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>m2 Total</label>
                <input type="number" v-model="manualProjectForm.m2Total" min="0" step="0.01" />
              </div>
              <div class="form-group">
                <label>m2 Piso</label>
                <input type="number" v-model="manualProjectForm.m2Piso" min="0" step="0.01" />
              </div>
              <div class="form-group">
                <label>m2 Parede</label>
                <input type="number" v-model="manualProjectForm.m2Parede" min="0" step="0.01" />
              </div>
            </div>
            <div class="form-group">
              <label>Cor (opcional)</label>
              <input type="text" v-model="manualProjectForm.cor" placeholder="Ex: Cinza Urbano" />
            </div>
          </div>

          <!-- Select Mode -->
          <div v-if="createMode === 'select'" class="select-form">
            <div class="form-group">
              <label>Selecione o Projeto</label>
              <select v-model="newPreObraProjectId" :disabled="loadingProjects">
                <option value="">{{ loadingProjects ? 'Carregando...' : 'Selecione um projeto' }}</option>
                <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                  {{ project.cliente }} - {{ project.endereco }}
                </option>
              </select>
              <p class="form-hint" v-if="availableProjects.length === 0 && !loadingProjects">
                Nenhum projeto disponivel. Use "Criar Manualmente".
              </p>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline" @click="showCreateModal = false">Cancelar</button>
          <button
            class="btn btn--primary"
            @click="createPreObra"
            :disabled="(createMode === 'select' && !newPreObraProjectId) || (createMode === 'manual' && !manualProjectForm.cliente)"
          >
            Criar Pre-Obra
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Tarefa -->
    <div class="modal-overlay" v-if="showTarefaModal" @click.self="closeTarefaModal">
      <div class="modal">
        <div class="modal__header">
          <h3>{{ editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>
          <button class="modal__close" @click="closeTarefaModal">&times;</button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label>Titulo</label>
            <input type="text" v-model="tarefaForm.titulo" placeholder="Titulo da tarefa" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="tarefaForm.tipo">
                <option value="CUSTOM">Personalizado</option>
                <option value="VISITA_TECNICA_AFERICAO">Visita Tecnica</option>
                <option value="REUNIAO_ORIENTATIVA">Reuniao Orientativa</option>
                <option value="ENVIO_AMOSTRAS">Envio Amostras</option>
                <option value="DEFINICAO_COR">Definicao de Cor</option>
                <option value="PREPARACAO_CLIENTE">Preparacao Cliente</option>
                <option value="ENVIO_MATERIAIS">Envio Materiais</option>
                <option value="CONFIRMACAO_RECEBIMENTO">Confirmacao Recebimento</option>
              </select>
            </div>
            <div class="form-group">
              <label>Responsavel</label>
              <input type="text" v-model="tarefaForm.responsavelNome" placeholder="Nome do responsavel" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data</label>
              <input type="date" v-model="tarefaForm.dataAgendada" />
            </div>
            <div class="form-group">
              <label>Hora</label>
              <input type="time" v-model="tarefaForm.horaAgendada" />
            </div>
          </div>
          <div class="form-group">
            <label>Observacoes</label>
            <textarea v-model="tarefaForm.observacoes" rows="3" placeholder="Observacoes..."></textarea>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline" @click="closeTarefaModal">Cancelar</button>
          <button class="btn btn--primary" @click="saveTarefa" :disabled="!tarefaForm.titulo">
            {{ editingTarefa ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Novo Provisionamento -->
    <div class="modal-overlay" v-if="showProvisionamentoModal" @click.self="showProvisionamentoModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Novo Item</h3>
          <button class="modal__close" @click="showProvisionamentoModal = false">&times;</button>
        </div>
        <div class="modal__body">
          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="provForm.tipo">
                <option value="MATERIAL">Material</option>
                <option value="RECURSO">Recurso</option>
                <option value="EQUIPAMENTO">Equipamento</option>
                <option value="FERRAMENTA">Ferramenta</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nome</label>
              <input type="text" v-model="provForm.nome" placeholder="Nome do item" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantidade</label>
              <input type="number" v-model="provForm.quantidade" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Unidade</label>
              <select v-model="provForm.unidade">
                <option value="un">Unidade</option>
                <option value="kg">Quilograma</option>
                <option value="litros">Litros</option>
                <option value="m2">m2</option>
                <option value="m">Metro</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Fornecedor (opcional)</label>
            <input type="text" v-model="provForm.fornecedor" placeholder="Nome do fornecedor" />
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline" @click="showProvisionamentoModal = false">Cancelar</button>
          <button class="btn btn--primary" @click="createProvisionamento" :disabled="!provForm.nome || !provForm.quantidade">
            Adicionar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Amostra -->
    <div class="modal-overlay" v-if="showAmostraModal" @click.self="showAmostraModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Nova Amostra de Cor</h3>
          <button class="modal__close" @click="showAmostraModal = false">&times;</button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label>Nome da Cor</label>
            <input type="text" v-model="amostraForm.corNome" placeholder="Ex: Cinza Urbano" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Codigo (opcional)</label>
              <input type="text" v-model="amostraForm.corCodigo" placeholder="Ex: CZ-001" />
            </div>
            <div class="form-group">
              <label>Cor (hex)</label>
              <div class="color-input-wrapper">
                <input type="color" v-model="amostraForm.corHex" class="color-picker" />
                <input type="text" v-model="amostraForm.corHex" class="color-text" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline" @click="showAmostraModal = false">Cancelar</button>
          <button class="btn btn--primary" @click="createAmostra" :disabled="!amostraForm.corNome">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { preObraApi, projectsApi } from '../api';

// Google Maps - type helpers
const getGoogleMaps = () => (window as any).google?.maps;
const setInitCallback = (fn: () => void) => { (window as any).initGoogleMaps = fn; };

// Types
interface PreObra {
  id: string;
  projectId: string;
  status: string;
  orientacoesEnviadas: boolean;
  orientacoesEnviadasEm?: string;
  visitaTecnicaAgendada: boolean;
  visitaTecnicaRealizada: boolean;
  visitaTecnicaRealizadaEm?: string;
  reuniaoOrientativaRealizada: boolean;
  reuniaoOrientativaEm?: string;
  materiaisEnviados: boolean;
  materiaisEnviadosEm?: string;
  corDefinida: boolean;
  corDefinidaEm?: string;
  project?: {
    id: string;
    cliente: string;
    endereco: string;
    m2Total: number;
    m2Piso: number;
    m2Parede: number;
    cor?: string;
  };
  tarefas?: any[];
  provisionamentos?: any[];
  amostras?: any[];
}

// State
const loading = ref(true);
const preObras = ref<PreObra[]>([]);
const selectedPreObra = ref<PreObra | null>(null);
const searchQuery = ref('');
const activeTab = ref('visao-geral');
const statusFilter = ref('ALL');

// Stats
const stats = ref({
  aguardandoOrientacoes: 0,
  emAndamento: 0,
  concluido: 0,
  total: 0,
});

// Capacity Planning
interface CapacityMonth {
  month: string;
  label: string;
  capacity: number;
  allocated: number;
  projects: { id: string; projectId: string; cliente: string; horasEstimadas: number }[];
}
interface CapacityProject {
  id: string;
  projectId: string;
  cliente: string;
  endereco: string;
  horasEstimadas: number;
  m2Total: number;
}
const capacityData = ref<{
  monthlyCapacity: number;
  months: CapacityMonth[];
  unallocated: CapacityProject[];
}>({
  monthlyCapacity: 20000,
  months: [],
  unallocated: [],
});
let draggedProject: CapacityProject | null = null;

// Modals
const showCreateModal = ref(false);
const showTarefaModal = ref(false);
const showProvisionamentoModal = ref(false);
const showAmostraModal = ref(false);
const newPreObraProjectId = ref('');
const availableProjects = ref<any[]>([]);
const loadingProjects = ref(false);
const createMode = ref<'select' | 'manual'>('manual');
const manualProjectForm = ref({
  cliente: '',
  endereco: '',
  m2Total: 0,
  m2Piso: 0,
  m2Parede: 0,
  cor: '',
});
const addressInput = ref<HTMLInputElement | null>(null);
let autocomplete: any = null;

// Tab data
const tarefas = ref<any[]>([]);
const provisionamentos = ref<any[]>([]);
const amostras = ref<any[]>([]);
const filtroTipo = ref('ALL');
const calculatingMaterials = ref(false);

// Forms
const editingTarefa = ref<any>(null);
const tarefaForm = ref({
  titulo: '',
  tipo: 'CUSTOM',
  dataAgendada: '',
  horaAgendada: '',
  responsavelNome: '',
  observacoes: '',
});

const provForm = ref({
  tipo: 'MATERIAL',
  nome: '',
  quantidade: 0,
  unidade: 'un',
  fornecedor: '',
});

const amostraForm = ref({
  corNome: '',
  corCodigo: '',
  corHex: '#c9a962',
});

// Constants
const tabs = [
  { id: 'visao-geral', label: 'Visao Geral', icon: '📊' },
  { id: 'cronograma', label: 'Cronograma', icon: '📅' },
  { id: 'materiais', label: 'Materiais', icon: '📦' },
  { id: 'cores', label: 'Cores', icon: '🎨' },
];

const checklistItems = [
  { field: 'orientacoesEnviadas', dateField: 'orientacoesEnviadasEm', label: 'Orientacoes de preparacao enviadas', icon: '📄' },
  { field: 'visitaTecnicaAgendada', dateField: null, label: 'Visita tecnica agendada', icon: '📅' },
  { field: 'visitaTecnicaRealizada', dateField: 'visitaTecnicaRealizadaEm', label: 'Visita tecnica realizada', icon: '📍' },
  { field: 'reuniaoOrientativaRealizada', dateField: 'reuniaoOrientativaEm', label: 'Reuniao orientativa realizada', icon: '👥' },
  { field: 'materiaisEnviados', dateField: 'materiaisEnviadosEm', label: 'Materiais enviados', icon: '📦' },
  { field: 'corDefinida', dateField: 'corDefinidaEm', label: 'Cor definida', icon: '🎨' },
];

const tiposProvisionamento = [
  { value: 'ALL', label: 'Todos' },
  { value: 'MATERIAL', label: 'Materiais' },
  { value: 'RECURSO', label: 'Recursos' },
  { value: 'EQUIPAMENTO', label: 'Equipamentos' },
  { value: 'FERRAMENTA', label: 'Ferramentas' },
];

const amostraSteps = [
  { status: 'AMOSTRA_PENDENTE', label: 'Pend' },
  { status: 'ENVIADA', label: 'Env' },
  { status: 'RECEBIDA', label: 'Rec' },
  { status: 'EM_AVALIACAO', label: 'Aval' },
  { status: 'APROVADA', label: 'OK' },
];

// Computed
const filteredProvisionamentos = computed(() => {
  if (filtroTipo.value === 'ALL') return provisionamentos.value;
  return provisionamentos.value.filter(p => p.tipo === filtroTipo.value);
});

const corSelecionada = computed(() => {
  return amostras.value.find(a => a.selecionadaFinal);
});

// Methods
const loadPreObras = async () => {
  try {
    loading.value = true;
    const params: any = { limit: 50 };
    if (statusFilter.value !== 'ALL') {
      params.status = statusFilter.value;
    }
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    const response = await preObraApi.getAll(params);
    preObras.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading pre-obras:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await preObraApi.getStats();
    stats.value = response.data.stats || stats.value;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

// Capacity Planning Functions
const loadCapacity = async () => {
  try {
    const response = await preObraApi.getCapacity();
    capacityData.value = response.data.data || capacityData.value;
  } catch (error) {
    console.error('Error loading capacity:', error);
  }
};

const formatNumber = (num: number) => {
  return num.toLocaleString('pt-BR');
};

const onDragStart = (event: DragEvent, project: CapacityProject) => {
  draggedProject = project;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', project.id);
  }
};

const onDrop = async (event: DragEvent, monthKey: string) => {
  event.preventDefault();
  if (!draggedProject) return;

  try {
    await preObraApi.allocate(draggedProject.id, monthKey, draggedProject.horasEstimadas);
    await loadCapacity();
  } catch (error) {
    console.error('Error allocating project:', error);
    alert('Erro ao alocar projeto');
  }

  draggedProject = null;
};

const removeFromMonth = async (project: { id: string }) => {
  if (!confirm('Remover projeto deste mes?')) return;

  try {
    await preObraApi.allocate(project.id, null);
    await loadCapacity();
  } catch (error) {
    console.error('Error removing from month:', error);
    alert('Erro ao remover projeto');
  }
};

const updateProjectHours = async (project: CapacityProject) => {
  try {
    await preObraApi.allocate(project.id, null, project.horasEstimadas);
  } catch (error) {
    console.error('Error updating hours:', error);
  }
};

const selectPreObra = async (item: PreObra) => {
  try {
    const response = await preObraApi.getById(item.id);
    selectedPreObra.value = response.data.data;
    tarefas.value = selectedPreObra.value?.tarefas || [];
    provisionamentos.value = selectedPreObra.value?.provisionamentos || [];
    amostras.value = selectedPreObra.value?.amostras || [];
  } catch (error) {
    console.error('Error loading pre-obra:', error);
  }
};

const loadAvailableProjects = async () => {
  try {
    loadingProjects.value = true;
    const response = await projectsApi.getAll({ limit: 200 });
    // Filter projects that don't have a pre-obra yet
    const existingProjectIds = preObras.value.map(p => p.projectId);
    availableProjects.value = (response.data.data || []).filter(
      (p: any) => !existingProjectIds.includes(p.id)
    );
  } catch (error) {
    console.error('Error loading projects:', error);
  } finally {
    loadingProjects.value = false;
  }
};

// Google Maps Autocomplete
const loadGoogleMaps = () => {
  if (getGoogleMaps()?.places) {
    initAutocomplete();
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBXZ_InKVKqcWJsL-VEQhFzWlM6_C1dlQY';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;

  setInitCallback(() => {
    initAutocomplete();
  });

  document.head.appendChild(script);
};

const initAutocomplete = () => {
  nextTick(() => {
    const maps = getGoogleMaps();
    if (!addressInput.value || !maps?.places) return;

    autocomplete = new maps.places.Autocomplete(addressInput.value, {
      types: ['address'],
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry', 'address_components'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        manualProjectForm.value.endereco = place.formatted_address;
      }
    });
  });
};

const openCreateModal = async () => {
  showCreateModal.value = true;
  createMode.value = 'manual';
  manualProjectForm.value = { cliente: '', endereco: '', m2Total: 0, m2Piso: 0, m2Parede: 0, cor: '' };
  newPreObraProjectId.value = '';
  await loadAvailableProjects();

  // Initialize Google Maps autocomplete after modal opens
  nextTick(() => {
    loadGoogleMaps();
  });
};

const createPreObra = async () => {
  try {
    if (createMode.value === 'select') {
      if (!newPreObraProjectId.value) return;
      await preObraApi.create(newPreObraProjectId.value);
    } else {
      // Criar manualmente - primeiro cria o projeto, depois a pre-obra
      if (!manualProjectForm.value.cliente) {
        alert('Preencha o nome do cliente');
        return;
      }
      const projectResponse = await projectsApi.create({
        title: manualProjectForm.value.cliente, // API usa 'title' como campo principal
        cliente: manualProjectForm.value.cliente,
        endereco: manualProjectForm.value.endereco,
        m2Total: manualProjectForm.value.m2Total || 0,
        m2Piso: manualProjectForm.value.m2Piso || 0,
        m2Parede: manualProjectForm.value.m2Parede || 0,
        cor: manualProjectForm.value.cor,
        status: 'EM_EXECUCAO', // Status válido para projetos
      });
      const projectId = projectResponse.data.data?.id || projectResponse.data.id;
      if (!projectId) {
        alert('Erro ao criar projeto: ID não retornado');
        return;
      }
      await preObraApi.create(projectId);
    }
    showCreateModal.value = false;
    newPreObraProjectId.value = '';
    manualProjectForm.value = { cliente: '', endereco: '', m2Total: 0, m2Piso: 0, m2Parede: 0, cor: '' };
    await loadPreObras();
    await loadStats();
  } catch (error: any) {
    alert(error.response?.data?.error || 'Erro ao criar pre-obra');
  }
};

const toggleChecklistItem = async (field: string) => {
  if (!selectedPreObra.value) return;
  const currentValue = (selectedPreObra.value as any)[field];
  try {
    await preObraApi.updateChecklist(selectedPreObra.value.id, field, !currentValue);
    (selectedPreObra.value as any)[field] = !currentValue;
    await loadStats();
  } catch (error) {
    console.error('Error updating checklist:', error);
  }
};

const filterByStatus = (status: string) => {
  if (status === 'EM_ANDAMENTO') {
    statusFilter.value = 'ALL'; // Will filter in frontend
  } else {
    statusFilter.value = status;
  }
  loadPreObras();
};

// Tarefas
const generateTarefas = async () => {
  if (!selectedPreObra.value) return;
  try {
    const response = await preObraApi.generateTarefas(selectedPreObra.value.id);
    tarefas.value = response.data.data || [];
  } catch (error) {
    console.error('Error generating tarefas:', error);
  }
};

const editTarefa = (tarefa: any) => {
  editingTarefa.value = tarefa;
  tarefaForm.value = {
    titulo: tarefa.titulo,
    tipo: tarefa.tipo,
    dataAgendada: tarefa.dataAgendada ? tarefa.dataAgendada.split('T')[0] : '',
    horaAgendada: tarefa.horaAgendada || '',
    responsavelNome: tarefa.responsavelNome || '',
    observacoes: tarefa.observacoes || '',
  };
  showTarefaModal.value = true;
};

const closeTarefaModal = () => {
  showTarefaModal.value = false;
  editingTarefa.value = null;
  tarefaForm.value = {
    titulo: '',
    tipo: 'CUSTOM',
    dataAgendada: '',
    horaAgendada: '',
    responsavelNome: '',
    observacoes: '',
  };
};

const saveTarefa = async () => {
  if (!selectedPreObra.value || !tarefaForm.value.titulo) return;
  try {
    if (editingTarefa.value) {
      await preObraApi.updateTarefa(selectedPreObra.value.id, editingTarefa.value.id, tarefaForm.value);
    } else {
      await preObraApi.createTarefa(selectedPreObra.value.id, tarefaForm.value);
    }
    closeTarefaModal();
    await selectPreObra(selectedPreObra.value);
  } catch (error) {
    console.error('Error saving tarefa:', error);
  }
};

const updateTarefaStatus = async (tarefa: any, status: string) => {
  if (!selectedPreObra.value) return;
  try {
    await preObraApi.updateTarefa(selectedPreObra.value.id, tarefa.id, { status });
    tarefa.status = status;
  } catch (error) {
    console.error('Error updating tarefa status:', error);
  }
};

const deleteTarefa = async (tarefa: any) => {
  if (!selectedPreObra.value || !confirm('Excluir esta tarefa?')) return;
  try {
    await preObraApi.deleteTarefa(selectedPreObra.value.id, tarefa.id);
    tarefas.value = tarefas.value.filter(t => t.id !== tarefa.id);
  } catch (error) {
    console.error('Error deleting tarefa:', error);
  }
};

// Provisionamentos
const calculateProvisionamentos = async () => {
  if (!selectedPreObra.value) return;
  try {
    calculatingMaterials.value = true;
    const response = await preObraApi.calculateProvisionamentos(selectedPreObra.value.id);
    provisionamentos.value = response.data.data || [];
  } catch (error) {
    console.error('Error calculating materials:', error);
  } finally {
    calculatingMaterials.value = false;
  }
};

const createProvisionamento = async () => {
  if (!selectedPreObra.value || !provForm.value.nome) return;
  try {
    await preObraApi.createProvisionamento(selectedPreObra.value.id, provForm.value);
    showProvisionamentoModal.value = false;
    provForm.value = { tipo: 'MATERIAL', nome: '', quantidade: 0, unidade: 'un', fornecedor: '' };
    await selectPreObra(selectedPreObra.value);
  } catch (error) {
    console.error('Error creating provisionamento:', error);
  }
};

const updateProvStatus = async (prov: any, status: string) => {
  if (!selectedPreObra.value) return;
  try {
    await preObraApi.updateProvisionamento(selectedPreObra.value.id, prov.id, { status });
    prov.status = status;
  } catch (error) {
    console.error('Error updating prov status:', error);
  }
};

const deleteProvisionamento = async (prov: any) => {
  if (!selectedPreObra.value || !confirm('Excluir este item?')) return;
  try {
    await preObraApi.deleteProvisionamento(selectedPreObra.value.id, prov.id);
    provisionamentos.value = provisionamentos.value.filter(p => p.id !== prov.id);
  } catch (error) {
    console.error('Error deleting provisionamento:', error);
  }
};

const getProvisionamentoCount = (tipo: string) => {
  if (tipo === 'ALL') return provisionamentos.value.length;
  return provisionamentos.value.filter(p => p.tipo === tipo).length;
};

// Amostras
const createAmostra = async () => {
  if (!selectedPreObra.value || !amostraForm.value.corNome) return;
  try {
    await preObraApi.createAmostra(selectedPreObra.value.id, amostraForm.value);
    showAmostraModal.value = false;
    amostraForm.value = { corNome: '', corCodigo: '', corHex: '#c9a962' };
    await selectPreObra(selectedPreObra.value);
  } catch (error) {
    console.error('Error creating amostra:', error);
  }
};

const updateAmostraStatus = async (amostra: any, status: string) => {
  if (!selectedPreObra.value) return;
  try {
    await preObraApi.updateAmostra(selectedPreObra.value.id, amostra.id, { status });
    amostra.status = status;
  } catch (error) {
    console.error('Error updating amostra status:', error);
  }
};

const selectAmostra = async (amostra: any) => {
  if (!selectedPreObra.value) return;
  try {
    await preObraApi.selectAmostra(selectedPreObra.value.id, amostra.id);
    await selectPreObra(selectedPreObra.value);
    await loadStats();
  } catch (error) {
    console.error('Error selecting amostra:', error);
  }
};

const deleteAmostra = async (amostra: any) => {
  if (!selectedPreObra.value || !confirm('Excluir esta amostra?')) return;
  try {
    await preObraApi.deleteAmostra(selectedPreObra.value.id, amostra.id);
    amostras.value = amostras.value.filter(a => a.id !== amostra.id);
  } catch (error) {
    console.error('Error deleting amostra:', error);
  }
};

const isStepCompleted = (amostra: any, stepStatus: string) => {
  const order = ['AMOSTRA_PENDENTE', 'ENVIADA', 'RECEBIDA', 'EM_AVALIACAO', 'APROVADA'];
  const currentIndex = order.indexOf(amostra.status);
  const stepIndex = order.indexOf(stepStatus);
  return stepIndex < currentIndex || (amostra.status === 'APROVADA' && stepStatus === 'APROVADA');
};

// Helpers
const getProgress = (item: PreObra) => {
  let completed = 0;
  if (item.orientacoesEnviadas) completed++;
  if (item.visitaTecnicaAgendada) completed++;
  if (item.visitaTecnicaRealizada) completed++;
  if (item.reuniaoOrientativaRealizada) completed++;
  if (item.materiaisEnviados) completed++;
  if (item.corDefinida) completed++;
  return Math.round((completed / 6) * 100);
};

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    'AGUARDANDO_ORIENTACOES': 'status--aguardando',
    'ORIENTACOES_ENVIADAS': 'status--andamento',
    'AGEND_VISITA_TECNICA': 'status--andamento',
    'VISITA_AGENDADA': 'status--andamento',
    'VISITA_REALIZADA': 'status--andamento',
    'REUNIAO_ORIENTATIVA_PEND': 'status--andamento',
    'REUNIAO_REALIZADA': 'status--andamento',
    'AGUARDANDO_COR': 'status--andamento',
    'COR_DEFINIDA': 'status--andamento',
    'MATERIAIS_SOLICITADOS': 'status--andamento',
    'MATERIAIS_EM_TRANSITO': 'status--andamento',
    'MATERIAIS_RECEBIDOS': 'status--concluido',
    'PRONTO_EXECUCAO': 'status--concluido',
  };
  return map[status] || 'status--aguardando';
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'AGUARDANDO_ORIENTACOES': 'Aguardando Orientacoes',
    'ORIENTACOES_ENVIADAS': 'Orientacoes Enviadas',
    'AGEND_VISITA_TECNICA': 'Agendando VT',
    'VISITA_AGENDADA': 'VT Agendada',
    'VISITA_REALIZADA': 'VT Realizada',
    'REUNIAO_ORIENTATIVA_PEND': 'Reuniao Pendente',
    'REUNIAO_REALIZADA': 'Reuniao Realizada',
    'AGUARDANDO_COR': 'Aguardando Cor',
    'COR_DEFINIDA': 'Cor Definida',
    'MATERIAIS_SOLICITADOS': 'Materiais Solicitados',
    'MATERIAIS_EM_TRANSITO': 'Materiais em Transito',
    'MATERIAIS_RECEBIDOS': 'Materiais Recebidos',
    'PRONTO_EXECUCAO': 'Pronto para Execucao',
  };
  return map[status] || status;
};

const getChecklistValue = (field: string): boolean => {
  if (!selectedPreObra.value) return false;
  return (selectedPreObra.value as any)[field] || false;
};

const getChecklistDateValue = (field: string): string => {
  if (!selectedPreObra.value) return '';
  return (selectedPreObra.value as any)[field] || '';
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

const formatTipo = (tipo: string) => {
  const map: Record<string, string> = {
    'VISITA_TECNICA_AFERICAO': 'VT',
    'REUNIAO_ORIENTATIVA': 'Reuniao',
    'ENVIO_AMOSTRAS': 'Amostras',
    'DEFINICAO_COR': 'Cor',
    'PREPARACAO_CLIENTE': 'Preparacao',
    'ENVIO_MATERIAIS': 'Materiais',
    'CONFIRMACAO_RECEBIMENTO': 'Recebimento',
    'CUSTOM': 'Outro',
  };
  return map[tipo] || tipo;
};

const getTipoClass = (tipo: string) => {
  const map: Record<string, string> = {
    'VISITA_TECNICA_AFERICAO': 'tipo--vt',
    'REUNIAO_ORIENTATIVA': 'tipo--reuniao',
    'ENVIO_AMOSTRAS': 'tipo--amostras',
    'DEFINICAO_COR': 'tipo--cor',
    'PREPARACAO_CLIENTE': 'tipo--preparacao',
    'ENVIO_MATERIAIS': 'tipo--materiais',
    'CONFIRMACAO_RECEBIMENTO': 'tipo--recebimento',
    'CUSTOM': 'tipo--custom',
  };
  return map[tipo] || 'tipo--custom';
};

const getProvIcon = (tipo: string) => {
  const map: Record<string, string> = {
    'MATERIAL': '📦',
    'RECURSO': '👥',
    'EQUIPAMENTO': '🔧',
    'FERRAMENTA': '🛠️',
  };
  return map[tipo] || '📦';
};

const getProvStatusClass = (status: string) => {
  return `prov-card--${status.toLowerCase().replace('_', '-')}`;
};

// Debounce search
let searchTimeout: number;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    loadPreObras();
  }, 300);
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadPreObras(), loadStats(), loadCapacity()]);
});

watch(activeTab, () => {
  // Reload tab data when switching
});

watch(createMode, (newMode) => {
  if (newMode === 'manual' && showCreateModal.value) {
    nextTick(() => {
      loadGoogleMaps();
    });
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

.pre-obra {
  --black: #1a1a1a;
  --white: #FFFFFF;
  --off-white: #f8f8f8;
  --yellow: #FFE566;
  --gold: #c9a962;
  --green: #22c55e;
  --blue: #3b82f6;
  --orange: #f97316;
  --red: #ef4444;
  --purple: #a855f7;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-400: #a3a3a3;
  --gray-600: #525252;

  font-family: 'DM Sans', sans-serif;
  background: #FFFFFF;
  color: #1a1a1a;
  min-height: 100vh;
  padding: 20px;
}

/* Header */
.pre-obra-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-section {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.page-title {
  font-family: 'Syne', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--black);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--gray-600);
  margin: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  border: 2px solid var(--black);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 var(--black);
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--black);
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
  background: var(--white);
  color: var(--black);
}

.btn--gold {
  background: var(--gold);
  color: var(--black);
}

.btn--small {
  padding: 8px 14px;
  font-size: 0.8rem;
  box-shadow: 2px 2px 0 var(--black);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
  box-shadow: 2px 2px 0 var(--black);
}

.btn-icon:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--black);
}

.btn-icon--danger:hover {
  background: var(--red);
  color: white;
}

/* KPI Section */
.kpi-section {
  margin-bottom: 20px;
}

.kpi-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--black);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 160px;
}

.kpi-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--black);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 2px solid var(--black);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--black);
}

.kpi-card--aguardando .kpi-icon { background: #fef3c7; }
.kpi-card--andamento .kpi-icon { background: #dbeafe; }
.kpi-card--concluido .kpi-icon { background: #dcfce7; }
.kpi-card--total .kpi-icon { background: var(--yellow); }

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-value {
  font-family: 'Syne', sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}

.kpi-label {
  font-size: 0.75rem;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Capacity Dashboard */
.capacity-section {
  margin-bottom: 24px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 4px 4px 0 var(--black);
}

.capacity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.capacity-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.capacity-legend {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid var(--black);
}

.legend-color--available { background: var(--gray-200); }
.legend-color--allocated { background: var(--green); }
.legend-color--over { background: var(--red); }

/* Unallocated Projects */
.unallocated-projects {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--gray-100);
  border: 2px solid var(--black);
  border-radius: 8px;
}

.unallocated-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.unallocated-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.unallocated-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--yellow);
  border: 2px solid var(--black);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--black);
  cursor: grab;
  transition: all 0.15s ease;
}

.unallocated-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--black);
}

.unallocated-card:active {
  cursor: grabbing;
}

.unallocated-card__name {
  font-weight: 600;
  font-size: 0.85rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unallocated-card__hours {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.hours-input {
  width: 60px;
  padding: 4px 6px;
  border: 2px solid var(--black);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

/* Capacity Grid - 12 months */
.capacity-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) {
  .capacity-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 800px) {
  .capacity-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .capacity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.capacity-month {
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 2px 2px 0 var(--black);
  transition: all 0.2s ease;
}

.capacity-month:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--black);
}

.capacity-month--over {
  border-color: var(--red);
  background: #fff0f0;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.month-label {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.month-stats {
  font-size: 0.7rem;
  color: var(--gray-600);
}

.month-bar {
  height: 20px;
  background: var(--gray-200);
  border: 2px solid var(--black);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.month-bar__fill {
  height: 100%;
  transition: width 0.3s ease;
}

.month-bar__fill--low { background: #a3e635; }
.month-bar__fill--medium { background: var(--yellow); }
.month-bar__fill--high { background: var(--orange); }
.month-bar__fill--over { background: var(--red); }

.month-percentage {
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

.month-projects {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 100px;
  overflow-y: auto;
}

.month-project {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--gray-100);
  border: 1px solid var(--black);
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.month-project:hover {
  background: var(--red);
  color: white;
}

.month-project__name {
  font-weight: 600;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-project__hours {
  font-weight: 700;
}

/* Main Content */
.pre-obra-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  min-height: calc(100vh - 200px);
}

/* List Panel */
.list-panel {
  background: var(--off-white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--black);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 2px solid var(--black);
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 0.9rem;
  border: 2px solid var(--black);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--black);
  transition: all 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3), 2px 2px 0 var(--black);
}

.list-items {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--white);
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.list-item:hover {
  border-color: var(--black);
  box-shadow: 2px 2px 0 var(--black);
}

.list-item--active {
  background: var(--yellow);
  border-color: var(--black);
  box-shadow: 3px 3px 0 var(--black);
}

.list-item__status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--black);
  flex-shrink: 0;
}

.list-item__status.status--aguardando { background: #fef3c7; }
.list-item__status.status--andamento { background: #dbeafe; }
.list-item__status.status--concluido { background: #dcfce7; }

.list-item__content {
  flex: 1;
  min-width: 0;
}

.list-item__cliente {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item__endereco {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item__progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--green);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--gray-600);
}

.list-empty, .list-loading {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-400);
}

/* Detail Panel */
.detail-panel {
  background: var(--off-white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--black);
  padding: 24px;
  overflow-y: auto;
}

.detail-panel--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-detail {
  text-align: center;
  color: var(--gray-400);
}

.empty-detail__icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

/* Project Info */
.project-info {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--black);
}

.project-info__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-info__title {
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.status-badge {
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid var(--black);
  border-radius: 20px;
  box-shadow: 2px 2px 0 var(--black);
}

.status-badge.status--aguardando { background: #fef3c7; }
.status-badge.status--andamento { background: #dbeafe; }
.status-badge.status--concluido { background: #dcfce7; }

.project-info__address {
  font-size: 0.9rem;
  color: var(--gray-600);
  margin: 0 0 12px 0;
}

.project-info__meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  font-size: 0.85rem;
  color: var(--gray-600);
}

.meta-item strong {
  color: var(--black);
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--black);
  padding-bottom: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  background: var(--gray-100);
  color: var(--black);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  border-color: var(--black);
}

.tab-btn--active {
  background: var(--yellow);
  border-color: var(--black);
  box-shadow: 3px 3px 0 var(--black);
}

.tab-icon {
  font-size: 1.1rem;
}

/* Section Title */
.section-title {
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--black);
}

/* Checklist */
.checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--black);
  cursor: pointer;
  transition: all 0.15s ease;
}

.checklist-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--black);
}

.checklist-item--completed {
  background: #dcfce7;
}

.checklist-item__checkbox {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 6px;
  flex-shrink: 0;
}

.checklist-item--completed .checklist-item__checkbox {
  background: var(--green);
  color: white;
}

.checklist-item__content {
  flex: 1;
}

.checklist-item__title {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
}

.checklist-item__date {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-600);
  margin-top: 2px;
}

.checklist-item__icon {
  font-size: 1.5rem;
}

/* Progress Overview */
.progress-overview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-bar--large {
  flex: 1;
  height: 16px;
  border: 2px solid var(--black);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--black);
}

.progress-percentage {
  font-family: 'Syne', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
}

/* Cronograma */
.cronograma-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cronograma-header .section-title {
  margin: 0;
  border: none;
  padding: 0;
}

.cronograma-actions {
  display: flex;
  gap: 8px;
}

.tarefas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tarefa-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--black);
}

.tarefa-card--completed {
  background: #dcfce7;
  opacity: 0.8;
}

.tarefa-card__number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yellow);
  border: 2px solid var(--black);
  border-radius: 50%;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.tarefa-card__content {
  flex: 1;
}

.tarefa-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tarefa-card__tipo {
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid var(--black);
  border-radius: 4px;
  box-shadow: 2px 2px 0 var(--black);
}

.tipo--vt { background: #dbeafe; }
.tipo--reuniao { background: #e0e7ff; }
.tipo--amostras { background: #fce7f3; }
.tipo--cor { background: #fef3c7; }
.tipo--preparacao { background: #dcfce7; }
.tipo--materiais { background: #fed7aa; }
.tipo--recebimento { background: #d1fae5; }
.tipo--custom { background: var(--gray-100); }

.tarefa-card__status-select {
  padding: 4px 8px;
  font-size: 0.75rem;
  border: 2px solid var(--black);
  border-radius: 4px;
  background: var(--white);
}

.tarefa-card__title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
}

.tarefa-card__meta {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.tarefa-card__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Materiais */
.calculator-widget {
  padding: 24px;
  background: linear-gradient(135deg, var(--yellow) 0%, var(--gold) 100%);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--black);
  margin-bottom: 24px;
}

.calculator-widget__title {
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 16px 0;
}

.calculator-widget__info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.calculator-info-item {
  display: flex;
  flex-direction: column;
}

.calculator-info-item .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.7;
}

.calculator-info-item .value {
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
}

.materiais-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.materiais-header .section-title {
  margin: 0;
  border: none;
  padding: 0;
}

.materiais-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.materiais-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--black);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.materiais-tab:hover {
  border-color: var(--black);
}

.materiais-tab--active {
  background: var(--yellow);
  border-color: var(--black);
  box-shadow: 2px 2px 0 var(--black);
}

.materiais-tab__count {
  padding: 2px 6px;
  background: var(--white);
  border-radius: 10px;
  font-size: 0.7rem;
}

.provisionamentos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prov-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 10px;
  box-shadow: 3px 3px 0 var(--black);
}

.prov-card--pendente { border-left: 4px solid #f59e0b; }
.prov-card--solicitado { border-left: 4px solid #3b82f6; }
.prov-card--em-transito { border-left: 4px solid #8b5cf6; }
.prov-card--recebido { border-left: 4px solid #22c55e; }

.prov-card__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border: 2px solid var(--black);
  border-radius: 8px;
  font-size: 1.2rem;
}

.prov-card__content {
  flex: 1;
}

.prov-card__nome {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.prov-card__quantidade {
  font-size: 0.8rem;
  color: var(--gray-600);
}

.prov-card__badge {
  display: inline-block;
  padding: 2px 6px;
  background: var(--yellow);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  margin-left: 6px;
}

.prov-card__status {
  margin-right: 8px;
}

.prov-status-select {
  padding: 6px 10px;
  font-size: 0.75rem;
  border: 2px solid var(--black);
  border-radius: 6px;
  background: var(--white);
}

/* Cores */
.cores-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cores-header .section-title {
  margin: 0;
  border: none;
  padding: 0;
}

.cor-selecionada {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--black);
  margin-bottom: 24px;
}

.cor-selecionada__badge {
  padding: 6px 12px;
  background: var(--green);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 6px;
}

.cor-selecionada__swatch {
  width: 60px;
  height: 60px;
  border: 2px solid var(--black);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--black);
}

.cor-selecionada__info h4 {
  margin: 0;
  font-size: 1.1rem;
}

.cor-selecionada__info span {
  font-size: 0.8rem;
  color: var(--gray-600);
}

.amostras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.amostra-card {
  padding: 16px;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--black);
}

.amostra-card--selected {
  border-color: var(--green);
  box-shadow: 0 0 0 3px var(--green), 3px 3px 0 var(--black);
}

.amostra-card__swatch {
  width: 100%;
  height: 80px;
  border: 2px solid var(--black);
  border-radius: 8px;
  margin-bottom: 12px;
}

.amostra-card__content {
  margin-bottom: 12px;
}

.amostra-card__nome {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.amostra-card__codigo {
  font-size: 0.8rem;
  color: var(--gray-600);
}

.amostra-card__workflow {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.workflow-step {
  flex: 1;
  padding: 6px 4px;
  text-align: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--black);
  background: var(--gray-200);
  border: 2px solid var(--black);
  border-radius: 4px;
}

.workflow-step--completed {
  background: var(--green);
  color: white;
}

.workflow-step--current {
  background: var(--yellow);
}

.amostra-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.amostra-status-select {
  flex: 1;
  padding: 6px 10px;
  font-size: 0.75rem;
  border: 2px solid var(--black);
  border-radius: 6px;
  background: var(--white);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-400);
}

.empty-state__icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--white);
  border: 3px solid var(--black);
  border-radius: 16px;
  box-shadow: 8px 8px 0 var(--black);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalAppear 0.2s ease;
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
  background: var(--yellow);
  border-bottom: 3px solid var(--black);
}

.modal__header h3 {
  font-family: 'Syne', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
}

.modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border: 2px solid var(--black);
  border-radius: 6px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal__close:hover {
  background: var(--red);
  color: white;
}

.modal__body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 2px solid var(--black);
  background: var(--gray-100);
}

/* Forms */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  font-size: 0.9rem;
  border: 2px solid var(--black);
  border-radius: 8px;
  background: var(--white);
  transition: all 0.15s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.color-input-wrapper {
  display: flex;
  gap: 8px;
}

.color-picker {
  width: 48px;
  height: 42px;
  padding: 2px;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.form-hint {
  font-size: 0.8rem;
  color: #a3a3a3;
  margin-top: 8px;
  font-style: italic;
}

.modal--wide {
  max-width: 600px;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #1a1a1a;
}

.mode-tab {
  flex: 1;
  padding: 12px 16px;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  background: #f5f5f5;
  color: #1a1a1a;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-tab:hover {
  border-color: #1a1a1a;
}

.mode-tab--active {
  background: #FFE566;
  border-color: #1a1a1a;
  box-shadow: 3px 3px 0 #1a1a1a;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}


/* Responsive */
@media (max-width: 900px) {
  .pre-obra-content {
    grid-template-columns: 1fr;
  }

  .list-panel {
    max-height: 300px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Google Maps Autocomplete - must be unscoped to style external elements */
.pac-container {
  z-index: 10000 !important;
  border: 2px solid #1a1a1a !important;
  border-radius: 8px !important;
  box-shadow: 4px 4px 0 #1a1a1a !important;
  font-family: 'DM Sans', sans-serif !important;
  background: white !important;
}

.pac-item {
  padding: 10px 12px !important;
  border-bottom: 1px solid #e5e5e5 !important;
  cursor: pointer !important;
}

.pac-item:hover {
  background: #FFE566 !important;
}

.pac-item-query {
  font-size: 14px !important;
  color: #1a1a1a !important;
}
</style>
