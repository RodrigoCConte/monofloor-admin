<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

// Form data
const formData = ref({
  nomeCliente: '',
  endereco: '',
  detalhes: '',
  previsaoData: '',

  // Metragem individual fields
  metrosPiso: 0,
  metrosParede: 0,
  metrosTeto: 0,
  metrosBancadas: 0,
  metrosEscadas: 0,
  metrosEspeciaisPequenos: 0,
  metrosEspeciaisGrandes: 0,
  metrosPiscina: 0,

  // Valores financeiros
  valorTotal: 0,
  percentualEntrada: 50, // default 50%
  numeroParcelas: 1,
  descontoVista: 0,
  taxaJurosCartao: 0,
  numeroParcelasCartao: 1,

  // Tabela de preços
  precoStelion: 0,
  precoLilit: 0,
});

// Google Maps integration
const distanciaObra = ref<number | null>(null);
const enderecoSuggestions = ref<any[]>([]);
const loadingDistance = ref(false);

// Computed: Metragem Original (sum of all metros fields)
const metragemOriginal = computed(() => {
  return (
    formData.value.metrosPiso +
    formData.value.metrosParede +
    formData.value.metrosTeto +
    formData.value.metrosBancadas +
    formData.value.metrosEscadas +
    formData.value.metrosEspeciaisPequenos +
    formData.value.metrosEspeciaisGrandes +
    formData.value.metrosPiscina
  );
});

// Computed: Metragem Total (original / 0.9 for 10% loss)
const metragemTotal = computed(() => {
  return metragemOriginal.value > 0 ? metragemOriginal.value / 0.9 : 0;
});

// Google Maps Autocomplete (placeholder - needs API key)
const searchAddress = async (query: string) => {
  if (!query || query.length < 3) {
    enderecoSuggestions.value = [];
    return;
  }

  // TODO: Implement Google Places API autocomplete
  // For now, just placeholder
  console.log('Searching address:', query);
};

// Calculate distance from base location
const calculateDistance = async (address: string) => {
  if (!address) return;

  loadingDistance.value = true;
  try {
    // TODO: Implement Google Distance Matrix API
    // For now, placeholder
    console.log('Calculating distance for:', address);

    // Mock distance for now
    distanciaObra.value = Math.floor(Math.random() * 50) + 5;
  } catch (error) {
    console.error('Error calculating distance:', error);
  } finally {
    loadingDistance.value = false;
  }
};

// Run proposal automation
const rodarProposta = async () => {
  console.log('Running proposal with data:', formData.value);
  console.log('Metragem Original:', metragemOriginal.value);
  console.log('Metragem Total:', metragemTotal.value);
  console.log('Distância:', distanciaObra.value);

  // TODO: Implement automation logic (wait for user explanation)
  alert('Função "Rodar Proposta" será implementada após definição da lógica de cálculo');
};

// Reset form
const resetForm = () => {
  formData.value = {
    nomeCliente: '',
    endereco: '',
    detalhes: '',
    previsaoData: '',
    metrosPiso: 0,
    metrosParede: 0,
    metrosTeto: 0,
    metrosBancadas: 0,
    metrosEscadas: 0,
    metrosEspeciaisPequenos: 0,
    metrosEspeciaisGrandes: 0,
    metrosPiscina: 0,
    valorTotal: 0,
    percentualEntrada: 50,
    numeroParcelas: 1,
    descontoVista: 0,
    taxaJurosCartao: 0,
    numeroParcelasCartao: 1,
    precoStelion: 0,
    precoLilit: 0,
  };
  distanciaObra.value = null;
};

onMounted(() => {
  // Initialize Google Maps API if needed
  console.log('Proposals view mounted');
});
</script>

<template>
  <div class="proposals-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gerador de Propostas</h1>
        <p class="page-subtitle">Preencha os campos abaixo para gerar uma proposta automática</p>
      </div>
    </div>

    <!-- Form -->
    <div class="form-container">
      <form @submit.prevent="rodarProposta">
        <!-- Cliente Information -->
        <div class="form-section">
          <h2 class="section-title">Informações do Cliente</h2>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="nomeCliente">Nome do Cliente *</label>
              <input
                id="nomeCliente"
                v-model="formData.nomeCliente"
                type="text"
                required
                placeholder="Digite o nome do cliente"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="endereco">Obra em (Endereço) *</label>
              <input
                id="endereco"
                v-model="formData.endereco"
                type="text"
                required
                placeholder="Digite o endereço da obra"
                @input="searchAddress(formData.endereco)"
                @blur="calculateDistance(formData.endereco)"
              />
              <small v-if="distanciaObra" class="distance-info">
                📍 Distância calculada: {{ distanciaObra }} km
              </small>
              <small v-if="loadingDistance" class="distance-info">
                🔄 Calculando distância...
              </small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="detalhes">Detalhes</label>
              <textarea
                id="detalhes"
                v-model="formData.detalhes"
                rows="3"
                placeholder="Informações adicionais sobre a obra"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="previsaoData">Previsão de Data da Obra *</label>
              <input
                id="previsaoData"
                v-model="formData.previsaoData"
                type="date"
                required
              />
            </div>
          </div>
        </div>

        <!-- Metragem -->
        <div class="form-section">
          <h2 class="section-title">Metragem</h2>

          <div class="form-row">
            <div class="form-group">
              <label for="metrosPiso">Piso (m²)</label>
              <input
                id="metrosPiso"
                v-model.number="formData.metrosPiso"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="metrosParede">Parede (m²)</label>
              <input
                id="metrosParede"
                v-model.number="formData.metrosParede"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="metrosTeto">Teto (m²)</label>
              <input
                id="metrosTeto"
                v-model.number="formData.metrosTeto"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="metrosBancadas">Bancadas (m²)</label>
              <input
                id="metrosBancadas"
                v-model.number="formData.metrosBancadas"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="metrosEscadas">Escadas (m²)</label>
              <input
                id="metrosEscadas"
                v-model.number="formData.metrosEscadas"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="metrosEspeciaisPequenos">Especiais Pequenos (m²)</label>
              <input
                id="metrosEspeciaisPequenos"
                v-model.number="formData.metrosEspeciaisPequenos"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="metrosEspeciaisGrandes">Especiais Grandes (m²)</label>
              <input
                id="metrosEspeciaisGrandes"
                v-model.number="formData.metrosEspeciaisGrandes"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="metrosPiscina">Piscina (m²)</label>
              <input
                id="metrosPiscina"
                v-model.number="formData.metrosPiscina"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Calculated Metragem -->
          <div class="metragem-summary">
            <div class="summary-item">
              <span class="summary-label">Metragem Original (soma):</span>
              <span class="summary-value">{{ metragemOriginal.toFixed(2) }} m²</span>
            </div>
            <div class="summary-item highlight">
              <span class="summary-label">Metragem Total (com 10% perda):</span>
              <span class="summary-value">{{ metragemTotal.toFixed(2) }} m²</span>
            </div>
          </div>
        </div>

        <!-- Valores Financeiros -->
        <div class="form-section">
          <h2 class="section-title">Valores e Condições</h2>

          <div class="form-row">
            <div class="form-group">
              <label for="valorTotal">Valor Total (R$) *</label>
              <input
                id="valorTotal"
                v-model.number="formData.valorTotal"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="percentualEntrada">% de Entrada *</label>
              <input
                id="percentualEntrada"
                v-model.number="formData.percentualEntrada"
                type="number"
                min="0"
                max="100"
                step="1"
                required
                placeholder="50"
              />
            </div>

            <div class="form-group">
              <label for="numeroParcelas">Número de Parcelas do Saldo *</label>
              <input
                id="numeroParcelas"
                v-model.number="formData.numeroParcelas"
                type="number"
                min="1"
                step="1"
                required
                placeholder="1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="descontoVista">Desconto à Vista (%)</label>
              <input
                id="descontoVista"
                v-model.number="formData.descontoVista"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="taxaJurosCartao">Taxa de Juros Cartão (%)</label>
              <input
                id="taxaJurosCartao"
                v-model.number="formData.taxaJurosCartao"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="numeroParcelasCartao">Número de Parcelas Cartão</label>
              <input
                id="numeroParcelasCartao"
                v-model.number="formData.numeroParcelasCartao"
                type="number"
                min="1"
                step="1"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        <!-- Tabela de Preços -->
        <div class="form-section">
          <h2 class="section-title">Valor de Tabela</h2>

          <div class="form-row">
            <div class="form-group">
              <label for="precoStelion">Stelion (R$/m²)</label>
              <input
                id="precoStelion"
                v-model.number="formData.precoStelion"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="precoLilit">Lilit (R$/m²)</label>
              <input
                id="precoLilit"
                v-model.number="formData.precoLilit"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="resetForm">
            Limpar Formulário
          </button>
          <button type="submit" class="btn-primary">
            🚀 RODAR PROPOSTA
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.proposals-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 24px 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #c9a962;
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.distance-info {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.metragem-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.summary-item.highlight {
  border-top: 2px solid #c9a962;
  padding-top: 16px;
  margin-top: 8px;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.summary-item.highlight .summary-label {
  color: #1e293b;
  font-weight: 600;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.summary-item.highlight .summary-value {
  font-size: 20px;
  color: #c9a962;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #c9a962 0%, #d4b86a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(201, 169, 98, 0.4);
}

.btn-secondary {
  background: white;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .proposals-page {
    padding: 16px;
  }

  .form-container {
    padding: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
