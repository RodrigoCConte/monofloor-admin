<script setup lang="ts">
// @ts-nocheck - Temporarily disable type checking
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { badgesApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

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

const badges = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');

// Modal states
const showCreateModal = ref(false);
const editingBadge = ref<any>(null);
const uploading = ref(false);

// Form data
const formData = ref({
  name: '',
  description: '',
  iconUrl: '',
  color: '#c9a962',
  category: 'CAMPAIGN',
  rarity: 'COMMON',
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Filter badges
const filteredBadges = computed(() => {
  if (filter.value === 'all') return badges.value;
  return badges.value.filter(b => b.category === filter.value);
});

// Stats
const totalBadges = computed(() => badges.value.length);
const campaignBadges = computed(() => badges.value.filter(b => b.category === 'CAMPAIGN').length);
const achievementBadges = computed(() => badges.value.filter(b => b.category === 'ACHIEVEMENT').length);

const loadBadges = async () => {
  loading.value = true;
  try {
    const response = await badgesApi.getAll();
    badges.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading badges:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = (badge?: any) => {
  if (badge) {
    editingBadge.value = badge;
    formData.value = {
      name: badge.name,
      description: badge.description || '',
      iconUrl: badge.iconUrl || '',
      color: badge.color || '#c9a962',
      category: badge.category || 'CAMPAIGN',
      rarity: badge.rarity || 'COMMON',
    };
  } else {
    editingBadge.value = null;
    formData.value = {
      name: '',
      description: '',
      iconUrl: '',
      color: '#c9a962',
      category: 'CAMPAIGN',
      rarity: 'COMMON',
    };
  }
  showCreateModal.value = true;
};

const handleIconUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  uploading.value = true;
  try {
    const response = await badgesApi.uploadIcon(input.files[0]);
    formData.value.iconUrl = response.data.data.url;
    alert('Icone enviado com sucesso!');
  } catch (error) {
    console.error('Error uploading icon:', error);
    alert('Erro ao enviar icone');
  } finally {
    uploading.value = false;
  }
};

const saveBadge = async () => {
  if (!formData.value.name || !formData.value.iconUrl) {
    alert('Nome e icone sao obrigatorios');
    return;
  }

  try {
    if (editingBadge.value) {
      await badgesApi.update(editingBadge.value.id, formData.value);
    } else {
      await badgesApi.create(formData.value);
    }
    showCreateModal.value = false;
    loadBadges();
    alert(editingBadge.value ? 'Badge atualizado!' : 'Badge criado!');
  } catch (error) {
    console.error('Error saving badge:', error);
    alert('Erro ao salvar badge');
  }
};

const deleteBadge = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este badge?')) return;

  try {
    await badgesApi.delete(id);
    loadBadges();
    alert('Badge excluido!');
  } catch (error: any) {
    console.error('Error deleting badge:', error);
    alert(error.response?.data?.error?.message || 'Erro ao excluir badge');
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'LEGENDARY': return '#FFD700';
    case 'EPIC': return '#9B59B6';
    case 'RARE': return '#3498DB';
    default: return '#95A5A6';
  }
};

const getRarityLabel = (rarity: string) => {
  switch (rarity) {
    case 'LEGENDARY': return 'Lendario';
    case 'EPIC': return 'Epico';
    case 'RARE': return 'Raro';
    default: return 'Comum';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'CAMPAIGN': return 'Campanha';
    case 'ACHIEVEMENT': return 'Conquista';
    case 'SPECIAL': return 'Especial';
    case 'ROLE': return 'Cargo';
    default: return category;
  }
};

onMounted(() => {
  loadBadges();
});
</script>

<template>
  <div class="badges-page">
    <!-- Header -->
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
        <router-link to="/reports" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Relatorios
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
        <router-link to="/badges" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          Badges
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

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>Badges</h1>
        <p>Gerencie os badges e conquistas do sistema</p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-value">{{ totalBadges }}</span>
          <span class="stat-label">Total de Badges</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ campaignBadges }}</span>
          <span class="stat-label">De Campanhas</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ achievementBadges }}</span>
          <span class="stat-label">De Conquistas</span>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Criar Badge
      </button>
    </section>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">Todos</button>
      <button :class="{ active: filter === 'CAMPAIGN' }" @click="filter = 'CAMPAIGN'">Campanhas</button>
      <button :class="{ active: filter === 'ACHIEVEMENT' }" @click="filter = 'ACHIEVEMENT'">Conquistas</button>
      <button :class="{ active: filter === 'SPECIAL' }" @click="filter = 'SPECIAL'">Especiais</button>
      <button :class="{ active: filter === 'ROLE' }" @click="filter = 'ROLE'">Cargos</button>
    </div>

    <!-- Badges Grid -->
    <main class="page-content">
      <div v-if="loading" class="loading">Carregando badges...</div>
      <div v-else-if="filteredBadges.length === 0" class="empty-state">
        <p>Nenhum badge encontrado</p>
      </div>
      <div v-else class="badges-grid">
        <div v-for="badge in filteredBadges" :key="badge.id" class="badge-card">
          <div class="badge-icon-wrapper" :style="{ borderColor: badge.color }">
            <img v-if="badge.iconUrl" :src="getPhotoUrl(badge.iconUrl)" :alt="badge.name" class="badge-icon" />
            <span v-else class="badge-icon-placeholder">?</span>
          </div>
          <div class="badge-info">
            <h3 class="badge-name">{{ badge.name }}</h3>
            <p class="badge-description">{{ badge.description || 'Sem descricao' }}</p>
            <div class="badge-meta">
              <span class="badge-category">{{ getCategoryLabel(badge.category) }}</span>
              <span class="badge-rarity" :style="{ color: getRarityColor(badge.rarity) }">
                {{ getRarityLabel(badge.rarity) }}
              </span>
            </div>
            <div class="badge-stats">
              <span>{{ badge.usersCount || 0 }} usuarios</span>
              <span>{{ badge.campaignsCount || 0 }} campanhas</span>
            </div>
          </div>
          <div class="badge-actions">
            <button class="btn-icon-action btn-edit" @click="openCreateModal(badge)" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon-action btn-delete" @click="deleteBadge(badge.id)" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingBadge ? 'Editar Badge' : 'Criar Badge' }}</h2>
          <button class="btn-close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome *</label>
            <input v-model="formData.name" type="text" placeholder="Ex: Campeao da Maratona" />
          </div>
          <div class="form-group">
            <label>Descricao</label>
            <textarea v-model="formData.description" placeholder="Descricao do badge..." rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Categoria</label>
              <select v-model="formData.category">
                <option value="CAMPAIGN">Campanha</option>
                <option value="ACHIEVEMENT">Conquista</option>
                <option value="SPECIAL">Especial</option>
                <option value="ROLE">Cargo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Raridade</label>
              <select v-model="formData.rarity">
                <option value="COMMON">Comum</option>
                <option value="RARE">Raro</option>
                <option value="EPIC">Epico</option>
                <option value="LEGENDARY">Lendario</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Cor do Badge</label>
            <div class="color-picker">
              <input v-model="formData.color" type="color" />
              <input v-model="formData.color" type="text" placeholder="#c9a962" />
            </div>
          </div>
          <div class="form-group">
            <label>Icone do Badge *</label>
            <div class="icon-upload">
              <div class="icon-preview" :style="{ borderColor: formData.color }">
                <img v-if="formData.iconUrl" :src="getPhotoUrl(formData.iconUrl)" alt="Preview" />
                <span v-else>?</span>
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleIconUpload" accept="image/*" id="icon-upload" class="hidden" :disabled="uploading" />
                <label for="icon-upload" class="btn-upload" :class="{ disabled: uploading }">
                  {{ uploading ? 'Enviando...' : 'Escolher Imagem' }}
                </label>
                <span class="upload-hint">PNG, JPG, SVG ou GIF (max 5MB)</span>
              </div>
            </div>
            <input v-model="formData.iconUrl" type="text" placeholder="Ou cole a URL do icone" class="mt-2" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">Cancelar</button>
          <button class="btn-primary" @click="saveBadge" :disabled="!formData.name || !formData.iconUrl">
            {{ editingBadge ? 'Salvar' : 'Criar Badge' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badges-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

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

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
  padding: 40px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.hero-content h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-content p {
  color: var(--text-secondary);
}

.hero-stats {
  display: flex;
  gap: 24px;
}

.stat-card {
  background: var(--bg-primary);
  padding: 16px 24px;
  border-radius: var(--border-radius);
  text-align: center;
  min-width: 120px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-primary);
  color: #000;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: var(--accent-secondary);
}

.btn-create svg {
  width: 18px;
  height: 18px;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filter-tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tabs button:hover {
  background: var(--bg-tertiary);
}

.filter-tabs button.active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #000000;
  font-weight: 600;
}

/* Page Content */
.page-content {
  padding: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
}

/* Badges Grid */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.badge-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  display: flex;
  gap: 16px;
  transition: all 0.2s;
}

.badge-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.1);
}

.badge-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg-secondary);
  overflow: hidden;
}

.badge-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-icon-placeholder {
  font-size: 32px;
  color: var(--text-tertiary);
}

.badge-info {
  flex: 1;
  min-width: 0;
}

.badge-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.badge-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.badge-category {
  font-size: 12px;
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.badge-rarity {
  font-size: 12px;
  font-weight: 600;
}

.badge-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.badge-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-icon-action {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon-action svg {
  width: 16px;
  height: 16px;
}

.btn-edit:hover {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.btn-delete:hover {
  background: var(--accent-red);
  color: white;
  border-color: var(--accent-red);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.color-picker {
  display: flex;
  gap: 12px;
  align-items: center;
}

.color-picker input[type="color"] {
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  cursor: pointer;
}

.color-picker input[type="text"] {
  flex: 1;
}

.icon-upload {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.icon-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  overflow: hidden;
  flex-shrink: 0;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-preview span {
  font-size: 32px;
  color: var(--text-tertiary);
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-upload {
  display: inline-block;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;
}

.btn-upload:hover:not(.disabled) {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.btn-upload.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.hidden {
  display: none;
}

.mt-2 {
  margin-top: 8px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-secondary {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--accent-primary);
  border: none;
  border-radius: var(--border-radius);
  color: #000;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
