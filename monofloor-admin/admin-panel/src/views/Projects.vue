<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { projectsApi } from '../api';
import { useToast } from '../composables/useToast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Mobile menu state
const mobileMenuOpen = ref(false);
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
const closeMobileMenu = () => { mobileMenuOpen.value = false; };
const handleResizeMobile = () => { if (window.innerWidth >= 768) mobileMenuOpen.value = false; };

// API URL for building photo URLs
const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

const projects = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const deleting = ref<string | null>(null);
const showDeleteModal = ref(false);
const projectToDelete = ref<any>(null);
const deletingAll = ref(false);
const showDeleteAllModal = ref(false);

// Edit project modal state
const showEditModal = ref(false);
const editing = ref(false);
const editProject = ref({
  id: '',
  title: '',
  cliente: '',
  endereco: '',
  m2Total: 0,
  m2Piso: 0,
  m2Parede: 0,
  m2Teto: 0,
  mRodape: 0,
  latitude: null as number | null,
  longitude: null as number | null
});

// Create project modal state
const showCreateModal = ref(false);
const creating = ref(false);
const newProject = ref({
  title: '',
  cliente: '',
  endereco: '',
  m2Total: 0,
  m2Piso: 0,
  m2Parede: 0,
  m2Teto: 0,
  mRodape: 0,
  latitude: null as number | null,
  longitude: null as number | null
});

// Google Places Autocomplete
const enderecoInput = ref<HTMLInputElement | null>(null);
const autocomplete = ref<google.maps.places.Autocomplete | null>(null);
const locationFound = ref(false);

// Calculated m2Total for create and edit modals
const calculatedM2TotalNew = computed(() => {
  const piso = Number(newProject.value.m2Piso) || 0;
  const parede = Number(newProject.value.m2Parede) || 0;
  const teto = Number(newProject.value.m2Teto) || 0;
  return piso + parede + teto;
});

const calculatedM2TotalEdit = computed(() => {
  const piso = Number(editProject.value.m2Piso) || 0;
  const parede = Number(editProject.value.m2Parede) || 0;
  const teto = Number(editProject.value.m2Teto) || 0;
  return piso + parede + teto;
});

// Helper to calculate m2Total for any project
const getProjectM2Total = (project: any): number => {
  const piso = Number(project.m2Piso) || 0;
  const parede = Number(project.m2Parede) || 0;
  const teto = Number(project.m2Teto) || 0;
  return piso + parede + teto;
};

// Load Google Maps script
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

// Initialize Places Autocomplete
const initAutocomplete = async () => {
  if (!GOOGLE_MAPS_API_KEY || !enderecoInput.value) return;

  try {
    await loadGoogleMapsScript();

    // Create bounds covering main operating areas (SP, RJ, Curitiba region)
    // Southwest: South of Curitiba, West of SP
    // Northeast: North of RJ, East coast
    const defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-25.8, -47.5), // Southwest (south of Curitiba)
      new google.maps.LatLng(-22.0, -43.0)  // Northeast (north of RJ)
    );

    autocomplete.value = new google.maps.places.Autocomplete(enderecoInput.value, {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['address'],
      bounds: defaultBounds
    });

    // Try to get user's current location for better results
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Create bounds around user's location (roughly 100km radius)
          const userBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(
              position.coords.latitude - 0.9,
              position.coords.longitude - 0.9
            ),
            new google.maps.LatLng(
              position.coords.latitude + 0.9,
              position.coords.longitude + 0.9
            )
          );
          autocomplete.value?.setBounds(userBounds);
        },
        () => {
          // Geolocation failed, keep default bounds
          console.log('Geolocation not available, using default bounds');
        }
      );
    }

    autocomplete.value.addListener('place_changed', () => {
      const place = autocomplete.value?.getPlace();
      if (place?.geometry?.location) {
        newProject.value.endereco = place.formatted_address || '';
        newProject.value.latitude = place.geometry.location.lat();
        newProject.value.longitude = place.geometry.location.lng();
        locationFound.value = true;
      }
    });
  } catch (error) {
    console.error('Failed to initialize autocomplete:', error);
  }
};

// Watch for modal open to initialize autocomplete
watch(showCreateModal, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    initAutocomplete();
  } else {
    locationFound.value = false;
  }
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const loadProjects = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await projectsApi.getAll(params);
    projects.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading projects:', error);
  } finally {
    loading.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await projectsApi.getTemplate();
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_projetos.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading template:', error);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importing.value = true;
  try {
    const response = await projectsApi.importExcel(file);
    toast.success(`Importacao concluida! ${response.data.data?.imported || 0} projetos importados.`);
    await loadProjects();
  } catch (error: any) {
    toast.error('Erro ao importar: ' + (error.response?.data?.error?.message || 'Erro desconhecido'));
  } finally {
    importing.value = false;
    target.value = '';
  }
};

const getStatusColor = (activeCheckinsCount: number) => {
  if (activeCheckinsCount > 0) {
    return '#22c55e'; // Green
  }
  return '#ef4444'; // Red
};

const getStatusLabel = (activeCheckinsCount: number) => {
  if (activeCheckinsCount > 0) {
    return 'Em execucao';
  }
  return 'Ninguem por aqui ainda :(';
};

const openDeleteModal = (project: any) => {
  projectToDelete.value = project;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  projectToDelete.value = null;
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;

  deleting.value = projectToDelete.value.id;
  try {
    await projectsApi.delete(projectToDelete.value.id);
    await loadProjects();
    closeDeleteModal();
  } catch (error: any) {
    toast.error('Erro ao deletar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    deleting.value = null;
  }
};

const confirmDeleteAll = async () => {
  deletingAll.value = true;
  try {
    await projectsApi.deleteAll();
    await loadProjects();
    showDeleteAllModal.value = false;
  } catch (error: any) {
    toast.error('Erro ao deletar: ' + (error.response?.data?.error || 'Erro desconhecido'));
  } finally {
    deletingAll.value = false;
  }
};

// Create project functions
const resetNewProject = () => {
  newProject.value = {
    title: '',
    cliente: '',
    endereco: '',
    m2Total: 0,
    m2Piso: 0,
    m2Parede: 0,
    m2Teto: 0,
    mRodape: 0,
    latitude: null,
    longitude: null
  };
};

const openCreateModal = () => {
  resetNewProject();
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  resetNewProject();
};

const createProject = async () => {
  if (!newProject.value.title.trim()) {
    toast.warning('O nome do projeto e obrigatorio');
    return;
  }

  creating.value = true;
  try {
    // Build data object, excluding null/undefined values
    const data: Record<string, any> = {
      title: newProject.value.title,
      m2Total: calculatedM2TotalNew.value,
      m2Piso: newProject.value.m2Piso,
      m2Parede: newProject.value.m2Parede,
      m2Teto: newProject.value.m2Teto,
      mRodape: newProject.value.mRodape,
    };

    // Only include optional fields if they have values
    if (newProject.value.cliente) {
      data.cliente = newProject.value.cliente;
    }
    if (newProject.value.endereco) {
      data.endereco = newProject.value.endereco;
    }

    // Only include coordinates if they exist
    if (newProject.value.latitude !== null && newProject.value.longitude !== null) {
      data.latitude = newProject.value.latitude;
      data.longitude = newProject.value.longitude;
    }

    await projectsApi.create(data);
    await loadProjects();
    closeCreateModal();
  } catch (error: any) {
    toast.error('Erro ao criar projeto: ' + (error.response?.data?.error?.message || 'Erro desconhecido'));
  } finally {
    creating.value = false;
  }
};

// Edit project functions
const openEditModal = (project: any) => {
  editProject.value = {
    id: project.id,
    title: project.title || '',
    cliente: project.cliente || '',
    endereco: project.endereco || '',
    m2Total: project.m2Total || 0,
    m2Piso: project.m2Piso || 0,
    m2Parede: project.m2Parede || 0,
    m2Teto: project.m2Teto || 0,
    mRodape: project.mRodape || 0,
    latitude: project.latitude || null,
    longitude: project.longitude || null
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editProject.value = {
    id: '',
    title: '',
    cliente: '',
    endereco: '',
    m2Total: 0,
    m2Piso: 0,
    m2Parede: 0,
    m2Teto: 0,
    mRodape: 0,
    latitude: null,
    longitude: null
  };
};

const updateProject = async () => {
  if (!editProject.value.title.trim()) {
    toast.warning('O nome do projeto e obrigatorio');
    return;
  }

  editing.value = true;
  try {
    const data: Record<string, any> = {
      title: editProject.value.title,
      m2Total: calculatedM2TotalEdit.value,
      m2Piso: editProject.value.m2Piso,
      m2Parede: editProject.value.m2Parede,
      m2Teto: editProject.value.m2Teto,
      mRodape: editProject.value.mRodape,
    };

    // Include cliente and endereco even if empty (to allow clearing)
    data.cliente = editProject.value.cliente || '';
    data.endereco = editProject.value.endereco || '';

    // Only include coordinates if they exist
    if (editProject.value.latitude !== null && editProject.value.longitude !== null) {
      data.latitude = editProject.value.latitude;
      data.longitude = editProject.value.longitude;
    }

    await projectsApi.update(editProject.value.id, data);
    await loadProjects();
    closeEditModal();
  } catch (error: any) {
    toast.error('Erro ao atualizar projeto: ' + (error.response?.data?.error?.message || 'Erro desconhecido'));
  } finally {
    editing.value = false;
  }
};

onMounted(() => { loadProjects(); window.addEventListener('resize', handleResizeMobile); });
onUnmounted(() => { window.removeEventListener('resize', handleResizeMobile); });
</script>

<template>
  <div class="page">
    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    <!-- Mobile Sidebar -->
    <aside class="mobile-sidebar" :class="{ open: mobileMenuOpen }">
      <div class="mobile-sidebar-header">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <button class="close-menu-btn" @click="closeMobileMenu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <nav class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>Dashboard</router-link>
        <router-link to="/applicators" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Aplicadores</router-link>
        <router-link to="/projects" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Projetos</router-link>
        <router-link to="/reports" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Relatorios</router-link>
        <router-link to="/requests" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Solicitacoes</router-link>
        <router-link to="/campaigns" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Campanhas</router-link>
        <router-link to="/academy" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>Academia</router-link>
        <router-link to="/map" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>Mapa</router-link>
      </nav>
      <div class="mobile-sidebar-footer">
        <div class="mobile-user-info"><div class="user-avatar"><img v-if="getPhotoUrl(authStore.user?.photoUrl)" :src="getPhotoUrl(authStore.user?.photoUrl)!" alt="Avatar" class="avatar-img" /><span v-else>{{ getInitials(authStore.user?.name) }}</span></div><span class="user-name">{{ authStore.user?.name }}</span></div>
        <button @click="logout" class="mobile-logout-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sair</button>
      </div>
    </aside>

    <header class="header">
      <div class="header-left">
        <button class="hamburger-btn" @click="toggleMobileMenu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <span class="logo-badge">ADMIN</span>
      </div>
      <nav class="nav desktop-nav">
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
          <h2>Projetos</h2>
          <p class="page-subtitle">Gerencie seus projetos e obras</p>
        </div>
        <div class="header-actions">
          <select v-model="filter" @change="loadProjects" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="EM_EXECUCAO">Em Execucao</option>
            <option value="AGUARDANDO_INICIO">Aguardando</option>
            <option value="PAUSADO">Pausado</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
          <button @click="openCreateModal" class="btn btn-primary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Criar Projeto
          </button>
          <button @click="downloadTemplate" class="btn btn-secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar Template
          </button>
          <button
            v-if="projects.length > 0"
            @click="showDeleteAllModal = true"
            class="btn btn-danger-outline"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Deletar Todos
          </button>
          <button @click="triggerFileInput" class="btn btn-primary" :disabled="importing">
            <svg v-if="!importing" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div v-else class="btn-spinner"></div>
            {{ importing ? 'Importando...' : 'Importar Excel' }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            style="display: none"
          />
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>Carregando projetos...</span>
      </div>

      <div v-else-if="projects.length === 0" class="empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Nenhum projeto encontrado</p>
        <span class="empty-hint">Importe projetos usando o botao acima</span>
      </div>

      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card" @click="router.push(`/projects/${project.id}`)">
          <span
            class="status-badge"
            :style="{
              borderColor: getStatusColor(project.activeCheckinsCount || 0) + '40'
            }"
          >
            <span
              class="status-dot"
              :style="{ background: getStatusColor(project.activeCheckinsCount || 0) }"
            ></span>
            <span class="status-text">
              {{ getStatusLabel(project.activeCheckinsCount || 0) }} • {{ project.activeCheckinsCount || 0 }}/{{ project._count?.assignments || 0 }}
            </span>
          </span>
          <div class="project-header">
            <div class="project-title-row">
              <h3>{{ project.title }}</h3>
              <!-- Current Stage Badge -->
              <span v-if="project.currentStage" class="current-stage-badge-mini">
                {{ project.currentStage.name }} ({{ project.currentStage.completedCount }}/{{ project.currentStage.totalCount }})
              </span>
              <span v-else class="current-stage-badge-mini no-stages">
                Sem etapas
              </span>
            </div>
            <div class="project-actions">
              <button
                class="edit-btn"
                @click.stop="openEditModal(project)"
                title="Editar projeto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="delete-btn"
                @click.stop="openDeleteModal(project)"
                title="Deletar projeto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="project-content">
            <div class="project-client">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {{ project.cliente || 'Cliente nao informado' }}
            </div>
            <div class="project-address">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ project.endereco || 'Endereco nao informado' }}
            </div>
          </div>
          <div class="project-stats">
            <div class="stat">
              <div class="stat-icon stat-icon-m2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ getProjectM2Total(project)?.toLocaleString() || 0 }}</span>
                <span class="stat-label">m² Total</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon stat-icon-hours">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ project.workedHours?.toFixed(1) || 0 }}h</span>
                <span class="stat-label">Trabalhadas</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon stat-icon-team">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ project._count?.assignments || 0 }}</span>
                <span class="stat-label">Equipe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Confirmar Exclusao</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o projeto <strong>{{ projectToDelete?.title }}</strong>?</p>
          <p class="modal-warning">Esta acao nao pode ser desfeita. Todos os dados relacionados (check-ins, relatorios, documentos) serao removidos.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">Cancelar</button>
          <button
            class="btn btn-danger"
            @click="confirmDelete"
            :disabled="deleting === projectToDelete?.id"
          >
            <div v-if="deleting === projectToDelete?.id" class="btn-spinner"></div>
            {{ deleting === projectToDelete?.id ? 'Excluindo...' : 'Excluir Projeto' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Confirmation Modal -->
    <div v-if="showDeleteAllModal" class="modal-overlay" @click="showDeleteAllModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon modal-icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Deletar TODOS os Projetos</h3>
        </div>
        <div class="modal-body">
          <p>Voce esta prestes a excluir <strong>{{ projects.length }} projetos</strong>.</p>
          <p class="modal-warning">ATENCAO: Esta acao ira remover TODOS os projetos e seus dados relacionados (check-ins, relatorios, documentos). Esta acao NAO pode ser desfeita!</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteAllModal = false">Cancelar</button>
          <button
            class="btn btn-danger"
            @click="confirmDeleteAll"
            :disabled="deletingAll"
          >
            <div v-if="deletingAll" class="btn-spinner"></div>
            {{ deletingAll ? 'Excluindo...' : 'Sim, Deletar Todos' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon modal-icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <h3>Criar Novo Projeto</h3>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nome do Projeto *</label>
              <input
                v-model="newProject.title"
                type="text"
                placeholder="Ex: Residencia Silva"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Cliente</label>
              <input
                v-model="newProject.cliente"
                type="text"
                placeholder="Nome do cliente"
                class="form-input"
              />
            </div>
            <div class="form-group full-width">
              <label>
                Endereco
                <span v-if="locationFound" class="location-found">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Localizacao encontrada
                </span>
              </label>
              <input
                ref="enderecoInput"
                v-model="newProject.endereco"
                type="text"
                placeholder="Digite o endereco e selecione da lista"
                class="form-input"
                :class="{ 'has-location': locationFound }"
              />
            </div>
            <div class="form-group">
              <label>m² Total (Calculado)</label>
              <input
                :value="calculatedM2TotalNew"
                type="number"
                class="form-input calculated-field"
                readonly
                disabled
              />
            </div>
            <div class="form-group">
              <label>m² Piso</label>
              <input
                v-model.number="newProject.m2Piso"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>m² Parede</label>
              <input
                v-model.number="newProject.m2Parede"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>m² Teto</label>
              <input
                v-model.number="newProject.m2Teto"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Metros Rodape</label>
              <input
                v-model.number="newProject.mRodape"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group full-width" v-if="locationFound || newProject.latitude || newProject.longitude">
              <label>Coordenadas (preenchidas automaticamente)</label>
              <div class="coordinates-display">
                <div class="coordinate">
                  <span class="coord-label">Lat:</span>
                  <span class="coord-value">{{ newProject.latitude?.toFixed(6) || '-' }}</span>
                </div>
                <div class="coordinate">
                  <span class="coord-label">Lng:</span>
                  <span class="coord-value">{{ newProject.longitude?.toFixed(6) || '-' }}</span>
                </div>
                <a
                  v-if="newProject.latitude && newProject.longitude"
                  :href="`https://www.google.com/maps?q=${newProject.latitude},${newProject.longitude}`"
                  target="_blank"
                  class="map-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Ver no mapa
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateModal">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="createProject"
            :disabled="creating"
          >
            <div v-if="creating" class="btn-spinner"></div>
            {{ creating ? 'Criando...' : 'Criar Projeto' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Project Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <svg class="modal-icon modal-icon-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <h3>Editar Projeto</h3>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nome do Projeto *</label>
              <input
                v-model="editProject.title"
                type="text"
                placeholder="Ex: Residencia Silva"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Cliente</label>
              <input
                v-model="editProject.cliente"
                type="text"
                placeholder="Nome do cliente"
                class="form-input"
              />
            </div>
            <div class="form-group full-width">
              <label>Endereco</label>
              <input
                v-model="editProject.endereco"
                type="text"
                placeholder="Digite o endereco"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>m² Total (Calculado)</label>
              <input
                :value="calculatedM2TotalEdit"
                type="number"
                class="form-input calculated-field"
                readonly
                disabled
              />
            </div>
            <div class="form-group">
              <label>m² Piso</label>
              <input
                v-model.number="editProject.m2Piso"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>m² Parede</label>
              <input
                v-model.number="editProject.m2Parede"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>m² Teto</label>
              <input
                v-model.number="editProject.m2Teto"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Metros Rodape</label>
              <input
                v-model.number="editProject.mRodape"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>
            <div class="form-group full-width" v-if="editProject.latitude || editProject.longitude">
              <label>Coordenadas</label>
              <div class="coordinates-display">
                <div class="coordinate">
                  <span class="coord-label">Lat:</span>
                  <span class="coord-value">{{ editProject.latitude?.toFixed(6) || '-' }}</span>
                </div>
                <div class="coordinate">
                  <span class="coord-label">Lng:</span>
                  <span class="coord-value">{{ editProject.longitude?.toFixed(6) || '-' }}</span>
                </div>
                <a
                  v-if="editProject.latitude && editProject.longitude"
                  :href="`https://www.google.com/maps?q=${editProject.latitude},${editProject.longitude}`"
                  target="_blank"
                  class="map-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Ver no mapa
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="updateProject"
            :disabled="editing"
          >
            <div v-if="editing" class="btn-spinner"></div>
            {{ editing ? 'Salvando...' : 'Salvar Alteracoes' }}
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
  flex-wrap: wrap;
  gap: 16px;
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 160px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filter-select option {
  background: var(--bg-card);
  color: var(--text-primary);
}

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
  border-color: var(--text-tertiary);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  gap: 12px;
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

.empty-hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 24px 24px 32px 24px;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  position: relative;
}

.project-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.project-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.project-title-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Mini current stage badge for project cards */
.current-stage-badge-mini {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #c9a962, #f59e0b);
  color: #1a1a1a;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.7rem;
  white-space: nowrap;
  max-width: fit-content;
}

.current-stage-badge-mini.no-stages {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: #fff;
}

.status-badge {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
  z-index: 1;
  background: #000;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
}

.project-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.project-client,
.project-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.project-address {
  color: var(--text-tertiary);
  font-size: 13px;
  justify-content: center;
}

.project-stats {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 18px;
  height: 18px;
}

.stat-icon-m2 {
  background: rgba(201, 169, 98, 0.1);
  color: var(--accent-primary);
}

.stat-icon-hours {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.stat-icon-team {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Project Actions */
.project-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  background: rgba(201, 169, 98, 0.1);
  border: 1px solid rgba(201, 169, 98, 0.2);
  color: var(--accent-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.project-card:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: rgba(201, 169, 98, 0.2);
  border-color: var(--accent-primary);
}

.edit-btn svg {
  width: 16px;
  height: 16px;
}

.delete-btn {
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
  opacity: 0;
}

.project-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: var(--accent-red);
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal Styles */
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
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
}

.modal-icon {
  width: 24px;
  height: 24px;
  color: var(--accent-orange);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.modal-body p:last-child {
  margin-bottom: 0;
}

.modal-warning {
  color: var(--accent-red) !important;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: var(--border-radius);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 13px !important;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
}

.btn-danger {
  background: var(--accent-red);
  color: #fff;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-danger .btn-spinner {
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
}

.btn-danger-outline {
  background: transparent;
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
}

.btn-danger-outline:hover {
  background: rgba(239, 68, 68, 0.1);
}

.modal-icon-danger {
  color: var(--accent-red) !important;
}

.modal-icon-success {
  color: var(--accent-primary) !important;
}

.modal-icon-edit {
  color: var(--accent-primary) !important;
}

.modal-large {
  max-width: 640px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.btn-primary .btn-spinner {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: #000;
}

/* Location found indicator */
.location-found {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  font-size: 11px;
  color: var(--accent-green);
  font-weight: 500;
}

.location-found svg {
  width: 12px;
  height: 12px;
}

.form-input.has-location {
  border-color: var(--accent-green);
  background: rgba(34, 197, 94, 0.05);
}

/* Coordinates display */
.coordinates-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.coordinate {
  display: flex;
  align-items: center;
  gap: 6px;
}

.coord-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.coord-value {
  font-size: 13px;
  color: var(--text-primary);
  font-family: monospace;
}

.map-link {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--border-radius);
  color: var(--accent-blue);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.map-link:hover {
  background: rgba(59, 130, 246, 0.2);
}

.map-link svg {
  width: 14px;
  height: 14px;
}

/* Google Places Autocomplete dropdown styling */
:global(.pac-container) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--border-radius) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
  margin-top: 4px !important;
  z-index: 10000 !important;
}

:global(.pac-item) {
  padding: 10px 14px !important;
  border-top: 1px solid var(--border-color) !important;
  cursor: pointer !important;
  color: var(--text-primary) !important;
  font-size: 14px !important;
}

:global(.pac-item:first-child) {
  border-top: none !important;
}

:global(.pac-item:hover),
:global(.pac-item-selected) {
  background-color: var(--bg-secondary) !important;
}

:global(.pac-icon) {
  margin-right: 10px !important;
}

:global(.pac-item-query) {
  color: var(--text-primary) !important;
  font-weight: 500 !important;
}

:global(.pac-matched) {
  color: var(--accent-primary) !important;
  font-weight: 600 !important;
}

.calculated-field {
  background: rgba(201, 169, 98, 0.1) !important;
  color: #c9a962 !important;
  font-weight: 600;
  cursor: not-allowed;
  border-color: rgba(201, 169, 98, 0.3) !important;
}

/* ===== MOBILE RESPONSIVE STYLES ===== */
.hamburger-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; border-radius: var(--border-radius); }
.hamburger-btn:hover { background-color: var(--bg-secondary); }
.mobile-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); z-index: 998; }
.mobile-sidebar { display: none; position: fixed; top: 0; left: -280px; width: 280px; height: 100vh; background-color: var(--bg-card); border-right: 1px solid var(--border-color); z-index: 999; transition: left 0.3s ease; flex-direction: column; }
.mobile-sidebar.open { left: 0; }
.mobile-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.close-menu-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; border-radius: var(--border-radius); }
.close-menu-btn:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
.mobile-nav { flex: 1; padding: 16px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.mobile-nav-link { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--border-radius); text-decoration: none; color: var(--text-secondary); font-weight: 500; font-size: 15px; transition: all 0.2s; }
.mobile-nav-link:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
.mobile-nav-link.router-link-active { background-color: rgba(201, 169, 98, 0.15); color: var(--accent-primary); }
.mobile-sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border-color); }
.mobile-user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.mobile-user-info .user-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.mobile-logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; background-color: rgba(239, 68, 68, 0.1); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--border-radius); cursor: pointer; font-weight: 500; font-size: 14px; }
.mobile-logout-btn:hover { background-color: rgba(239, 68, 68, 0.2); }

@media (max-width: 768px) {
  .hamburger-btn { display: flex; }
  .mobile-overlay { display: block; }
  .mobile-sidebar { display: flex; }
  .desktop-nav { display: none !important; }
  .header-right { display: none; }
  .header { padding: 12px 16px; }
  .header-left { gap: 8px; }
  .header-logo { height: 28px; }
  .logo-badge { font-size: 9px; padding: 3px 6px; }
  .main { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .page-title h2 { font-size: 20px; }
  .search-box { width: 100%; }
  .search-input { width: 100%; }
}
</style>
