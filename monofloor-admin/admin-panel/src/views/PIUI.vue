<template>
  <div class="piui-module">
    <!-- Header -->
    <header class="module-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="module-title">PIUI</h1>
          <p class="module-subtitle">Gestao de Contratos</p>
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
          v-for="(stage, stageIndex) in contractStages"
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
            <span class="column-count">{{ getStageContracts(stage.id).length }}</span>
          </div>
          <div class="column-value">
            R$ {{ formatCurrency(getStageValue(stage.id)) }}
          </div>
          <div class="column-cards">
            <div
              class="contract-card"
              v-for="contract in getStageContracts(stage.id)"
              :key="contract.id"
              draggable="true"
              @dragstart="handleDragStart($event, contract)"
              @click="openContractPanel(contract)"
            >
              <div class="contract-header">
                <span class="contract-client">{{ contract.project?.cliente }}</span>
                <span class="contract-number" v-if="contract.numero">#{{ contract.numero }}</span>
              </div>
              <div class="contract-value">
                R$ {{ formatCurrency(contract.valorContratado) }}
              </div>
              <div class="contract-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ contract.project?.endereco || 'Sem endereco' }}
              </div>
              <div class="contract-footer">
                <div class="contract-m2" v-if="contract.project?.m2Total">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  {{ contract.project.m2Total }} m2
                </div>
                <div class="contract-parcelas">
                  {{ contract.parcelas?.length || 0 }} parcelas
                </div>
              </div>
              <div class="contract-progress" v-if="contract.parcelas?.length">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getParcelaProgress(contract) + '%' }"></div>
                </div>
                <span class="progress-text">{{ getParcelasPagas(contract) }}/{{ contract.parcelas.length }} pagas</span>
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
          <input type="text" v-model="searchQuery" placeholder="Buscar por cliente, numero..." />
        </div>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Todos os status</option>
          <option v-for="stage in contractStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
        </select>
      </div>
      <div class="list-table">
        <table>
          <thead>
            <tr>
              <th>Numero</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Valor</th>
              <th>M2</th>
              <th>Parcelas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contract in filteredContracts" :key="contract.id" @click="openContractPanel(contract)">
              <td class="number-cell">{{ contract.numero || '-' }}</td>
              <td class="client-cell">
                <span class="client-name">{{ contract.project?.cliente }}</span>
                <span class="client-address">{{ contract.project?.endereco }}</span>
              </td>
              <td>
                <span class="status-badge" :style="{ '--status-color': getStageColor(contract.status) }">
                  {{ getStageLabel(contract.status) }}
                </span>
              </td>
              <td class="value-cell">R$ {{ formatCurrency(contract.valorContratado) }}</td>
              <td>{{ contract.project?.m2Total ? contract.project.m2Total + ' m2' : '-' }}</td>
              <td>
                <div class="parcelas-info">
                  <span>{{ getParcelasPagas(contract) }}/{{ contract.parcelas?.length || 0 }}</span>
                  <div class="mini-progress">
                    <div class="mini-progress-fill" :style="{ width: getParcelaProgress(contract) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td class="action-cell">
                <button class="action-btn" @click.stop="openContractPanel(contract)">
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

    <!-- Parcelas Vencidas Alert -->
    <div class="alert-banner" v-if="stats.parcelasVencidas > 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span><strong>{{ stats.parcelasVencidas }}</strong> parcelas vencidas aguardando pagamento</span>
      <button class="btn-view-vencidas" @click="viewOverdue">Ver todas</button>
    </div>

    <!-- Contract Detail Panel -->
    <Teleport to="body">
      <Transition name="panel">
        <div class="detail-panel-overlay" v-if="selectedContract" @click.self="closeContractPanel">
          <div class="detail-panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>{{ selectedContract.project?.cliente }}</h2>
                <span class="contract-badge" v-if="selectedContract.numero">#{{ selectedContract.numero }}</span>
              </div>
              <button class="close-btn" @click="closeContractPanel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="panel-tabs">
              <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Informacoes</button>
              <button :class="{ active: activeTab === 'parcelas' }" @click="activeTab = 'parcelas'">Parcelas</button>
              <button :class="{ active: activeTab === 'escopo' }" @click="activeTab = 'escopo'">Escopo</button>
            </div>

            <div class="panel-content">
              <!-- Info Tab -->
              <div v-if="activeTab === 'info'" class="tab-content">
                <div class="panel-section">
                  <h3>Status do Contrato</h3>
                  <div class="status-flow">
                    <button
                      v-for="stage in contractStages"
                      :key="stage.id"
                      class="status-btn"
                      :class="{ active: selectedContract.status === stage.id }"
                      :style="{ '--status-color': stage.color }"
                      @click="changeStatus(selectedContract.id, stage.id)"
                    >
                      {{ stage.label }}
                    </button>
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Dados do Contrato</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Numero do Contrato</label>
                      <input type="text" v-model="selectedContract.numero" placeholder="Ex: 2024/001" />
                    </div>
                    <div class="form-group">
                      <label>Valor Contratado</label>
                      <input type="number" v-model="selectedContract.valorContratado" />
                    </div>
                    <div class="form-group">
                      <label>Valor Entrada</label>
                      <input type="number" v-model="selectedContract.valorEntrada" />
                    </div>
                    <div class="form-group">
                      <label>Forma de Pagamento</label>
                      <select v-model="selectedContract.formaPagamento">
                        <option value="">Selecione...</option>
                        <option value="PIX">PIX</option>
                        <option value="BOLETO">Boleto</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="CARTAO">Cartao</option>
                        <option value="FINANCIAMENTO">Financiamento</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Metragens</h3>
                  <div class="form-grid three-cols">
                    <div class="form-group">
                      <label>Piso (m2)</label>
                      <input type="number" v-model="selectedContract.m2Piso" />
                    </div>
                    <div class="form-group">
                      <label>Parede (m2)</label>
                      <input type="number" v-model="selectedContract.m2Parede" />
                    </div>
                    <div class="form-group">
                      <label>Rodape (m2)</label>
                      <input type="number" v-model="selectedContract.m2Rodape" />
                    </div>
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Opcoes Especiais</h3>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="selectedContract.isTelada" />
                      <span class="checkmark"></span>
                      Aplicacao Telada
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="selectedContract.isFaseada" />
                      <span class="checkmark"></span>
                      Aplicacao Faseada
                    </label>
                  </div>
                  <div class="form-group" v-if="selectedContract.isTelada">
                    <label>Detalhes da Tela</label>
                    <textarea v-model="selectedContract.detalheTela" rows="2"></textarea>
                  </div>
                  <div class="form-group" v-if="selectedContract.isFaseada">
                    <label>Detalhes do Faseamento</label>
                    <textarea v-model="selectedContract.detalheFaseamento" rows="2"></textarea>
                  </div>
                </div>
              </div>

              <!-- Parcelas Tab -->
              <div v-if="activeTab === 'parcelas'" class="tab-content">
                <div class="panel-section">
                  <div class="section-header">
                    <h3>Parcelas ({{ selectedContract.parcelas?.length || 0 }})</h3>
                    <button class="btn-small" @click="showGenerateParcelas = true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Gerar Automatico
                    </button>
                  </div>

                  <!-- Generate Parcelas Form -->
                  <Transition name="slide">
                    <div class="generate-form" v-if="showGenerateParcelas">
                      <div class="form-row">
                        <div class="form-group">
                          <label>Qtd. Parcelas</label>
                          <input type="number" v-model="generateConfig.quantidade" min="1" max="36" />
                        </div>
                        <div class="form-group">
                          <label>Valor Entrada</label>
                          <input type="number" v-model="generateConfig.valorEntrada" />
                        </div>
                        <div class="form-group">
                          <label>Data Inicio</label>
                          <input type="date" v-model="generateConfig.dataInicio" />
                        </div>
                      </div>
                      <div class="form-actions">
                        <button class="btn-cancel" @click="showGenerateParcelas = false">Cancelar</button>
                        <button class="btn-generate" @click="generateParcelas">Gerar Parcelas</button>
                      </div>
                    </div>
                  </Transition>

                  <div class="parcelas-list">
                    <div
                      class="parcela-item"
                      v-for="parcela in selectedContract.parcelas"
                      :key="parcela.id"
                      :class="{ pago: parcela.pago, vencido: isVencido(parcela) }"
                    >
                      <div class="parcela-number">
                        {{ parcela.numero === 0 ? 'Entrada' : parcela.numero + 'a' }}
                      </div>
                      <div class="parcela-info">
                        <span class="parcela-descricao">{{ parcela.descricao }}</span>
                        <span class="parcela-vencimento">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {{ formatDate(parcela.vencimento) }}
                        </span>
                      </div>
                      <div class="parcela-valor">
                        R$ {{ formatCurrency(parcela.valor) }}
                      </div>
                      <div class="parcela-status">
                        <span v-if="parcela.pago" class="status-pago">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Pago
                        </span>
                        <button v-else class="btn-pagar" @click="openPayModal(parcela)">
                          Marcar Pago
                        </button>
                      </div>
                      <button class="parcela-delete" @click="deleteParcela(parcela.id)" v-if="!parcela.pago">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div class="empty-state" v-if="!selectedContract.parcelas?.length">
                      <p>Nenhuma parcela cadastrada</p>
                      <button class="btn-add-parcela" @click="showAddParcela = true">Adicionar Parcela</button>
                    </div>
                  </div>

                  <!-- Add Parcela Form -->
                  <div class="add-parcela-form" v-if="showAddParcela">
                    <h4>Nova Parcela</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Valor</label>
                        <input type="number" v-model="newParcela.valor" />
                      </div>
                      <div class="form-group">
                        <label>Vencimento</label>
                        <input type="date" v-model="newParcela.vencimento" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Descricao</label>
                      <input type="text" v-model="newParcela.descricao" placeholder="Ex: 1a Parcela" />
                    </div>
                    <div class="form-actions">
                      <button class="btn-cancel" @click="showAddParcela = false">Cancelar</button>
                      <button class="btn-save" @click="addParcela">Adicionar</button>
                    </div>
                  </div>

                  <button class="btn-add-parcela-inline" @click="showAddParcela = true" v-if="!showAddParcela && selectedContract.parcelas?.length">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Adicionar Parcela Manual
                  </button>
                </div>
              </div>

              <!-- Escopo Tab -->
              <div v-if="activeTab === 'escopo'" class="tab-content">
                <div class="panel-section">
                  <h3>Escopo do Projeto</h3>
                  <div class="escopo-uploads">
                    <div class="escopo-item">
                      <label>Escopo Inicial (PDF/Imagem)</label>
                      <div class="file-upload">
                        <input type="file" @change="uploadEscopo('inicial', $event)" accept=".pdf,image/*" />
                        <div class="upload-placeholder" v-if="!selectedContract.escopoInicialUrl">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>Clique para enviar</span>
                        </div>
                        <div class="file-preview" v-else>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span>Arquivo enviado</span>
                          <a :href="selectedContract.escopoInicialUrl" target="_blank">Ver</a>
                        </div>
                      </div>
                    </div>
                    <div class="escopo-item">
                      <label>Escopo Aprovado (PDF/Imagem)</label>
                      <div class="file-upload">
                        <input type="file" @change="uploadEscopo('aprovado', $event)" accept=".pdf,image/*" />
                        <div class="upload-placeholder" v-if="!selectedContract.escopoAprovadoUrl">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>Clique para enviar</span>
                        </div>
                        <div class="file-preview" v-else>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          <span>Escopo Aprovado</span>
                          <a :href="selectedContract.escopoAprovadoUrl" target="_blank">Ver</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Cores</h3>
                  <div class="tags-input">
                    <div class="tag" v-for="(cor, index) in selectedContract.cores" :key="index">
                      {{ cor }}
                      <button @click="removeColor(index)">x</button>
                    </div>
                    <input type="text" v-model="newColor" @keydown.enter="addColor" placeholder="Adicionar cor..." />
                  </div>
                </div>

                <div class="panel-section">
                  <h3>Materiais</h3>
                  <div class="tags-input">
                    <div class="tag" v-for="(material, index) in selectedContract.materiais" :key="index">
                      {{ material }}
                      <button @click="removeMaterial(index)">x</button>
                    </div>
                    <input type="text" v-model="newMaterial" @keydown.enter="addMaterial" placeholder="Adicionar material..." />
                  </div>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn-save-changes" @click="saveContract">Salvar Alteracoes</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Pay Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div class="modal-overlay" v-if="showPayModal" @click.self="showPayModal = false">
          <div class="modal-content small">
            <div class="modal-header">
              <h2>Confirmar Pagamento</h2>
              <button class="close-btn" @click="showPayModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="pay-summary">
                <span class="pay-label">Parcela</span>
                <span class="pay-value">{{ parcelaToPay?.descricao }}</span>
              </div>
              <div class="pay-summary">
                <span class="pay-label">Valor</span>
                <span class="pay-value highlight">R$ {{ formatCurrency(parcelaToPay?.valor) }}</span>
              </div>
              <div class="form-group">
                <label>Data do Pagamento</label>
                <input type="date" v-model="paymentData.dataPagamento" />
              </div>
              <div class="form-group">
                <label>Comprovante (opcional)</label>
                <input type="text" v-model="paymentData.comprovante" placeholder="URL ou codigo do comprovante" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showPayModal = false">Cancelar</button>
              <button class="btn-confirm-pay" @click="confirmPayment">Confirmar Pagamento</button>
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
interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  descricao?: string;
  pago: boolean;
  dataPagamento?: string;
  comprovante?: string;
}

interface Contract {
  id: string;
  numero?: string;
  valorContratado: number;
  valorEntrada?: number;
  formaPagamento?: string;
  status: string;
  m2Piso?: number;
  m2Parede?: number;
  m2Rodape?: number;
  cores: string[];
  materiais: string[];
  isTelada: boolean;
  isFaseada: boolean;
  detalheTela?: string;
  detalheFaseamento?: string;
  escopoInicialUrl?: string;
  escopoAprovadoUrl?: string;
  parcelas?: Parcela[];
  project?: {
    id: string;
    cliente: string;
    endereco?: string;
    m2Total?: number;
  };
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
const contracts = ref<Contract[]>([]);
const selectedContract = ref<Contract | null>(null);
const activeTab = ref<'info' | 'parcelas' | 'escopo'>('info');
const draggedContract = ref<Contract | null>(null);

const showGenerateParcelas = ref(false);
const showAddParcela = ref(false);
const showPayModal = ref(false);
const parcelaToPay = ref<Parcela | null>(null);

const stats = ref({
  rascunhos: 0,
  aguardandoAprovacao: 0,
  aprovadoInterno: 0,
  enviadoCliente: 0,
  aprovado: 0,
  assinado: 0,
  valorMes: 0,
  contratosMes: 0,
  parcelasVencidas: 0
});

const generateConfig = ref({
  quantidade: 12,
  valorEntrada: 0,
  dataInicio: new Date().toISOString().split('T')[0]
});

const newParcela = ref({
  valor: 0,
  vencimento: '',
  descricao: ''
});

const paymentData = ref({
  dataPagamento: new Date().toISOString().split('T')[0],
  comprovante: ''
});

const newColor = ref('');
const newMaterial = ref('');

// Contract stages
const contractStages: Stage[] = [
  { id: 'DRAFT', label: 'Rascunho', color: '#6b7280' },
  { id: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovacao', color: '#f59e0b' },
  { id: 'APROVADO_INTERNO', label: 'Aprovado Interno', color: '#8b5cf6' },
  { id: 'ENVIADO_CLIENTE', label: 'Enviado ao Cliente', color: '#3b82f6' },
  { id: 'APROVADO', label: 'Aprovado Cliente', color: '#06b6d4' },
  { id: 'ASSINADO', label: 'Assinado', color: '#22c55e' }
];

// Stats cards
const statsCards = computed(() => [
  {
    label: 'Rascunhos',
    value: stats.value.rascunhos,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
      h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
    ]),
    iconClass: 'draft'
  },
  {
    label: 'Aguardando',
    value: stats.value.aguardandoAprovacao,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('polyline', { points: '12 6 12 12 16 14' })
    ]),
    iconClass: 'waiting'
  },
  {
    label: 'Assinados',
    value: stats.value.assinado,
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ]),
    iconClass: 'signed'
  },
  {
    label: 'Valor do Mes',
    value: 'R$ ' + formatCurrency(stats.value.valorMes),
    icon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
    ]),
    iconClass: 'value'
  }
]);

// Computed
const filteredContracts = computed(() => {
  let result = [...contracts.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c =>
      c.project?.cliente?.toLowerCase().includes(query) ||
      c.numero?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }

  return result;
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

function getStageContracts(stageId: string): Contract[] {
  return contracts.value.filter(c => c.status === stageId);
}

function getStageValue(stageId: string): number {
  return getStageContracts(stageId).reduce((sum, c) => sum + (c.valorContratado || 0), 0);
}

function getStageColor(status: string): string {
  return contractStages.find(s => s.id === status)?.color || '#6b7280';
}

function getStageLabel(status: string): string {
  return contractStages.find(s => s.id === status)?.label || status;
}

function getParcelasPagas(contract: Contract): number {
  return contract.parcelas?.filter(p => p.pago).length || 0;
}

function getParcelaProgress(contract: Contract): number {
  if (!contract.parcelas?.length) return 0;
  return (getParcelasPagas(contract) / contract.parcelas.length) * 100;
}

function isVencido(parcela: Parcela): boolean {
  if (parcela.pago) return false;
  return new Date(parcela.vencimento) < new Date();
}

// Drag & Drop
function handleDragStart(event: DragEvent, contract: Contract) {
  draggedContract.value = contract;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

async function handleDrop(event: DragEvent, stageId: string) {
  event.preventDefault();
  if (draggedContract.value && draggedContract.value.status !== stageId) {
    await changeStatus(draggedContract.value.id, stageId);
  }
  draggedContract.value = null;
}

// API Calls
async function fetchStats() {
  try {
    const response = await fetch('/api/admin/piui/stats');
    const data = await response.json();
    if (data.success) {
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function fetchContracts() {
  loading.value = true;
  try {
    const response = await fetch('/api/admin/piui');
    const data = await response.json();
    if (data.success) {
      contracts.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching contracts:', error);
  } finally {
    loading.value = false;
  }
}

async function saveContract() {
  if (!selectedContract.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/${selectedContract.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedContract.value)
    });
    const data = await response.json();
    if (data.success) {
      const index = contracts.value.findIndex(c => c.id === selectedContract.value!.id);
      if (index !== -1) {
        contracts.value[index] = { ...contracts.value[index], ...data.data };
      }
      closeContractPanel();
    }
  } catch (error) {
    console.error('Error saving contract:', error);
  } finally {
    loading.value = false;
  }
}

async function changeStatus(contractId: string, newStatus: string) {
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/${contractId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();
    if (data.success) {
      const contract = contracts.value.find(c => c.id === contractId);
      if (contract) {
        contract.status = newStatus;
      }
      if (selectedContract.value?.id === contractId) {
        selectedContract.value.status = newStatus;
      }
      await fetchStats();
    }
  } catch (error) {
    console.error('Error changing status:', error);
  } finally {
    loading.value = false;
  }
}

async function generateParcelas() {
  if (!selectedContract.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/${selectedContract.value.id}/gerar-parcelas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantidadeParcelas: generateConfig.value.quantidade,
        valorEntrada: generateConfig.value.valorEntrada,
        dataInicio: generateConfig.value.dataInicio
      })
    });
    const data = await response.json();
    if (data.success) {
      selectedContract.value.parcelas = data.data;
      showGenerateParcelas.value = false;
    }
  } catch (error) {
    console.error('Error generating parcelas:', error);
  } finally {
    loading.value = false;
  }
}

async function addParcela() {
  if (!selectedContract.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/${selectedContract.value.id}/parcelas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newParcela.value)
    });
    const data = await response.json();
    if (data.success) {
      if (!selectedContract.value.parcelas) {
        selectedContract.value.parcelas = [];
      }
      selectedContract.value.parcelas.push(data.data);
      showAddParcela.value = false;
      newParcela.value = { valor: 0, vencimento: '', descricao: '' };
    }
  } catch (error) {
    console.error('Error adding parcela:', error);
  } finally {
    loading.value = false;
  }
}

async function deleteParcela(parcelaId: string) {
  if (!confirm('Tem certeza que deseja excluir esta parcela?')) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/parcelas/${parcelaId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success && selectedContract.value?.parcelas) {
      selectedContract.value.parcelas = selectedContract.value.parcelas.filter(p => p.id !== parcelaId);
    }
  } catch (error) {
    console.error('Error deleting parcela:', error);
  } finally {
    loading.value = false;
  }
}

function openPayModal(parcela: Parcela) {
  parcelaToPay.value = parcela;
  paymentData.value = {
    dataPagamento: new Date().toISOString().split('T')[0],
    comprovante: ''
  };
  showPayModal.value = true;
}

async function confirmPayment() {
  if (!parcelaToPay.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/admin/piui/parcelas/${parcelaToPay.value.id}/pagar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData.value)
    });
    const data = await response.json();
    if (data.success && selectedContract.value?.parcelas) {
      const parcela = selectedContract.value.parcelas.find(p => p.id === parcelaToPay.value!.id);
      if (parcela) {
        parcela.pago = true;
        parcela.dataPagamento = paymentData.value.dataPagamento;
      }
      showPayModal.value = false;
      await fetchStats();
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
  } finally {
    loading.value = false;
  }
}

function addColor() {
  if (newColor.value && selectedContract.value) {
    if (!selectedContract.value.cores) {
      selectedContract.value.cores = [];
    }
    selectedContract.value.cores.push(newColor.value);
    newColor.value = '';
  }
}

function removeColor(index: number) {
  if (selectedContract.value?.cores) {
    selectedContract.value.cores.splice(index, 1);
  }
}

function addMaterial() {
  if (newMaterial.value && selectedContract.value) {
    if (!selectedContract.value.materiais) {
      selectedContract.value.materiais = [];
    }
    selectedContract.value.materiais.push(newMaterial.value);
    newMaterial.value = '';
  }
}

function removeMaterial(index: number) {
  if (selectedContract.value?.materiais) {
    selectedContract.value.materiais.splice(index, 1);
  }
}

function uploadEscopo(tipo: 'inicial' | 'aprovado', event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length && selectedContract.value) {
    // TODO: Implement file upload
    console.log('Upload file:', tipo, input.files[0]);
  }
}

function openContractPanel(contract: Contract) {
  selectedContract.value = { ...contract };
  activeTab.value = 'info';
}

function closeContractPanel() {
  selectedContract.value = null;
  showGenerateParcelas.value = false;
  showAddParcela.value = false;
}

function viewOverdue() {
  filterStatus.value = '';
  viewMode.value = 'list';
  // Could implement specific overdue filter
}

// Lifecycle
onMounted(() => {
  fetchStats();
  fetchContracts();
});
</script>

<style scoped>
.piui-module {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
  color: #e5e5e5;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header */
.module-header {
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
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
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #8b5cf6;
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

.stat-icon.draft { background: rgba(107, 114, 128, 0.15); color: #6b7280; }
.stat-icon.waiting { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.stat-icon.signed { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.stat-icon.value { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

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

.contract-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.contract-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.contract-client {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.contract-number {
  font-size: 11px;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.contract-value {
  font-size: 16px;
  font-weight: 700;
  color: #8b5cf6;
  margin-bottom: 10px;
}

.contract-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.contract-info svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.contract-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.contract-m2 {
  display: flex;
  align-items: center;
  gap: 4px;
}

.contract-m2 svg {
  width: 12px;
  height: 12px;
}

.contract-progress {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #22c55e);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #666;
}

/* List View */
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
  min-width: 200px;
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
  background: rgba(139, 92, 246, 0.05);
}

.number-cell {
  font-family: monospace;
  color: #8b5cf6;
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

.value-cell {
  font-weight: 600;
  color: #8b5cf6;
}

.parcelas-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-progress {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
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

/* Alert Banner */
.alert-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
  z-index: 50;
  animation: slideUp 0.3s ease-out;
}

.alert-banner svg {
  width: 20px;
  height: 20px;
}

.btn-view-vencidas {
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.2);
  border: none;
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view-vencidas:hover {
  background: rgba(239, 68, 68, 0.3);
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
  width: 600px;
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

.panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.contract-badge {
  font-size: 13px;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
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
  color: #8b5cf6;
}

.panel-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #8b5cf6;
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
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  color: #8b5cf6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small svg {
  width: 14px;
  height: 14px;
}

.btn-small:hover {
  background: rgba(139, 92, 246, 0.25);
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-grid.three-cols {
  grid-template-columns: repeat(3, 1fr);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
}

.form-group select option {
  background: #1a1a1a;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.checkbox-group {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
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
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  color: #fff;
  font-size: 12px;
}

/* Generate Parcelas Form */
.generate-form {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
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

.btn-generate,
.btn-save {
  padding: 8px 16px;
  background: #8b5cf6;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-generate:hover,
.btn-save:hover {
  background: #9d6ffa;
}

/* Parcelas List */
.parcelas-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parcela-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.parcela-item.pago {
  opacity: 0.6;
}

.parcela-item.vencido {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.parcela-number {
  width: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #8b5cf6;
}

.parcela-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.parcela-descricao {
  font-size: 14px;
  color: #fff;
}

.parcela-vencimento {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.parcela-vencimento svg {
  width: 12px;
  height: 12px;
}

.parcela-valor {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  min-width: 100px;
  text-align: right;
}

.parcela-status {
  min-width: 100px;
}

.status-pago {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #22c55e;
}

.status-pago svg {
  width: 14px;
  height: 14px;
}

.btn-pagar {
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #22c55e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-pagar:hover {
  background: rgba(34, 197, 94, 0.25);
}

.parcela-delete {
  background: transparent;
  border: none;
  padding: 6px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.parcela-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.parcela-delete svg {
  width: 16px;
  height: 16px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #555;
}

.empty-state p {
  margin-bottom: 16px;
}

.btn-add-parcela {
  padding: 10px 20px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #8b5cf6;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-parcela:hover {
  background: rgba(139, 92, 246, 0.25);
}

.add-parcela-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.add-parcela-form h4 {
  font-size: 14px;
  color: #fff;
  margin: 0 0 12px 0;
}

.btn-add-parcela-inline {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  transition: all 0.2s ease;
}

.btn-add-parcela-inline svg {
  width: 16px;
  height: 16px;
}

.btn-add-parcela-inline:hover {
  border-color: rgba(139, 92, 246, 0.3);
  color: #8b5cf6;
}

/* Escopo */
.escopo-uploads {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.escopo-item label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.file-upload {
  position: relative;
}

.file-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder,
.file-preview {
  padding: 24px;
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.upload-placeholder:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.upload-placeholder svg,
.file-preview svg {
  width: 32px;
  height: 32px;
  color: #666;
}

.upload-placeholder span,
.file-preview span {
  font-size: 13px;
  color: #666;
}

.file-preview {
  border-style: solid;
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.file-preview svg {
  color: #22c55e;
}

.file-preview a {
  color: #8b5cf6;
  text-decoration: none;
  font-size: 13px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 6px;
  font-size: 13px;
  color: #8b5cf6;
}

.tag button {
  background: none;
  border: none;
  color: #8b5cf6;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.tags-input input {
  flex: 1;
  min-width: 120px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.tags-input input::placeholder {
  color: #555;
}

.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-save-changes {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-changes:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
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

.modal-content.small {
  max-width: 360px;
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

.pay-summary {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pay-label {
  color: #888;
  font-size: 14px;
}

.pay-value {
  color: #fff;
  font-size: 14px;
}

.pay-value.highlight {
  font-size: 18px;
  font-weight: 700;
  color: #22c55e;
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

.btn-confirm-pay {
  padding: 10px 20px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm-pay:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
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
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
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

  .form-grid,
  .form-grid.three-cols {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .escopo-uploads {
    grid-template-columns: 1fr;
  }

  .alert-banner {
    left: 20px;
    right: 20px;
    transform: none;
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
}
</style>
