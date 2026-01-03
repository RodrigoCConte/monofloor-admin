<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { schedulingApi } from '../api';
import { useToast } from '../composables/useToast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Loading states
const loading = ref(true);
const saving = ref(false);

// Data
const holidays = ref<any[]>([]);

// Filters
const selectedYear = ref(new Date().getFullYear());

// Modals
const showHolidayModal = ref(false);
const editingHoliday = ref<any>(null);

// Form data
const holidayForm = ref({
  date: '',
  name: '',
  description: '',
  type: 'NATIONAL'
});

// Load holidays
const loadHolidays = async () => {
  loading.value = true;
  try {
    const response = await schedulingApi.getHolidays({ year: selectedYear.value });
    holidays.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading holidays:', error);
    toast.error('Erro ao carregar feriados');
  } finally {
    loading.value = false;
  }
};

// Seed holidays for year
const seedHolidays = async () => {
  saving.value = true;
  try {
    await schedulingApi.seedHolidays(selectedYear.value);
    toast.success(`Feriados de ${selectedYear.value} criados com sucesso`);
    await loadHolidays();
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Erro ao criar feriados');
  } finally {
    saving.value = false;
  }
};

// Open modal for new holiday
const openNewHolidayModal = () => {
  editingHoliday.value = null;
  holidayForm.value = {
    date: '',
    name: '',
    description: '',
    type: 'NATIONAL'
  };
  showHolidayModal.value = true;
};

// Open modal for editing
const openEditHolidayModal = (holiday: any) => {
  editingHoliday.value = holiday;
  holidayForm.value = {
    date: new Date(holiday.date).toISOString().split('T')[0] || '',
    name: holiday.name,
    description: holiday.description || '',
    type: holiday.type
  };
  showHolidayModal.value = true;
};

// Save holiday
const saveHoliday = async () => {
  if (!holidayForm.value.date || !holidayForm.value.name) {
    toast.warning('Preencha a data e o nome do feriado');
    return;
  }
  saving.value = true;
  try {
    if (editingHoliday.value) {
      await schedulingApi.updateHoliday(editingHoliday.value.id, holidayForm.value);
      toast.success('Feriado atualizado');
    } else {
      await schedulingApi.createHoliday(holidayForm.value);
      toast.success('Feriado criado');
    }
    showHolidayModal.value = false;
    await loadHolidays();
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Erro ao salvar feriado');
  } finally {
    saving.value = false;
  }
};

// Delete holiday
const deleteHoliday = async (id: string) => {
  if (!confirm('Deseja excluir este feriado?')) return;
  try {
    await schedulingApi.deleteHoliday(id);
    toast.success('Feriado excluido');
    await loadHolidays();
  } catch (error) {
    toast.error('Erro ao excluir feriado');
  }
};

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Get day of week
const getDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
};

// Logout
const logout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(loadHolidays);
</script>

<template>
  <div class="scheduling-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <div class="title-section">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h1>Feriados</h1>
            <p class="subtitle">Gerencie os feriados em que as equipes nao trabalham</p>
          </div>
        </div>
      </div>
      <div class="header-right">
        <router-link to="/" class="btn-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </router-link>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="year-selector">
        <button @click="selectedYear--; loadHolidays()" class="btn-year">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="year-display">{{ selectedYear }}</span>
        <button @click="selectedYear++; loadHolidays()" class="btn-year">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-actions">
        <button @click="seedHolidays" class="btn-seed" :disabled="saving">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Gerar Feriados {{ selectedYear }}
        </button>
        <button @click="openNewHolidayModal" class="btn-add">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Feriado
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Carregando feriados...</p>
    </div>

    <!-- Holidays List -->
    <div v-else class="holidays-grid">
      <div v-if="holidays.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>Nenhum feriado cadastrado para {{ selectedYear }}</p>
        <button @click="seedHolidays" class="btn-seed-empty">
          Gerar Feriados Automaticamente
        </button>
      </div>

      <div v-for="holiday in holidays" :key="holiday.id" class="holiday-card">
        <div class="holiday-date">
          <span class="day">{{ new Date(holiday.date).getDate() }}</span>
          <span class="month">{{ new Date(holiday.date).toLocaleDateString('pt-BR', { month: 'short' }) }}</span>
        </div>
        <div class="holiday-info">
          <h3>{{ holiday.name }}</h3>
          <p class="weekday">{{ getDayOfWeek(holiday.date) }}</p>
          <p v-if="holiday.description" class="description">{{ holiday.description }}</p>
        </div>
        <div class="holiday-type">
          <span :class="['badge', holiday.type.toLowerCase()]">
            {{ holiday.type === 'NATIONAL' ? 'Nacional' : holiday.type === 'STATE' ? 'Estadual' : 'Municipal' }}
          </span>
        </div>
        <div class="holiday-actions">
          <button @click="openEditHolidayModal(holiday)" class="btn-edit" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button @click="deleteHoliday(holiday.id)" class="btn-delete" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Holiday Modal -->
    <div v-if="showHolidayModal" class="modal-overlay" @click.self="showHolidayModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingHoliday ? 'Editar Feriado' : 'Novo Feriado' }}</h2>
          <button @click="showHolidayModal = false" class="btn-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Data</label>
            <input type="date" v-model="holidayForm.date" class="form-input" />
          </div>
          <div class="form-group">
            <label>Nome do Feriado</label>
            <input type="text" v-model="holidayForm.name" class="form-input" placeholder="Ex: Natal" />
          </div>
          <div class="form-group">
            <label>Descricao (opcional)</label>
            <input type="text" v-model="holidayForm.description" class="form-input" placeholder="Descricao adicional" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="holidayForm.type" class="form-input">
              <option value="NATIONAL">Nacional</option>
              <option value="STATE">Estadual</option>
              <option value="MUNICIPAL">Municipal</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showHolidayModal = false" class="btn-cancel">Cancelar</button>
          <button @click="saveHoliday" class="btn-save" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scheduling-page {
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
  padding: 24px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #c9a962 0%, #a88b4a 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper svg {
  width: 24px;
  height: 24px;
  stroke: #0a0a0a;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin: 4px 0 0 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #222;
  color: #fff;
}

.btn-back svg {
  width: 18px;
  height: 18px;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #141414;
  border-radius: 12px;
  border: 1px solid #222;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-year {
  width: 36px;
  height: 36px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-year:hover {
  background: #222;
  color: #fff;
}

.btn-year svg {
  width: 18px;
  height: 18px;
}

.year-display {
  font-size: 24px;
  font-weight: 700;
  color: #c9a962;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.btn-seed, .btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-seed {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #888;
}

.btn-seed:hover:not(:disabled) {
  background: #222;
  color: #fff;
}

.btn-seed:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  background: linear-gradient(135deg, #c9a962 0%, #a88b4a 100%);
  border: none;
  color: #0a0a0a;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-seed svg, .btn-add svg {
  width: 18px;
  height: 18px;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #c9a962;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: #666;
  text-align: center;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  stroke: #444;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 24px;
}

.btn-seed-empty {
  padding: 12px 24px;
  background: linear-gradient(135deg, #c9a962 0%, #a88b4a 100%);
  border: none;
  border-radius: 8px;
  color: #0a0a0a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-seed-empty:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

/* Holidays Grid */
.holidays-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.holiday-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  transition: all 0.2s;
}

.holiday-card:hover {
  border-color: #333;
  transform: translateY(-2px);
}

.holiday-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #1a1a1a;
  border-radius: 8px;
  flex-shrink: 0;
}

.holiday-date .day {
  font-size: 20px;
  font-weight: 700;
  color: #c9a962;
  line-height: 1;
}

.holiday-date .month {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  margin-top: 2px;
}

.holiday-info {
  flex: 1;
  min-width: 0;
}

.holiday-info h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.holiday-info .weekday {
  font-size: 12px;
  color: #888;
  margin: 4px 0 0 0;
  text-transform: capitalize;
}

.holiday-info .description {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0 0;
}

.holiday-type .badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.national {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge.state {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.badge.municipal {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.holiday-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #1a1a1a;
  color: #888;
}

.btn-edit:hover {
  background: #222;
  color: #c9a962;
}

.btn-delete {
  background: #1a1a1a;
  color: #888;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.btn-edit svg, .btn-delete svg {
  width: 16px;
  height: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: #141414;
  border: 1px solid #333;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #222;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  background: #1a1a1a;
  border: none;
  border-radius: 6px;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #222;
  color: #fff;
}

.btn-close svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #c9a962;
}

.form-input::placeholder {
  color: #555;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #222;
}

.btn-cancel, .btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #888;
}

.btn-cancel:hover {
  background: #222;
  color: #fff;
}

.btn-save {
  background: linear-gradient(135deg, #c9a962 0%, #a88b4a 100%);
  border: none;
  color: #0a0a0a;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .scheduling-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .toolbar {
    flex-direction: column;
    gap: 16px;
  }

  .toolbar-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-seed, .btn-add {
    width: 100%;
    justify-content: center;
  }

  .holidays-grid {
    grid-template-columns: 1fr;
  }
}
</style>
