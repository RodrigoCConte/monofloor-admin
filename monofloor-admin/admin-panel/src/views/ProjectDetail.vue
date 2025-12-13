<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { projectsApi, applicatorsApi } from '../api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const project = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('info');
const editMode = ref(false);

// Form data for editing
const formData = ref({
  title: '',
  cliente: '',
  endereco: '',
  status: '',
  estimatedHours: null as number | null,
  consultor: '',
  material: '',
  cor: '',
  isNightShift: false,
});

// Team management
const team = ref<any[]>([]);
const loadingTeam = ref(false);
const showAddMemberModal = ref(false);
const availableApplicators = ref<any[]>([]);
const loadingApplicators = ref(false);
const selectedApplicator = ref('');
const selectedRole = ref('APLICADOR');
const addingMember = ref(false);
const removingMember = ref<string | null>(null);

// Check-ins and Reports
const checkins = ref<any[]>([]);
const reports = ref<any[]>([]);
const loadingCheckins = ref(false);
const loadingReports = ref(false);

// Night Shift
const nightShiftInvites = ref<any[]>([]);
const loadingInvites = ref(false);
const showInviteModal = ref(false);
const selectedInvitees = ref<string[]>([]);
const sendingInvites = ref(false);
const nightShiftConfig = ref({
  slots: 10,
  startDate: '',
  endDate: '',
});
const inviteCounts = ref({
  pending: 0,
  accepted: 0,
  declined: 0,
  expired: 0,
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadProject = async () => {
  loading.value = true;
  try {
    const response = await projectsApi.getById(route.params.id as string);
    project.value = response.data.data;

    // Populate form data
    formData.value = {
      title: project.value.title || '',
      cliente: project.value.cliente || '',
      endereco: project.value.endereco || '',
      status: project.value.status || 'EM_EXECUCAO',
      estimatedHours: project.value.estimatedHours,
      consultor: project.value.consultor || '',
      material: project.value.material || '',
      cor: project.value.cor || '',
      isNightShift: project.value.isNightShift || false,
    };

    // Set team from response
    team.value = project.value.team || [];

    // Set night shift config
    nightShiftConfig.value = {
      slots: project.value.nightShiftSlots || 10,
      startDate: project.value.nightShiftStart ? project.value.nightShiftStart.split('T')[0] : '',
      endDate: project.value.nightShiftEnd ? project.value.nightShiftEnd.split('T')[0] : '',
    };
  } catch (error) {
    console.error('Error loading project:', error);
    router.push('/projects');
  } finally {
    loading.value = false;
  }
};

const saveProject = async () => {
  saving.value = true;
  try {
    await projectsApi.update(route.params.id as string, formData.value);
    await loadProject();
    editMode.value = false;
  } catch (error: any) {
    alert('Erro ao salvar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    saving.value = false;
  }
};

const cancelEdit = () => {
  editMode.value = false;
  // Reset form data
  if (project.value) {
    formData.value = {
      title: project.value.title || '',
      cliente: project.value.cliente || '',
      endereco: project.value.endereco || '',
      status: project.value.status || 'EM_EXECUCAO',
      estimatedHours: project.value.estimatedHours,
      consultor: project.value.consultor || '',
      material: project.value.material || '',
      cor: project.value.cor || '',
      isNightShift: project.value.isNightShift || false,
    };
  }
};

const loadTeam = async () => {
  loadingTeam.value = true;
  try {
    const response = await projectsApi.getTeam(route.params.id as string);
    team.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading team:', error);
  } finally {
    loadingTeam.value = false;
  }
};

const loadAvailableApplicators = async () => {
  loadingApplicators.value = true;
  try {
    const response = await applicatorsApi.getAll({ status: 'APPROVED' });
    // Filter out already assigned members
    const assignedIds = team.value.map((m: any) => m.id);
    availableApplicators.value = (response.data.data || []).filter(
      (a: any) => !assignedIds.includes(a.id)
    );
  } catch (error) {
    console.error('Error loading applicators:', error);
  } finally {
    loadingApplicators.value = false;
  }
};

const openAddMemberModal = async () => {
  showAddMemberModal.value = true;
  selectedApplicator.value = '';
  selectedRole.value = 'APLICADOR';
  await loadAvailableApplicators();
};

const addTeamMember = async () => {
  if (!selectedApplicator.value) return;

  addingMember.value = true;
  try {
    await projectsApi.addTeamMember(
      route.params.id as string,
      selectedApplicator.value,
      selectedRole.value
    );
    await loadTeam();
    showAddMemberModal.value = false;
  } catch (error: any) {
    alert('Erro ao adicionar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    addingMember.value = false;
  }
};

const removeTeamMember = async (userId: string) => {
  if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;

  removingMember.value = userId;
  try {
    await projectsApi.removeTeamMember(route.params.id as string, userId);
    await loadTeam();
  } catch (error: any) {
    alert('Erro ao remover: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    removingMember.value = null;
  }
};

const loadCheckins = async () => {
  loadingCheckins.value = true;
  try {
    const response = await projectsApi.getCheckins(route.params.id as string);
    checkins.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading checkins:', error);
  } finally {
    loadingCheckins.value = false;
  }
};

const loadReports = async () => {
  loadingReports.value = true;
  try {
    const response = await projectsApi.getReports(route.params.id as string);
    reports.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading reports:', error);
  } finally {
    loadingReports.value = false;
  }
};

// Night Shift Functions
const loadNightShiftInvites = async () => {
  loadingInvites.value = true;
  try {
    const response = await projectsApi.getNightShiftInvites(route.params.id as string);
    nightShiftInvites.value = response.data.data || [];
    inviteCounts.value = {
      pending: response.data.meta?.pending || 0,
      accepted: response.data.meta?.accepted || 0,
      declined: response.data.meta?.declined || 0,
      expired: response.data.meta?.expired || 0,
    };
  } catch (error) {
    console.error('Error loading invites:', error);
  } finally {
    loadingInvites.value = false;
  }
};

const saveNightShiftConfig = async () => {
  try {
    await projectsApi.configureNightShift(route.params.id as string, {
      slots: nightShiftConfig.value.slots,
      startDate: nightShiftConfig.value.startDate || undefined,
      endDate: nightShiftConfig.value.endDate || undefined,
    });
    await loadProject();
    alert('Configuracao de turno noturno salva!');
  } catch (error: any) {
    alert('Erro ao salvar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  }
};

const openInviteModal = async () => {
  showInviteModal.value = true;
  selectedInvitees.value = [];
  await loadAvailableApplicators();
  // Filter out users who already have invites
  const invitedIds = nightShiftInvites.value.map((i: any) => i.userId);
  availableApplicators.value = availableApplicators.value.filter(
    (a: any) => !invitedIds.includes(a.id)
  );
};

const toggleInvitee = (userId: string) => {
  const index = selectedInvitees.value.indexOf(userId);
  if (index === -1) {
    selectedInvitees.value.push(userId);
  } else {
    selectedInvitees.value.splice(index, 1);
  }
};

const sendInvites = async () => {
  if (selectedInvitees.value.length === 0) return;

  sendingInvites.value = true;
  try {
    await projectsApi.sendNightShiftInvites(route.params.id as string, selectedInvitees.value);
    await loadNightShiftInvites();
    showInviteModal.value = false;
  } catch (error: any) {
    alert('Erro ao enviar convites: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    sendingInvites.value = false;
  }
};

const cancelInvite = async (inviteId: string) => {
  if (!confirm('Cancelar este convite?')) return;

  try {
    await projectsApi.cancelNightShiftInvite(route.params.id as string, inviteId);
    await loadNightShiftInvites();
  } catch (error: any) {
    alert('Erro ao cancelar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  }
};

const getInviteStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'var(--accent-orange)';
    case 'ACCEPTED': return 'var(--accent-green)';
    case 'DECLINED': return 'var(--accent-red)';
    case 'EXPIRED': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getInviteStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pendente';
    case 'ACCEPTED': return 'Aceito';
    case 'DECLINED': return 'Recusado';
    case 'EXPIRED': return 'Expirado';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'var(--accent-green)';
    case 'AGUARDANDO_INICIO': return 'var(--accent-blue)';
    case 'PAUSADO': return 'var(--accent-orange)';
    case 'CONCLUIDO': return 'var(--text-tertiary)';
    case 'CANCELADO': return 'var(--accent-red)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'EM_EXECUCAO': return 'Em Execucao';
    case 'AGUARDANDO_INICIO': return 'Aguardando';
    case 'PAUSADO': return 'Pausado';
    case 'CONCLUIDO': return 'Concluido';
    case 'CANCELADO': return 'Cancelado';
    default: return status;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'LIDER': return 'Lider';
    case 'APLICADOR': return 'Aplicador';
    default: return role;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatHours = (hours: number) => {
  return hours?.toFixed(1) || '0';
};

const progressPercent = computed(() => {
  if (!project.value?.estimatedHours || project.value.estimatedHours === 0) return 0;
  return Math.min(100, (project.value.workedHours / project.value.estimatedHours) * 100);
});

// Load data when tab changes
const changeTab = async (tab: string) => {
  activeTab.value = tab;
  if (tab === 'team' && team.value.length === 0) {
    await loadTeam();
  } else if (tab === 'checkins' && checkins.value.length === 0) {
    await loadCheckins();
  } else if (tab === 'reports' && reports.value.length === 0) {
    await loadReports();
  } else if (tab === 'nightshift' && nightShiftInvites.value.length === 0 && project.value?.isNightShift) {
    await loadNightShiftInvites();
  }
};

onMounted(async () => {
  await loadProject();
  // Auto-load night shift invites if project is night shift
  if (project.value?.isNightShift) {
    await loadNightShiftInvites();
  }
});
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>
        <router-link to="/applicators" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Aplicadores
        </router-link>
        <router-link to="/projects" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projetos
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            {{ authStore.user?.name?.charAt(0) || 'A' }}
          </div>
          <span class="user-name">{{ authStore.user?.name }}</span>
        </div>
        <button @click="logout" class="logout-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </header>

    <main class="main">
      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando projeto...</span>
      </div>

      <!-- Project Content -->
      <template v-else-if="project">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <router-link to="/projects" class="breadcrumb-link">Projetos</router-link>
          <svg class="breadcrumb-separator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="breadcrumb-current">{{ project.title }}</span>
        </div>

        <!-- Project Header -->
        <div class="project-header">
          <div class="project-info">
            <h1>{{ project.title }}</h1>
            <div class="project-meta">
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(project.status) + '20',
                  color: getStatusColor(project.status),
                  borderColor: getStatusColor(project.status) + '40'
                }"
              >
                {{ getStatusLabel(project.status) }}
              </span>
              <span v-if="project.isNightShift" class="night-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Noturno
              </span>
              <span v-if="project.cliente" class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ project.cliente }}
              </span>
            </div>
          </div>
          <div class="project-actions">
            <button v-if="!editMode" @click="editMode = true" class="btn btn-primary">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <template v-else>
              <button @click="cancelEdit" class="btn btn-secondary">Cancelar</button>
              <button @click="saveProject" class="btn btn-primary" :disabled="saving">
                <div v-if="saving" class="btn-spinner"></div>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </template>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'info' }"
            @click="changeTab('info')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Informacoes
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'team' }"
            @click="changeTab('team')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Equipe ({{ team.length }})
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'checkins' }"
            @click="changeTab('checkins')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Check-ins
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'reports' }"
            @click="changeTab('reports')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Relatorios
          </button>
          <button
            v-if="project.isNightShift"
            class="tab tab-nightshift"
            :class="{ active: activeTab === 'nightshift' }"
            @click="changeTab('nightshift')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Turno Noturno
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Info Tab -->
          <div v-if="activeTab === 'info'" class="info-tab">
            <div class="info-grid">
              <!-- Basic Data Card -->
              <div class="info-card">
                <h3>Dados Basicos</h3>
                <div class="info-fields">
                  <div class="field">
                    <label>Titulo</label>
                    <input
                      v-if="editMode"
                      v-model="formData.title"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.title }}</span>
                  </div>
                  <div class="field">
                    <label>Cliente</label>
                    <input
                      v-if="editMode"
                      v-model="formData.cliente"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.cliente || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Endereco</label>
                    <input
                      v-if="editMode"
                      v-model="formData.endereco"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.endereco || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Status</label>
                    <select
                      v-if="editMode"
                      v-model="formData.status"
                      class="input"
                    >
                      <option value="EM_EXECUCAO">Em Execucao</option>
                      <option value="PAUSADO">Pausado</option>
                      <option value="CONCLUIDO">Concluido</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                    <span v-else class="field-value">{{ getStatusLabel(project.status) }}</span>
                  </div>
                  <div class="field field-toggle">
                    <label>Turno Noturno</label>
                    <label v-if="editMode" class="toggle">
                      <input type="checkbox" v-model="formData.isNightShift" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span v-else class="field-value">{{ project.isNightShift ? 'Sim' : 'Nao' }}</span>
                  </div>
                </div>
              </div>

              <!-- Measurements Card -->
              <div class="info-card">
                <h3>Metragens</h3>
                <div class="measurements-grid">
                  <div class="measurement">
                    <div class="measurement-icon m2-total">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Total?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Total</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m2-piso">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Piso?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Piso</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m2-parede">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Parede?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Parede</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m2-teto">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.m2Teto?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m² Teto</span>
                    </div>
                  </div>
                  <div class="measurement">
                    <div class="measurement-icon m-rodape">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                    <div class="measurement-content">
                      <span class="measurement-value">{{ project.mRodape?.toLocaleString() || 0 }}</span>
                      <span class="measurement-label">m Rodape</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hours Card -->
              <div class="info-card">
                <h3>Horas</h3>
                <div class="hours-content">
                  <div class="hours-progress">
                    <div class="hours-bar">
                      <div
                        class="hours-bar-fill"
                        :style="{ width: progressPercent + '%' }"
                      ></div>
                    </div>
                    <div class="hours-numbers">
                      <span class="hours-worked">{{ formatHours(project.workedHours) }}h trabalhadas</span>
                      <span class="hours-estimated">
                        de {{ formData.estimatedHours || project.estimatedHours || '?' }}h estimadas
                      </span>
                    </div>
                  </div>
                  <div class="field" v-if="editMode">
                    <label>Horas Estimadas</label>
                    <input
                      v-model.number="formData.estimatedHours"
                      type="number"
                      step="0.5"
                      min="0"
                      class="input"
                      placeholder="Ex: 40"
                    />
                  </div>
                  <div class="progress-percent">
                    {{ progressPercent.toFixed(0) }}% concluido
                  </div>
                </div>
              </div>

              <!-- Other Info Card -->
              <div class="info-card">
                <h3>Outros</h3>
                <div class="info-fields">
                  <div class="field">
                    <label>Consultor</label>
                    <input
                      v-if="editMode"
                      v-model="formData.consultor"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.consultor || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Material</label>
                    <input
                      v-if="editMode"
                      v-model="formData.material"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.material || '-' }}</span>
                  </div>
                  <div class="field">
                    <label>Cor</label>
                    <input
                      v-if="editMode"
                      v-model="formData.cor"
                      type="text"
                      class="input"
                    />
                    <span v-else class="field-value">{{ project.cor || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Tab -->
          <div v-if="activeTab === 'team'" class="team-tab">
            <div class="team-header">
              <h3>Equipe do Projeto</h3>
              <button @click="openAddMemberModal" class="btn btn-primary">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Aplicador
              </button>
            </div>

            <div v-if="loadingTeam" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando equipe...</span>
            </div>

            <div v-else-if="team.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>Nenhum membro na equipe</p>
              <span>Adicione aplicadores ao projeto</span>
            </div>

            <div v-else class="team-table">
              <table>
                <thead>
                  <tr>
                    <th>Aplicador</th>
                    <th>Cargo</th>
                    <th>Horas</th>
                    <th>Desde</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in team" :key="member.id">
                    <td>
                      <div class="member-info">
                        <div class="member-avatar">
                          {{ member.name?.charAt(0) || '?' }}
                        </div>
                        <div class="member-details">
                          <span class="member-name">{{ member.name }}</span>
                          <span class="member-username">@{{ member.username }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="role-badge" :class="member.projectRole?.toLowerCase()">
                        {{ getRoleLabel(member.projectRole) }}
                      </span>
                    </td>
                    <td>{{ formatHours(member.hoursOnProject) }}h</td>
                    <td>{{ formatDate(member.assignedAt) }}</td>
                    <td>
                      <button
                        class="remove-btn"
                        @click="removeTeamMember(member.id)"
                        :disabled="removingMember === member.id"
                        title="Remover da equipe"
                      >
                        <div v-if="removingMember === member.id" class="btn-spinner-small"></div>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Check-ins Tab -->
          <div v-if="activeTab === 'checkins'" class="checkins-tab">
            <h3>Historico de Check-ins</h3>

            <div v-if="loadingCheckins" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando check-ins...</span>
            </div>

            <div v-else-if="checkins.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>Nenhum check-in registrado</p>
            </div>

            <div v-else class="checkins-list">
              <div v-for="checkin in checkins" :key="checkin.id" class="checkin-card">
                <div class="checkin-user">
                  <div class="user-avatar-small">
                    {{ checkin.user?.name?.charAt(0) || '?' }}
                  </div>
                  <span class="user-name">{{ checkin.user?.name }}</span>
                </div>
                <div class="checkin-times">
                  <div class="checkin-time">
                    <span class="time-label">Entrada:</span>
                    <span class="time-value">{{ formatDate(checkin.checkinAt) }}</span>
                  </div>
                  <div v-if="checkin.checkoutAt" class="checkin-time">
                    <span class="time-label">Saida:</span>
                    <span class="time-value">{{ formatDate(checkin.checkoutAt) }}</span>
                  </div>
                  <div v-else class="checkin-active">
                    <span class="active-badge">Em andamento</span>
                  </div>
                </div>
                <div v-if="checkin.hoursWorked" class="checkin-hours">
                  {{ formatHours(checkin.hoursWorked) }}h
                </div>
              </div>
            </div>
          </div>

          <!-- Reports Tab -->
          <div v-if="activeTab === 'reports'" class="reports-tab">
            <h3>Relatorios do Projeto</h3>

            <div v-if="loadingReports" class="loading-inline">
              <div class="loading-spinner-small"></div>
              <span>Carregando relatorios...</span>
            </div>

            <div v-else-if="reports.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Nenhum relatorio registrado</p>
            </div>

            <div v-else class="reports-list">
              <div v-for="report in reports" :key="report.id" class="report-card">
                <div class="report-header">
                  <div class="report-user">
                    <div class="user-avatar-small">
                      {{ report.user?.name?.charAt(0) || '?' }}
                    </div>
                    <span>{{ report.user?.name }}</span>
                  </div>
                  <span class="report-date">{{ formatDate(report.reportDate) }}</span>
                </div>
                <div v-if="report.aiSummary" class="report-summary">
                  {{ report.aiSummary }}
                </div>
                <div v-if="report.photos?.length" class="report-photos">
                  <span>{{ report.photos.length }} foto(s)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Night Shift Tab -->
          <div v-if="activeTab === 'nightshift'" class="nightshift-tab">
            <!-- Night Shift Config -->
            <div class="nightshift-config">
              <h3>Configuracao do Turno Noturno</h3>
              <div class="config-grid">
                <div class="field">
                  <label>Vagas</label>
                  <input
                    v-model.number="nightShiftConfig.slots"
                    type="number"
                    min="1"
                    class="input"
                  />
                </div>
                <div class="field">
                  <label>Data Inicio</label>
                  <input
                    v-model="nightShiftConfig.startDate"
                    type="date"
                    class="input"
                  />
                </div>
                <div class="field">
                  <label>Data Fim</label>
                  <input
                    v-model="nightShiftConfig.endDate"
                    type="date"
                    class="input"
                  />
                </div>
                <div class="config-action">
                  <button @click="saveNightShiftConfig" class="btn btn-primary">
                    Salvar Configuracao
                  </button>
                </div>
              </div>
            </div>

            <!-- Status Summary -->
            <div class="invite-summary">
              <div class="summary-card">
                <span class="summary-value summary-accepted">{{ inviteCounts.accepted }}</span>
                <span class="summary-label">Aceitos</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-pending">{{ inviteCounts.pending }}</span>
                <span class="summary-label">Pendentes</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-declined">{{ inviteCounts.declined }}</span>
                <span class="summary-label">Recusados</span>
              </div>
              <div class="summary-card">
                <span class="summary-value summary-slots">{{ nightShiftConfig.slots || 0 }}</span>
                <span class="summary-label">Vagas Total</span>
              </div>
            </div>

            <!-- Invites Section -->
            <div class="invites-section">
              <div class="invites-header">
                <h3>Convites Enviados</h3>
                <button @click="openInviteModal" class="btn btn-primary">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Convidar Aplicadores
                </button>
              </div>

              <div v-if="loadingInvites" class="loading-inline">
                <div class="loading-spinner-small"></div>
                <span>Carregando convites...</span>
              </div>

              <div v-else-if="nightShiftInvites.length === 0" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <p>Nenhum convite enviado</p>
                <span>Convide aplicadores para o turno noturno</span>
              </div>

              <div v-else class="invites-table">
                <table>
                  <thead>
                    <tr>
                      <th>Aplicador</th>
                      <th>Status</th>
                      <th>Convidado em</th>
                      <th>Respondido em</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="invite in nightShiftInvites" :key="invite.id">
                      <td>
                        <div class="member-info">
                          <div class="member-avatar">
                            {{ invite.user?.name?.charAt(0) || '?' }}
                          </div>
                          <div class="member-details">
                            <span class="member-name">{{ invite.user?.name }}</span>
                            <span class="member-username">@{{ invite.user?.username }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          class="invite-status-badge"
                          :style="{
                            background: getInviteStatusColor(invite.status) + '20',
                            color: getInviteStatusColor(invite.status),
                            borderColor: getInviteStatusColor(invite.status) + '40'
                          }"
                        >
                          {{ getInviteStatusLabel(invite.status) }}
                        </span>
                      </td>
                      <td>{{ formatDate(invite.invitedAt) }}</td>
                      <td>{{ invite.respondedAt ? formatDate(invite.respondedAt) : '-' }}</td>
                      <td>
                        <button
                          v-if="invite.status === 'PENDING'"
                          class="remove-btn"
                          @click="cancelInvite(invite.id)"
                          title="Cancelar convite"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="showAddMemberModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Adicionar Aplicador</h3>
          <button class="modal-close" @click="showAddMemberModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingApplicators" class="loading-inline">
            <div class="loading-spinner-small"></div>
            <span>Carregando aplicadores...</span>
          </div>
          <template v-else>
            <div class="field">
              <label>Aplicador</label>
              <select v-model="selectedApplicator" class="input">
                <option value="">Selecione um aplicador</option>
                <option v-for="app in availableApplicators" :key="app.id" :value="app.id">
                  {{ app.name }} (@{{ app.username }})
                </option>
              </select>
            </div>
            <div class="field">
              <label>Cargo</label>
              <select v-model="selectedRole" class="input">
                <option value="APLICADOR">Aplicador</option>
                <option value="LIDER">Lider</option>
              </select>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddMemberModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="addTeamMember"
            :disabled="!selectedApplicator || addingMember"
          >
            <div v-if="addingMember" class="btn-spinner"></div>
            {{ addingMember ? 'Adicionando...' : 'Adicionar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Night Shift Invite Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal modal-lg" @click.stop>
        <div class="modal-header">
          <h3>Convidar Aplicadores</h3>
          <button class="modal-close" @click="showInviteModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Selecione os aplicadores que receberao o convite para o turno noturno:</p>

          <div v-if="loadingApplicators" class="loading-inline">
            <div class="loading-spinner-small"></div>
            <span>Carregando aplicadores...</span>
          </div>

          <div v-else-if="availableApplicators.length === 0" class="empty-state-small">
            <p>Nenhum aplicador disponivel para convite</p>
          </div>

          <div v-else class="invitee-list">
            <div
              v-for="app in availableApplicators"
              :key="app.id"
              class="invitee-item"
              :class="{ selected: selectedInvitees.includes(app.id) }"
              @click="toggleInvitee(app.id)"
            >
              <div class="invitee-checkbox">
                <svg v-if="selectedInvitees.includes(app.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="invitee-avatar">
                {{ app.name?.charAt(0) || '?' }}
              </div>
              <div class="invitee-details">
                <span class="invitee-name">{{ app.name }}</span>
                <span class="invitee-username">@{{ app.username }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedInvitees.length > 0" class="selected-count">
            {{ selectedInvitees.length }} aplicador(es) selecionado(s)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showInviteModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="sendInvites"
            :disabled="selectedInvitees.length === 0 || sendingInvites"
          >
            <div v-if="sendingInvites" class="btn-spinner"></div>
            {{ sendingInvites ? 'Enviando...' : 'Enviar Convites' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Header styles - same as Projects.vue */
.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  height: 32px;
  width: auto;
}

.logo-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-link.router-link-active {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.user-name {
  color: var(--text-secondary);
  font-size: 14px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Main Content */
.main {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 14px;
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--accent-primary);
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

/* Project Header */
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
}

.project-info h1 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.night-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.night-badge svg {
  width: 14px;
  height: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meta-item svg {
  width: 16px;
  height: 16px;
}

.project-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab svg {
  width: 18px;
  height: 18px;
}

.tab:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Info Tab */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.info-card h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  font-size: 14px;
  color: var(--text-primary);
}

.input {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: var(--bg-card);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* Toggle Switch */
.field-toggle {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background: var(--text-tertiary);
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle input:checked + .toggle-slider {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background: #000;
}

/* Measurements */
.measurements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.measurement {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.measurement-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.measurement-icon svg {
  width: 20px;
  height: 20px;
}

.m2-total { background: rgba(201, 169, 98, 0.1); color: var(--accent-primary); }
.m2-piso { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }
.m2-parede { background: rgba(34, 197, 94, 0.1); color: var(--accent-green); }
.m2-teto { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.m-rodape { background: rgba(249, 115, 22, 0.1); color: var(--accent-orange); }

.measurement-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.measurement-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.measurement-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

/* Hours */
.hours-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hours-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hours-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.hours-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hours-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.hours-worked {
  color: var(--text-primary);
  font-weight: 500;
}

.hours-estimated {
  color: var(--text-tertiary);
}

.progress-percent {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-primary);
}

/* Team Tab */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.team-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: var(--text-secondary);
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.empty-state span {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* Team Table */
.team-table {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.team-table table {
  width: 100%;
  border-collapse: collapse;
}

.team-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.team-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.team-table tr:last-child td {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-weight: 500;
  color: var(--text-primary);
}

.member-username {
  font-size: 12px;
  color: var(--text-tertiary);
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.role-badge.lider {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.role-badge.aplicador {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.remove-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}

.btn-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(239, 68, 68, 0.2);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Checkins Tab */
.checkins-tab h3,
.reports-tab h3 {
  margin: 0 0 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.checkins-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkin-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.checkin-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #000;
}

.checkin-times {
  display: flex;
  gap: 24px;
  flex: 1;
}

.checkin-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.time-value {
  font-size: 13px;
  color: var(--text-primary);
}

.active-badge {
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.checkin-hours {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
}

/* Reports Tab */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.report-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.report-summary {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.report-photos {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* Night Shift Tab */
.tab-nightshift {
  color: #8b5cf6;
}

.tab-nightshift:hover {
  color: #a78bfa;
}

.tab-nightshift.active {
  color: #8b5cf6;
  border-bottom-color: #8b5cf6;
}

.nightshift-config {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.nightshift-config h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: end;
}

@media (max-width: 800px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.config-action {
  display: flex;
  align-items: end;
}

.invite-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .invite-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
}

.summary-label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-accepted { color: var(--accent-green); }
.summary-pending { color: var(--accent-orange); }
.summary-declined { color: var(--accent-red); }
.summary-slots { color: #8b5cf6; }

.invites-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.invites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.invites-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.invites-table table {
  width: 100%;
  border-collapse: collapse;
}

.invites-table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.invites-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.invites-table tr:last-child td {
  border-bottom: none;
}

.invite-status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
}

/* Invite Modal */
.modal-lg {
  max-width: 560px;
}

.modal-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.invitee-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invitee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.invitee-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--text-tertiary);
}

.invitee-item.selected {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.invitee-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invitee-item.selected .invitee-checkbox {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.invitee-checkbox svg {
  width: 12px;
  height: 12px;
  color: #fff;
}

.invitee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.invitee-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invitee-name {
  font-weight: 500;
  color: var(--text-primary);
}

.invitee-username {
  font-size: 12px;
  color: var(--text-tertiary);
}

.selected-count {
  text-align: center;
  color: #8b5cf6;
  font-size: 14px;
  font-weight: 500;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: var(--border-radius);
}

.empty-state-small {
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-state-small p {
  margin: 0;
}
</style>
