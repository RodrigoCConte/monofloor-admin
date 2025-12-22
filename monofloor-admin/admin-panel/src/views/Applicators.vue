<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { applicatorsApi, projectsApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

// API URL for building photo URLs
const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

// Helper to get full photo URL
const getPhotoUrl = (photoUrl: string | null | undefined): string | null => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}${photoUrl}`;
};

// Get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

// Format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0,00';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format hours
const formatHours = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const applicators = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadApplicators = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await applicatorsApi.getAll(params);
    applicators.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading applicators:', error);
  } finally {
    loading.value = false;
  }
};

const approveApplicator = async (id: string) => {
  try {
    await applicatorsApi.approve(id);
    await loadApplicators();
  } catch (error) {
    console.error('Error approving applicator:', error);
  }
};

const rejectApplicator = async (id: string) => {
  const reason = prompt('Motivo da rejeicao:');
  if (reason) {
    try {
      await applicatorsApi.reject(id, reason);
      await loadApplicators();
    } catch (error) {
      console.error('Error rejecting applicator:', error);
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'var(--accent-green)';
    case 'PENDING_APPROVAL': return 'var(--accent-orange)';
    case 'REJECTED': return 'var(--accent-red)';
    case 'SUSPENDED': return 'var(--text-tertiary)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'Aprovado';
    case 'PENDING_APPROVAL': return 'Pendente';
    case 'REJECTED': return 'Rejeitado';
    case 'SUSPENDED': return 'Suspenso';
    default: return status;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'LIDER': return 'Lider';
    case 'APLICADOR_III': return 'Aplicador III';
    case 'APLICADOR_II': return 'Aplicador II';
    case 'APLICADOR_I': return 'Aplicador I';
    case 'LIDER_PREPARACAO': return 'Lider da Preparacao';
    case 'PREPARADOR': return 'Preparador';
    case 'AUXILIAR': return 'Auxiliar';
    default: return role;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'LIDER': return '#FF6B35';
    case 'APLICADOR_III': return '#7C3AED';
    case 'APLICADOR_II': return '#9B5DE5';
    case 'APLICADOR_I': return '#A78BFA';
    case 'LIDER_PREPARACAO': return '#3B82F6';
    case 'PREPARADOR': return '#00D4FF';
    case 'AUXILIAR': return '#8B7355';
    default: return '#8B7355';
  }
};

// Character icon config - matching Map.vue
const getCharacterIcon = (role: string): string => {
  switch (role) {
    case 'LIDER': return '/icons/lider.png';
    case 'APLICADOR_III': return '/icons/aplicador-3.png';
    case 'APLICADOR_II': return '/icons/aplicador-2.png';
    case 'APLICADOR_I': return '/icons/aplicador-1.png';
    case 'LIDER_PREPARACAO': return '/icons/lider-preparacao.png';
    case 'PREPARADOR': return '/icons/preparador.png';
    case 'AUXILIAR': return '/icons/ajudante.png';
    default: return '/icons/ajudante.png';
  }
};

// Lista de roles disponíveis (ordem hierárquica)
const availableRoles = [
  { value: 'AUXILIAR', label: 'Auxiliar' },
  { value: 'PREPARADOR', label: 'Preparador' },
  { value: 'LIDER_PREPARACAO', label: 'Lider da Preparacao' },
  { value: 'APLICADOR_I', label: 'Aplicador I' },
  { value: 'APLICADOR_II', label: 'Aplicador II' },
  { value: 'APLICADOR_III', label: 'Aplicador III' },
  { value: 'LIDER', label: 'Lider' },
];

// Modal de edição de role
const showRoleModal = ref(false);
const selectedApplicator = ref<any>(null);
const selectedRole = ref('');

const openRoleModal = (applicator: any) => {
  selectedApplicator.value = applicator;
  selectedRole.value = applicator.role;
  showRoleModal.value = true;
};

const closeRoleModal = () => {
  showRoleModal.value = false;
  selectedApplicator.value = null;
  selectedRole.value = '';
};

const updateRole = async () => {
  if (!selectedApplicator.value || !selectedRole.value) return;

  try {
    await applicatorsApi.updateRole(selectedApplicator.value.id, selectedRole.value);
    await loadApplicators();
    closeRoleModal();
  } catch (error) {
    console.error('Error updating role:', error);
    alert('Erro ao atualizar cargo');
  }
};

// Modal de delete
const showDeleteModal = ref(false);
const applicatorToDelete = ref<any>(null);
const deleting = ref(false);

// Modal de perfil com badges
const showProfileModal = ref(false);
const profileApplicator = ref<any>(null);
const loadingProfile = ref(false);

// Projects data for profile modal
const applicatorProjects = ref<any[]>([]);
const loadingProjects = ref(false);
const availableProjects = ref<any[]>([]);
const showAddProjectModal = ref(false);
const selectedProjectToAdd = ref('');
const selectedProjectRole = ref('APLICADOR_I');
const addingProject = ref(false);

// Earnings data
const applicatorEarnings = ref<any>(null);
const loadingEarnings = ref(false);
const earningsMonth = ref(new Date().getMonth() + 1);
const earningsYear = ref(new Date().getFullYear());

// XP adjustment modal
const showXpModal = ref(false);
const xpType = ref<'PRAISE' | 'PENALTY'>('PRAISE');
const xpAmount = ref(100);
const xpReason = ref('');
const adjustingXp = ref(false);

const loadApplicatorProjects = async (userId: string) => {
  loadingProjects.value = true;
  try {
    const response = await applicatorsApi.getProjects(userId);
    applicatorProjects.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading applicator projects:', error);
    applicatorProjects.value = [];
  } finally {
    loadingProjects.value = false;
  }
};

const loadApplicatorEarnings = async (userId: string) => {
  loadingEarnings.value = true;
  try {
    const response = await applicatorsApi.getEarnings(userId, earningsMonth.value, earningsYear.value);
    applicatorEarnings.value = response.data.data;
  } catch (error) {
    console.error('Error loading applicator earnings:', error);
    applicatorEarnings.value = null;
  } finally {
    loadingEarnings.value = false;
  }
};

const loadAvailableProjects = async () => {
  try {
    const response = await projectsApi.getAll({ status: 'EM_EXECUCAO', limit: 100 });
    const allProjects = response.data.data || [];
    // Filter out already assigned projects
    const assignedIds = new Set(applicatorProjects.value.map((p: any) => p.project.id));
    availableProjects.value = allProjects.filter((p: any) => !assignedIds.has(p.id));
  } catch (error) {
    console.error('Error loading available projects:', error);
  }
};

const openAddProjectModal = async () => {
  await loadAvailableProjects();
  selectedProjectToAdd.value = '';
  selectedProjectRole.value = profileApplicator.value?.role || 'APLICADOR_I';
  showAddProjectModal.value = true;
};

const addProjectToApplicator = async () => {
  if (!selectedProjectToAdd.value || !profileApplicator.value) return;
  addingProject.value = true;
  try {
    await applicatorsApi.addProject(profileApplicator.value.id, selectedProjectToAdd.value, selectedProjectRole.value);
    await loadApplicatorProjects(profileApplicator.value.id);
    showAddProjectModal.value = false;
  } catch (error: any) {
    console.error('Error adding project:', error);
    alert(error.response?.data?.error?.message || 'Erro ao adicionar projeto');
  } finally {
    addingProject.value = false;
  }
};

const removeProjectFromApplicator = async (projectId: string) => {
  console.log('[DEBUG] removeProjectFromApplicator called with projectId:', projectId);
  console.log('[DEBUG] profileApplicator.value:', profileApplicator.value?.id);

  if (!profileApplicator.value) {
    console.log('[DEBUG] No profileApplicator, returning');
    return;
  }

  // Removido confirm() temporariamente - pode estar causando problema com modal
  console.log('[DEBUG] Calling API to remove project...');
  try {
    const result = await applicatorsApi.removeProject(profileApplicator.value.id, projectId);
    console.log('[DEBUG] Remove project result:', result);
    await loadApplicatorProjects(profileApplicator.value.id);
    console.log('[DEBUG] Projects reloaded - SUCCESS!');
  } catch (error: any) {
    console.error('[DEBUG] Error removing project:', error);
    console.error('[DEBUG] Error response:', error.response?.data);
    alert('Erro ao remover projeto: ' + (error.response?.data?.error?.message || error.message));
  }
};

const openXpModal = (type: 'PRAISE' | 'PENALTY') => {
  xpType.value = type;
  xpAmount.value = type === 'PRAISE' ? 100 : 50;
  xpReason.value = '';
  showXpModal.value = true;
};

const submitXpAdjustment = async () => {
  if (!profileApplicator.value || !xpReason.value.trim()) {
    alert('Por favor, informe o motivo');
    return;
  }
  adjustingXp.value = true;
  try {
    const response = await applicatorsApi.adjustXp(
      profileApplicator.value.id,
      xpAmount.value,
      xpReason.value.trim(),
      xpType.value
    );
    // Update local XP
    profileApplicator.value.xpTotal = response.data.data.xpTotal;
    showXpModal.value = false;
    alert(`XP ${xpType.value === 'PRAISE' ? 'adicionado' : 'removido'} com sucesso!`);
  } catch (error) {
    console.error('Error adjusting XP:', error);
    alert('Erro ao ajustar XP');
  } finally {
    adjustingXp.value = false;
  }
};

const openProfileModal = async (applicator: any) => {
  loadingProfile.value = true;
  showProfileModal.value = true;
  applicatorProjects.value = [];
  applicatorEarnings.value = null;

  try {
    const response = await applicatorsApi.getById(applicator.id);
    profileApplicator.value = response.data.data;
    // Load projects and earnings in parallel
    await Promise.all([
      loadApplicatorProjects(applicator.id),
      loadApplicatorEarnings(applicator.id),
    ]);
  } catch (error) {
    console.error('Error loading applicator profile:', error);
    profileApplicator.value = applicator;
  } finally {
    loadingProfile.value = false;
  }
};

const closeProfileModal = () => {
  showProfileModal.value = false;
  profileApplicator.value = null;
};

const getBadgeIconUrl = (iconUrl: string | null | undefined): string => {
  if (!iconUrl) return '/icons/badge-default.png';
  if (iconUrl.startsWith('http')) return iconUrl;
  return `${API_URL}${iconUrl}`;
};

const getRarityLabel = (rarity: string) => {
  switch (rarity) {
    case 'COMMON': return 'Comum';
    case 'RARE': return 'Raro';
    case 'EPIC': return 'Epico';
    case 'LEGENDARY': return 'Lendario';
    default: return rarity;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'COMMON': return '#888888';
    case 'RARE': return '#3b82f6';
    case 'EPIC': return '#a855f7';
    case 'LEGENDARY': return '#c9a962';
    default: return '#888888';
  }
};

const confirmDelete = (applicator: any) => {
  applicatorToDelete.value = applicator;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  applicatorToDelete.value = null;
};

const deleteApplicator = async () => {
  if (!applicatorToDelete.value) return;
  deleting.value = true;
  try {
    await applicatorsApi.delete(applicatorToDelete.value.id);
    await loadApplicators();
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting applicator:', error);
    alert('Erro ao remover aplicador');
  } finally {
    deleting.value = false;
  }
};

onMounted(loadApplicators);
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
        <router-link to="/requests" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Solicitacoes
        </router-link>
        <router-link to="/campaigns" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Campanhas
        </router-link>
        <router-link to="/academy" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Academia
        </router-link>
        <router-link to="/map" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </router-link>
      </nav>
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" />
            <span v-else>{{ getInitials(authStore.user?.name) }}</span>
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
      <div class="page-header">
        <div class="page-title">
          <h2>Aplicadores</h2>
          <p class="page-subtitle">Gerencie sua equipe de aplicadores</p>
        </div>
        <div class="filters">
          <select v-model="filter" @change="loadApplicators" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="PENDING_APPROVAL">Pendentes</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando aplicadores...</span>
      </div>

      <div v-else-if="applicators.length === 0" class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>Nenhum aplicador encontrado</p>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Aplicador</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>Projeto Atual</th>
              <th>XP</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in applicators" :key="app.id" class="clickable-row" @click="openProfileModal(app)">
              <td>
                <div class="applicator-info">
                  <div class="applicator-avatar">
                    <img v-if="getPhotoUrl(app.photoUrl)" :src="getPhotoUrl(app.photoUrl)!" alt="Avatar" class="avatar-img" />
                    <span v-else>{{ getInitials(app.name) }}</span>
                  </div>
                  <div class="applicator-details">
                    <strong>{{ app.name }}</strong>
                    <span class="applicator-email">{{ app.email }}</span>
                  </div>
                </div>
              </td>
              <td @click.stop>
                <div class="role-cell">
                  <span
                    class="role-badge clickable"
                    :style="{
                      background: getRoleColor(app.role) + '20',
                      color: getRoleColor(app.role),
                      borderColor: getRoleColor(app.role) + '40'
                    }"
                    @click="openRoleModal(app)"
                    title="Clique para alterar cargo"
                  >
                    {{ getRoleLabel(app.role) }}
                  </span>
                  <img :src="getCharacterIcon(app.role)" alt="" class="role-character-icon" />
                </div>
              </td>
              <td>
                <span
                  class="status-badge"
                  :style="{
                    background: getStatusColor(app.status) + '20',
                    color: getStatusColor(app.status),
                    borderColor: getStatusColor(app.status) + '40'
                  }"
                >
                  {{ getStatusLabel(app.status) }}
                </span>
              </td>
              <td>
                <div v-if="app.isOnline && app.currentProject" class="project-status online">
                  <span class="online-dot"></span>
                  <div class="project-info-cell">
                    <span class="project-name">{{ app.currentProject.cliente || app.currentProject.title }}</span>
                    <span class="online-label">Online</span>
                  </div>
                </div>
                <div v-else class="project-status offline">
                  <span class="offline-dot"></span>
                  <span class="offline-text">Nao esta em nenhum projeto agora :(</span>
                </div>
              </td>
              <td>
                <div class="xp-display">
                  <svg class="xp-icon" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{{ app.xpTotal || 0 }}</span>
                </div>
              </td>
              <td @click.stop>
                <div class="actions">
                  <button
                    v-if="app.status === 'PENDING_APPROVAL'"
                    @click="approveApplicator(app.id)"
                    class="btn btn-approve"
                    title="Aprovar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aprovar
                  </button>
                  <button
                    v-if="app.status === 'PENDING_APPROVAL'"
                    @click="rejectApplicator(app.id)"
                    class="btn btn-reject"
                    title="Rejeitar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Rejeitar
                  </button>
                  <button
                    @click="confirmDelete(app)"
                    class="btn btn-delete"
                    title="Remover aplicador"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Modal de Edição de Cargo -->
    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeRoleModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Alterar Cargo</h3>
          <button class="close-btn" @click="closeRoleModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-info">
            Alterando cargo de <strong>{{ selectedApplicator?.name }}</strong>
          </p>
          <div class="role-options">
            <label
              v-for="role in availableRoles"
              :key="role.value"
              class="role-option"
              :class="{ selected: selectedRole === role.value }"
            >
              <input
                type="radio"
                :value="role.value"
                v-model="selectedRole"
              />
              <div class="role-card" :style="{ '--role-color': getRoleColor(role.value) }">
                <div class="role-indicator">
                  <div class="indicator-dot"></div>
                </div>
                <span class="role-label">{{ role.label }}</span>
                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRoleModal">Cancelar</button>
          <button class="btn-save" @click="updateRole">Salvar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Delete -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h3>Remover Aplicador</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Esta acao e irreversivel!</p>
          </div>
          <p class="delete-info">
            Tem certeza que deseja remover <strong>{{ applicatorToDelete?.name }}</strong>?
          </p>
          <p class="delete-details">
            Todos os dados deste aplicador serao excluidos permanentemente, incluindo:
          </p>
          <ul class="delete-list">
            <li>Historico de check-ins</li>
            <li>Relatorios enviados</li>
            <li>Historico de localizacao</li>
            <li>Atribuicoes de projetos</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDeleteModal">Cancelar</button>
          <button class="btn-delete-confirm" @click="deleteApplicator" :disabled="deleting">
            {{ deleting ? 'Removendo...' : 'Remover Aplicador' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Perfil com Badges -->
    <div v-if="showProfileModal" class="modal-overlay" @click.self="closeProfileModal">
      <div class="modal-content profile-modal">
        <div class="modal-header">
          <h3>Perfil do Aplicador</h3>
          <button class="close-btn" @click="closeProfileModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingProfile" class="loading-profile">
            <div class="loading-spinner"></div>
            <span>Carregando perfil...</span>
          </div>
          <template v-else-if="profileApplicator">
            <!-- Profile Header -->
            <div class="profile-header-modal">
              <div class="profile-avatar-modal">
                <img v-if="getPhotoUrl(profileApplicator.photoUrl)" :src="getPhotoUrl(profileApplicator.photoUrl)!" alt="Avatar" />
                <span v-else>{{ getInitials(profileApplicator.name) }}</span>
              </div>
              <div class="profile-info-modal">
                <div class="profile-name-row">
                  <h4>{{ profileApplicator.name }}</h4>
                  <img
                    v-if="profileApplicator.primaryBadge?.iconUrl"
                    :src="getBadgeIconUrl(profileApplicator.primaryBadge.iconUrl)"
                    :alt="profileApplicator.primaryBadge.name"
                    class="primary-badge-icon"
                    :title="profileApplicator.primaryBadge.name"
                  />
                </div>
                <span class="profile-email-modal">{{ profileApplicator.email }}</span>
                <div class="profile-role-modal">
                  <span
                    class="role-badge-modal"
                    :style="{ background: getRoleColor(profileApplicator.role) + '20', color: getRoleColor(profileApplicator.role) }"
                  >
                    {{ getRoleLabel(profileApplicator.role) }}
                  </span>
                  <img :src="getCharacterIcon(profileApplicator.role)" alt="" class="role-icon-modal" />
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="profile-stats-modal">
              <div class="stat-item">
                <span class="stat-value">{{ profileApplicator.xpTotal || 0 }}</span>
                <span class="stat-label">XP Total</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ profileApplicator.level || 1 }}</span>
                <span class="stat-label">Nivel</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ Math.round(profileApplicator.totalHoursWorked || 0) }}h</span>
                <span class="stat-label">Horas</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ Math.round(profileApplicator.totalM2Applied || 0) }}</span>
                <span class="stat-label">m2</span>
              </div>
            </div>

            <!-- XP Adjustment Buttons -->
            <div class="xp-actions-section">
              <button class="btn-praise" @click="openXpModal('PRAISE')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                Elogio (+XP)
              </button>
              <button class="btn-penalty" @click="openXpModal('PENALTY')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
                Penalidade (-XP)
              </button>
            </div>

            <!-- Earnings Section -->
            <div class="earnings-section-modal">
              <div class="section-header">
                <h5>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Valores a Receber
                </h5>
                <div class="earnings-period-selector">
                  <select v-model="earningsMonth" @change="loadApplicatorEarnings(profileApplicator.id)" class="period-select">
                    <option v-for="m in 12" :key="m" :value="m">{{ m.toString().padStart(2, '0') }}</option>
                  </select>
                  <span>/</span>
                  <select v-model="earningsYear" @change="loadApplicatorEarnings(profileApplicator.id)" class="period-select">
                    <option v-for="y in [2024, 2025, 2026]" :key="y" :value="y">{{ y }}</option>
                  </select>
                </div>
              </div>
              <div v-if="loadingEarnings" class="loading-inline">Carregando...</div>
              <div v-else-if="applicatorEarnings" class="earnings-content">
                <div class="earnings-main">
                  <span class="earnings-value">R$ {{ formatCurrency(applicatorEarnings.totals?.earnings) }}</span>
                  <span class="earnings-label">no periodo</span>
                </div>
                <div class="earnings-details">
                  <div class="earning-detail">
                    <span class="detail-label">Horas normais</span>
                    <span class="detail-value">{{ formatHours(applicatorEarnings.totals?.hoursNormal) }}h</span>
                  </div>
                  <div class="earning-detail">
                    <span class="detail-label">Horas extras</span>
                    <span class="detail-value">{{ formatHours(applicatorEarnings.totals?.hoursOvertime) }}h</span>
                  </div>
                  <div class="earning-detail">
                    <span class="detail-label">Dias trabalhados</span>
                    <span class="detail-value">{{ applicatorEarnings.daysWorked || 0 }}</span>
                  </div>
                </div>
                <div v-if="applicatorEarnings.rates" class="rates-info">
                  <span class="rates-label">Valor/hora: R$ {{ formatCurrency(applicatorEarnings.rates?.hourlyRate) }}</span>
                  <span class="rates-divider">|</span>
                  <span class="rates-label">Hora extra: R$ {{ formatCurrency(applicatorEarnings.rates?.overtimeRate) }}</span>
                </div>
              </div>
              <div v-else class="no-earnings">
                <p>Sem dados de pagamento para este periodo</p>
              </div>
            </div>

            <!-- Projects Section -->
            <div class="projects-section-modal">
              <div class="section-header">
                <h5>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Projetos Designados ({{ applicatorProjects.length }})
                </h5>
                <button class="btn-add-project" @click="openAddProjectModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar
                </button>
              </div>
              <div v-if="loadingProjects" class="loading-inline">Carregando projetos...</div>
              <div v-else-if="applicatorProjects.length > 0" class="projects-list-modal">
                <div
                  v-for="assignment in applicatorProjects"
                  :key="assignment.assignmentId"
                  class="project-item-modal"
                >
                  <div class="project-info-modal">
                    <span class="project-title-modal">{{ assignment.project.cliente || assignment.project.title }}</span>
                    <span class="project-role-modal">{{ getRoleLabel(assignment.projectRole) }}</span>
                  </div>
                  <button class="btn-remove-project" @click.stop="removeProjectFromApplicator(assignment.project.id)" title="Remover do projeto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div v-else class="no-projects">
                <p>Nenhum projeto designado</p>
              </div>
            </div>

            <!-- Badges Section -->
            <div class="badges-section-modal">
              <h5>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                Conquistas ({{ profileApplicator.badges?.length || 0 }})
              </h5>
              <div v-if="profileApplicator.badges?.length > 0" class="badges-grid-modal">
                <div
                  v-for="badge in profileApplicator.badges"
                  :key="badge.id"
                  class="badge-item-modal"
                  :class="{ 'is-primary': badge.isPrimary }"
                  :title="badge.description || badge.name"
                >
                  <div
                    class="badge-icon-modal"
                    :style="{
                      background: (badge.color || '#c9a962') + '20',
                      boxShadow: `0 0 12px ${getRarityColor(badge.rarity)}40`
                    }"
                  >
                    <img :src="getBadgeIconUrl(badge.iconUrl)" :alt="badge.name" />
                  </div>
                  <span class="badge-name-modal">{{ badge.name }}</span>
                  <span
                    class="badge-rarity-modal"
                    :style="{ color: getRarityColor(badge.rarity) }"
                  >
                    {{ getRarityLabel(badge.rarity) }}
                  </span>
                  <span v-if="badge.isPrimary" class="badge-primary-tag">Principal</span>
                </div>
              </div>
              <div v-else class="no-badges">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                <p>Nenhuma conquista ainda</p>
              </div>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeProfileModal">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Adicionar Projeto -->
    <div v-if="showAddProjectModal" class="modal-overlay" @click.self="showAddProjectModal = false">
      <div class="modal-content add-project-modal">
        <div class="modal-header">
          <h3>Adicionar Projeto</h3>
          <button class="close-btn" @click="showAddProjectModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-info">
            Adicionar projeto para <strong>{{ profileApplicator?.name }}</strong>
          </p>
          <div class="form-group">
            <label>Projeto</label>
            <select v-model="selectedProjectToAdd" class="form-select">
              <option value="">Selecione um projeto...</option>
              <option v-for="project in availableProjects" :key="project.id" :value="project.id">
                {{ project.cliente || project.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Funcao no Projeto</label>
            <select v-model="selectedProjectRole" class="form-select">
              <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showAddProjectModal = false">Cancelar</button>
          <button class="btn-save" @click="addProjectToApplicator" :disabled="!selectedProjectToAdd || addingProject">
            {{ addingProject ? 'Adicionando...' : 'Adicionar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Ajuste de XP -->
    <div v-if="showXpModal" class="modal-overlay" @click.self="showXpModal = false">
      <div class="modal-content xp-modal">
        <div class="modal-header">
          <h3>{{ xpType === 'PRAISE' ? 'Aplicar Elogio' : 'Aplicar Penalidade' }}</h3>
          <button class="close-btn" @click="showXpModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="xp-preview" :class="xpType.toLowerCase()">
            <div class="xp-icon-large">
              <svg v-if="xpType === 'PRAISE'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
            </div>
            <span class="xp-amount-preview">{{ xpType === 'PRAISE' ? '+' : '-' }}{{ xpAmount }} XP</span>
          </div>
          <div class="form-group">
            <label>Quantidade de XP</label>
            <input type="number" v-model.number="xpAmount" min="1" class="form-input" />
          </div>
          <div class="xp-presets">
            <button v-for="preset in (xpType === 'PRAISE' ? [100, 500, 1000, 5000, 10000] : [50, 100, 500, 1000, 5000])" :key="preset" @click="xpAmount = preset" class="preset-btn" :class="{ active: xpAmount === preset }">
              {{ preset }} XP
            </button>
          </div>
          <div class="form-group">
            <label>Motivo (obrigatorio)</label>
            <textarea v-model="xpReason" placeholder="Descreva o motivo do elogio ou penalidade..." class="form-textarea" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showXpModal = false">Cancelar</button>
          <button
            :class="xpType === 'PRAISE' ? 'btn-praise-confirm' : 'btn-penalty-confirm'"
            @click="submitXpAdjustment"
            :disabled="!xpReason.trim() || adjustingXp"
          >
            {{ adjustingXp ? 'Aplicando...' : (xpType === 'PRAISE' ? 'Aplicar Elogio' : 'Aplicar Penalidade') }}
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

.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  overflow: hidden;
}

.user-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.main {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.filter-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filter-select option {
  background: var(--bg-card);
  color: var(--text-primary);
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

.empty {
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

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
}

.table-container {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tbody tr {
  transition: background 0.2s;
}

.table tbody tr:hover {
  background: var(--bg-card-hover);
}

.table tbody tr.clickable-row {
  cursor: pointer;
}

.table tbody tr.clickable-row:hover {
  background: rgba(201, 169, 98, 0.08);
}

.table tbody tr.clickable-row:active {
  background: rgba(201, 169, 98, 0.15);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.applicator-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.applicator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: #000;
  overflow: hidden;
  flex-shrink: 0;
}

.applicator-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.applicator-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.applicator-details strong {
  color: var(--text-primary);
  font-size: 14px;
}

.applicator-email {
  font-size: 12px;
  color: var(--text-tertiary);
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.xp-display {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-primary);
  font-weight: 600;
}

.xp-icon {
  width: 16px;
  height: 16px;
}

/* Project Status Column */
.project-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-status.online {
  color: var(--accent-green);
}

.project-status.offline {
  color: var(--text-tertiary);
}

.online-dot,
.offline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.online-dot {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.offline-dot {
  background: var(--text-tertiary);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.project-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.online-label {
  font-size: 11px;
  color: var(--accent-green);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.offline-text {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.btn-approve {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.btn-approve:hover {
  background: rgba(34, 197, 94, 0.2);
}

.btn-reject {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-reject:hover {
  background: rgba(239, 68, 68, 0.2);
}

.no-actions {
  color: var(--text-tertiary);
}

/* Role Badge Clickable */
.role-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-character-icon {
  width: 36px;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.role-badge.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.role-badge.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-card-hover);
}

.close-btn svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.modal-body {
  padding: 24px;
}

.modal-info {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.modal-info strong {
  color: var(--text-primary);
}

.role-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-option {
  cursor: pointer;
}

.role-option input {
  display: none;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  transition: all 0.15s ease;
  position: relative;
}

.role-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--role-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.role-card:active {
  transform: scale(0.98) translateY(0);
  box-shadow: none;
}

.role-indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.15s ease;
  transform: scale(0);
}

.role-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: var(--role-color);
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s ease;
}

/* Hover state */
.role-option:hover .role-indicator {
  border-color: var(--role-color);
}

.role-option:hover .role-label {
  color: var(--text-primary);
}

/* Selected state */
.role-option.selected .role-card {
  background: color-mix(in srgb, var(--role-color) 15%, var(--bg-secondary));
  border-color: var(--role-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--role-color) 20%, transparent);
}

.role-option.selected .role-indicator {
  border-color: var(--role-color);
  background: var(--role-color);
}

.role-option.selected .indicator-dot {
  background: white;
  transform: scale(1);
}

.role-option.selected .role-label {
  color: var(--role-color);
  font-weight: 600;
}

.role-option.selected .check-icon {
  opacity: 1;
  transform: scale(1);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.btn-save {
  padding: 10px 24px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

/* Delete Button */
.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

/* Delete Modal */
.delete-modal {
  max-width: 480px;
}

.delete-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--border-radius);
  margin-bottom: 20px;
}

.delete-warning svg {
  width: 24px;
  height: 24px;
  color: var(--accent-red);
  flex-shrink: 0;
}

.delete-warning p {
  margin: 0;
  font-weight: 600;
  color: var(--accent-red);
}

.delete-info {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.delete-info strong {
  color: var(--text-primary);
}

.delete-details {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.delete-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.delete-list li {
  margin-bottom: 4px;
}

.btn-delete-confirm {
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  background: var(--accent-red);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Profile Modal Styles */
.profile-modal {
  max-width: 560px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.profile-modal .modal-body {
  overflow-y: auto;
  max-height: calc(90vh - 70px);
  padding: 16px;
}

.loading-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  color: var(--text-secondary);
}

.profile-header-modal {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 14px;
}

.profile-avatar-modal {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar-modal img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info-modal {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-name-row h4 {
  margin: 0;
  font-size: 17px;
  color: var(--text-primary);
}

.primary-badge-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.profile-email-modal {
  color: var(--text-secondary);
  font-size: 13px;
  display: block;
  margin: 2px 0 6px;
}

.profile-role-modal {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-badge-modal {
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
}

.role-icon-modal {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.profile-stats-modal {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.badges-section-modal h5 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--text-primary);
}

.badges-section-modal h5 svg {
  width: 16px;
  height: 16px;
  color: var(--accent-primary);
}

.badges-grid-modal {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.badge-item-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  position: relative;
  transition: all 0.2s;
}

.badge-item-modal:hover {
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}

.badge-item-modal.is-primary {
  border-color: var(--accent-primary);
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.1), transparent);
}

.badge-icon-modal {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.badge-icon-modal img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.badge-name-modal {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 2px;
  line-height: 1.2;
}

.badge-rarity-modal {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-primary-tag {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent-primary);
  color: #000;
  font-size: 8px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 8px;
  text-transform: uppercase;
}

.no-badges {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--text-tertiary);
  gap: 8px;
}

.no-badges svg {
  width: 36px;
  height: 36px;
  opacity: 0.5;
}

.no-badges p {
  margin: 0;
  font-size: 12px;
}

/* Profile Button Style */
.btn-profile {
  background: var(--accent-primary);
  color: #000;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-profile:hover {
  background: #dbb872;
  transform: scale(1.05);
}

.btn-profile svg {
  width: 16px;
  height: 16px;
}

/* XP Actions Section */
.xp-actions-section {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.btn-praise,
.btn-penalty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-praise {
  background: rgba(34, 197, 94, 0.15);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.btn-praise:hover {
  background: rgba(34, 197, 94, 0.25);
  transform: translateY(-2px);
}

.btn-penalty {
  background: rgba(239, 68, 68, 0.15);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-penalty:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.btn-praise svg,
.btn-penalty svg {
  width: 16px;
  height: 16px;
}

/* Earnings Section */
.earnings-section-modal {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.earnings-section-modal h5 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.earnings-section-modal h5 svg {
  width: 16px;
  height: 16px;
  color: var(--accent-green);
}

.earnings-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.earnings-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.earnings-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-green);
}

.earnings-period {
  font-size: 14px;
  color: var(--text-tertiary);
}

.earnings-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.earning-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-inline {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 12px;
  text-align: center;
}

.no-earnings {
  color: var(--text-tertiary);
  font-size: 14px;
  text-align: center;
}

.no-earnings p {
  margin: 0;
}

.earnings-section-modal .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.earnings-section-modal .section-header h5 {
  margin: 0;
}

.earnings-period-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.period-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.period-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.earnings-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.rates-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.rates-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.rates-divider {
  color: var(--border-color);
}

/* Projects Section */
.projects-section-modal {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header h5 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: var(--text-primary);
}

.section-header h5 svg {
  width: 16px;
  height: 16px;
  color: var(--accent-primary);
}

.btn-add-project {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--accent-primary);
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-project:hover {
  background: #dbb872;
  transform: translateY(-1px);
}

.btn-add-project svg {
  width: 12px;
  height: 12px;
}

.projects-list-modal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.project-item-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.project-info-modal {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.project-title-modal {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.project-role-modal {
  font-size: 10px;
  color: var(--text-tertiary);
}

.btn-remove-project {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-project:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-remove-project svg {
  width: 12px;
  height: 12px;
  color: var(--accent-red);
}

.no-projects {
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
  padding: 12px;
}

.no-projects p {
  margin: 0;
}

/* Add Project Modal */
.add-project-modal {
  max-width: 420px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-select option {
  background: var(--bg-card);
  color: var(--text-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* XP Modal */
.xp-modal {
  max-width: 420px;
}

.xp-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.xp-preview.praise {
  background: rgba(34, 197, 94, 0.1);
}

.xp-preview.penalty {
  background: rgba(239, 68, 68, 0.1);
}

.xp-icon-large {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xp-icon-large svg {
  width: 48px;
  height: 48px;
}

.xp-preview.praise .xp-icon-large svg {
  color: var(--accent-green);
}

.xp-preview.penalty .xp-icon-large svg {
  color: var(--accent-red);
}

.xp-amount-preview {
  font-size: 32px;
  font-weight: 700;
}

.xp-preview.praise .xp-amount-preview {
  color: var(--accent-green);
}

.xp-preview.penalty .xp-amount-preview {
  color: var(--accent-red);
}

.xp-presets {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.preset-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #000;
}

.btn-praise-confirm {
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  background: var(--accent-green);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-praise-confirm:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-penalty-confirm {
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  background: var(--accent-red);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-penalty-confirm:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-praise-confirm:disabled,
.btn-penalty-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
