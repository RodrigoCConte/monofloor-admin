<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { campaignsApi, badgesApi, notificationsApi } from '../api';

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

// Main tab
const activeMainTab = ref<'campaigns' | 'badges' | 'notifications'>('campaigns');

const campaigns = ref<any[]>([]);
const loading = ref(true);
const filter = ref('all');
const totalApplicators = ref(0);

// Badges state
const badges = ref<any[]>([]);
const badgesLoading = ref(false);
const badgesFilter = ref('all');
const showBadgeModal = ref(false);
const editingBadge = ref<any>(null);
const badgeUploading = ref(false);
const badgeFormData = ref({
  name: '',
  description: '',
  iconUrl: '',
  color: '#c9a962',
  category: 'CAMPAIGN',
  rarity: 'COMMON',
});

// Notifications state
const notifications = ref<any[]>([]);
const notificationsLoading = ref(false);
const notificationsFilter = ref('all');
const showNotificationModal = ref(false);
const editingNotification = ref<any>(null);
const notificationVideoUploading = ref(false);
const notificationFormData = ref({
  title: '',
  message: '',
  videoUrl: '',
  videoDuration: 0,
  xpReward: 0,
});

// Modal states
const showCreateModal = ref(false);
const showImportModal = ref(false);
const showWinnersModal = ref(false);
const editingCampaign = ref<any>(null);
const importJson = ref('');

// Winners/Participants selection
const winnersLoading = ref(false);
const availableParticipants = ref<any[]>([]);
const selectedWinners = ref<any[]>([]);
const winnerXpAmounts = ref<{ [key: string]: number }>({});
const selectedCampaign = ref<any>(null);
const participantsMode = ref<'winners' | 'participants'>('participants');

// Form data
const formData = ref({
  name: '',
  description: '',
  bannerUrl: '',
  bannerType: 'video',
  startDate: '',
  endDate: '',
  xpBonus: 0,
  xpMultiplier: 1.0,
  badgeId: null as string | null,
});

// Available badges
const availableBadges = ref<any[]>([]);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Computed stats for hero
const activeCampaignsCount = computed(() =>
  campaigns.value.filter(c => c.status === 'ACTIVE').length
);

const totalParticipants = computed(() =>
  campaigns.value.reduce((sum, c) => sum + (c.participantsCount || 0), 0)
);

const loadCampaigns = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filter.value !== 'all') {
      params.status = filter.value;
    }
    const response = await campaignsApi.getAll(params);
    campaigns.value = response.data.data || [];
    totalApplicators.value = response.data.meta?.totalApplicators || 0;
  } catch (error) {
    console.error('Error loading campaigns:', error);
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'var(--accent-green)';
    case 'DRAFT': return 'var(--text-tertiary)';
    case 'SCHEDULED': return 'var(--accent-blue)';
    case 'ENDED': return 'var(--accent-orange)';
    case 'CANCELLED': return 'var(--accent-red)';
    default: return 'var(--text-tertiary)';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'Ativa';
    case 'DRAFT': return 'Rascunho';
    case 'SCHEDULED': return 'Agendada';
    case 'ENDED': return 'Encerrada';
    case 'CANCELLED': return 'Cancelada';
    default: return status;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const openCreateModal = (campaign?: any) => {
  if (campaign) {
    editingCampaign.value = campaign;
    formData.value = {
      name: campaign.name,
      description: campaign.description || '',
      bannerUrl: campaign.bannerUrl || '',
      bannerType: campaign.bannerType || 'video',
      startDate: campaign.startDate?.split('T')[0] || '',
      endDate: campaign.endDate?.split('T')[0] || '',
      xpBonus: campaign.xpBonus || 0,
      xpMultiplier: campaign.xpMultiplier || 1.0,
      badgeId: campaign.badgeId || null,
    };
  } else {
    editingCampaign.value = null;
    formData.value = {
      name: '',
      description: '',
      bannerUrl: '',
      bannerType: 'video',
      startDate: '',
      endDate: '',
      xpBonus: 0,
      xpMultiplier: 1.0,
      badgeId: null,
    };
  }
  showCreateModal.value = true;
};

const saveCampaign = async () => {
  try {
    if (editingCampaign.value) {
      await campaignsApi.update(editingCampaign.value.id, formData.value);
    } else {
      await campaignsApi.create(formData.value);
    }
    showCreateModal.value = false;
    await loadCampaigns();
  } catch (error) {
    console.error('Error saving campaign:', error);
    alert('Erro ao salvar campanha');
  }
};

const deleteCampaign = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta campanha?')) {
    try {
      await campaignsApi.delete(id);
      await loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Erro ao excluir campanha');
    }
  }
};

const launchCampaign = async (id: string) => {
  if (confirm('Tem certeza que deseja lancar esta campanha? Notificacoes serao enviadas para todos aplicadores.')) {
    try {
      await campaignsApi.launch(id);
      await loadCampaigns();
      alert('Campanha lancada com sucesso!');
    } catch (error) {
      console.error('Error launching campaign:', error);
      alert('Erro ao lancar campanha');
    }
  }
};

const openImportModal = () => {
  importJson.value = '';
  showImportModal.value = true;
};

const importCampaign = async () => {
  try {
    const data = JSON.parse(importJson.value);
    await campaignsApi.import(data);
    showImportModal.value = false;
    await loadCampaigns();
    alert('Campanha importada com sucesso!');
  } catch (error) {
    console.error('Error importing campaign:', error);
    alert('Erro ao importar campanha. Verifique o formato do JSON.');
  }
};

const exportCampaign = async (id: string) => {
  try {
    const response = await campaignsApi.export(id);
    const dataStr = JSON.stringify(response.data.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting campaign:', error);
    alert('Erro ao exportar campanha');
  }
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  try {
    const response = await campaignsApi.uploadMedia(input.files[0]);
    const fileUrl = response.data.data.url;
    formData.value.bannerUrl = fileUrl;
    formData.value.bannerType = response.data.data.type;
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Erro ao fazer upload do arquivo');
  }
};

// Resend banner notification to non-participants
const resendBanner = async (campaign: any) => {
  if (confirm(`Reenviar banner da campanha "${campaign.name}" para aplicadores que ainda nao participam?`)) {
    try {
      const response = await campaignsApi.resendBanner(campaign.id);
      const data = response.data;
      alert(data.message || 'Banner reenviado com sucesso!');
    } catch (error: any) {
      console.error('Error resending banner:', error);
      alert(error.response?.data?.message || 'Erro ao reenviar banner');
    }
  }
};

// Open winners selection modal
const openWinnersModal = async (campaign: any) => {
  participantsMode.value = 'winners';
  selectedCampaign.value = campaign;
  winnersLoading.value = true;
  selectedWinners.value = [];
  winnerXpAmounts.value = {};
  showWinnersModal.value = true;

  try {
    // Get campaign details with participants
    const response = await campaignsApi.getById(campaign.id);
    const campaignData = response.data.data;

    // Get participants from the campaign
    availableParticipants.value = campaignData.participants || [];

    // Pre-fill with existing winners if any
    if (campaignData.winners) {
      selectedWinners.value = campaignData.winners.map((w: any) => w.userId);
      campaignData.winners.forEach((w: any) => {
        winnerXpAmounts.value[w.userId] = w.xpAwarded || campaign.xpBonus || 100;
      });
    }
  } catch (error) {
    console.error('Error loading participants:', error);
    alert('Erro ao carregar participantes');
    showWinnersModal.value = false;
  } finally {
    winnersLoading.value = false;
  }
};

// Open participants modal (view/manage mode)
const openParticipantsModal = async (campaign: any) => {
  participantsMode.value = 'participants';
  selectedCampaign.value = campaign;
  winnersLoading.value = true;
  selectedWinners.value = [];
  winnerXpAmounts.value = {};
  showWinnersModal.value = true;

  try {
    // Get campaign details with participants
    const response = await campaignsApi.getById(campaign.id);
    const campaignData = response.data.data;

    // Get participants from the campaign
    availableParticipants.value = campaignData.participants || [];
  } catch (error) {
    console.error('Error loading participants:', error);
    alert('Erro ao carregar participantes');
    showWinnersModal.value = false;
  } finally {
    winnersLoading.value = false;
  }
};

// Toggle winner selection
const toggleWinner = (userId: string) => {
  const index = selectedWinners.value.indexOf(userId);
  if (index > -1) {
    selectedWinners.value.splice(index, 1);
    delete winnerXpAmounts.value[userId];
  } else {
    selectedWinners.value.push(userId);
    winnerXpAmounts.value[userId] = selectedCampaign.value?.xpBonus || 100;
  }
};

// Check if a user is selected as winner
const isWinnerSelected = (userId: string) => {
  return selectedWinners.value.includes(userId);
};

// Save winners
const saveWinners = async () => {
  if (selectedWinners.value.length === 0) {
    alert('Selecione pelo menos um vencedor');
    return;
  }

  try {
    const winnersData = selectedWinners.value.map((userId, index) => ({
      userId,
      position: index + 1,
      xpAwarded: winnerXpAmounts.value[userId] || selectedCampaign.value?.xpBonus || 100
    }));

    // Call API to save winners
    await campaignsApi.saveWinners(selectedCampaign.value.id, winnersData);

    showWinnersModal.value = false;
    alert('Vencedores salvos com sucesso! XP atribuido e notificacoes enviadas.');
    await loadCampaigns();
  } catch (error) {
    console.error('Error saving winners:', error);
    alert('Erro ao salvar vencedores');
  }
};

// Remove participant from campaign
const removeParticipant = async (userId: string, userName: string) => {
  if (!selectedCampaign.value) return;

  if (confirm(`Remover ${userName} da campanha "${selectedCampaign.value.name}"?`)) {
    try {
      await campaignsApi.removeParticipant(selectedCampaign.value.id, userId);

      // Remove from local list
      availableParticipants.value = availableParticipants.value.filter(p => p.userId !== userId);

      // Also remove from selected winners if selected
      const winnerIndex = selectedWinners.value.indexOf(userId);
      if (winnerIndex > -1) {
        selectedWinners.value.splice(winnerIndex, 1);
        delete winnerXpAmounts.value[userId];
      }

      // Reload campaigns to update participant count
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error removing participant:', error);
      alert(error.response?.data?.message || 'Erro ao remover participante');
    }
  }
};

// Notify winners (send banner/notification)
const notifyWinners = async () => {
  if (selectedWinners.value.length === 0) {
    alert('Selecione pelo menos um vencedor');
    return;
  }

  try {
    await campaignsApi.notifyWinners(selectedCampaign.value.id, selectedWinners.value);
    alert('Notificacoes enviadas aos vencedores!');
  } catch (error) {
    console.error('Error notifying winners:', error);
    alert('Erro ao notificar vencedores');
  }
};

// Load available badges for campaign selection
const loadBadges = async () => {
  try {
    const response = await badgesApi.getAll({ isActive: true });
    availableBadges.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading badges:', error);
  }
};

// ========== BADGES MANAGEMENT ==========

// Load all badges for the badges tab
const loadBadgesList = async () => {
  badgesLoading.value = true;
  try {
    const response = await badgesApi.getAll();
    badges.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading badges:', error);
  } finally {
    badgesLoading.value = false;
  }
};

// Filter badges
const filteredBadges = computed(() => {
  if (badgesFilter.value === 'all') return badges.value;
  return badges.value.filter(b => b.category === badgesFilter.value);
});

// Badge stats
const totalBadges = computed(() => badges.value.length);
const campaignBadgesCount = computed(() => badges.value.filter(b => b.category === 'CAMPAIGN').length);
const achievementBadgesCount = computed(() => badges.value.filter(b => b.category === 'ACHIEVEMENT').length);

// Open badge modal
const openBadgeModal = (badge?: any) => {
  if (badge) {
    editingBadge.value = badge;
    badgeFormData.value = {
      name: badge.name,
      description: badge.description || '',
      iconUrl: badge.iconUrl || '',
      color: badge.color || '#c9a962',
      category: badge.category || 'CAMPAIGN',
      rarity: badge.rarity || 'COMMON',
    };
  } else {
    editingBadge.value = null;
    badgeFormData.value = {
      name: '',
      description: '',
      iconUrl: '',
      color: '#c9a962',
      category: 'CAMPAIGN',
      rarity: 'COMMON',
    };
  }
  showBadgeModal.value = true;
};

// Handle badge icon upload
const handleBadgeIconUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  badgeUploading.value = true;
  try {
    const response = await badgesApi.uploadIcon(input.files[0]);
    badgeFormData.value.iconUrl = response.data.data.url;
    alert('Icone enviado com sucesso!');
  } catch (error) {
    console.error('Error uploading icon:', error);
    alert('Erro ao enviar icone');
  } finally {
    badgeUploading.value = false;
  }
};

// Save badge
const saveBadgeItem = async () => {
  if (!badgeFormData.value.name || !badgeFormData.value.iconUrl) {
    alert('Nome e icone sao obrigatorios');
    return;
  }

  try {
    if (editingBadge.value) {
      await badgesApi.update(editingBadge.value.id, badgeFormData.value);
    } else {
      await badgesApi.create(badgeFormData.value);
    }
    showBadgeModal.value = false;
    loadBadgesList();
    loadBadges(); // Also refresh available badges for campaigns
    alert(editingBadge.value ? 'Badge atualizado!' : 'Badge criado!');
  } catch (error) {
    console.error('Error saving badge:', error);
    alert('Erro ao salvar badge');
  }
};

// Delete badge
const deleteBadgeItem = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este badge?')) return;

  try {
    await badgesApi.delete(id);
    loadBadgesList();
    loadBadges();
    alert('Badge excluido!');
  } catch (error: any) {
    console.error('Error deleting badge:', error);
    alert(error.response?.data?.error?.message || 'Erro ao excluir badge');
  }
};

// Helper functions for badges
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

// Switch main tab
const switchMainTab = (tab: 'campaigns' | 'badges' | 'notifications') => {
  activeMainTab.value = tab;
  if (tab === 'badges' && badges.value.length === 0) {
    loadBadgesList();
  }
  if (tab === 'notifications' && notifications.value.length === 0) {
    loadNotifications();
  }
};

// ========== NOTIFICATIONS MANAGEMENT ==========

// Computed stats for notifications
const totalNotifications = computed(() => notifications.value.length);
const activeNotificationsCount = computed(() => notifications.value.filter(n => n.isActive).length);
const totalNotificationViews = computed(() => notifications.value.reduce((sum, n) => sum + (n.viewsCount || 0), 0));

// Load all notifications
const loadNotifications = async () => {
  notificationsLoading.value = true;
  try {
    const params: any = {};
    if (notificationsFilter.value === 'active') {
      params.isActive = true;
    } else if (notificationsFilter.value === 'inactive') {
      params.isActive = false;
    }
    const response = await notificationsApi.getAll(params);
    notifications.value = response.data.data?.notifications || [];
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    notificationsLoading.value = false;
  }
};

// Open notification modal
const openNotificationModal = (notification?: any) => {
  if (notification) {
    editingNotification.value = notification;
    notificationFormData.value = {
      title: notification.title,
      message: notification.message || '',
      videoUrl: notification.videoUrl || '',
      videoDuration: notification.videoDuration || 0,
      xpReward: notification.xpReward || 0,
    };
  } else {
    editingNotification.value = null;
    notificationFormData.value = {
      title: '',
      message: '',
      videoUrl: '',
      videoDuration: 0,
      xpReward: 0,
    };
  }
  showNotificationModal.value = true;
};

// Handle notification video upload
const handleNotificationVideoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  notificationVideoUploading.value = true;
  try {
    const response = await notificationsApi.uploadVideo(input.files[0]);
    notificationFormData.value.videoUrl = response.data.data.url;
    alert('Video enviado com sucesso!');
  } catch (error) {
    console.error('Error uploading video:', error);
    alert('Erro ao enviar video');
  } finally {
    notificationVideoUploading.value = false;
  }
};

// Save notification
const saveNotification = async () => {
  if (!notificationFormData.value.title || !notificationFormData.value.message) {
    alert('Titulo e mensagem sao obrigatorios');
    return;
  }

  try {
    if (editingNotification.value) {
      await notificationsApi.update(editingNotification.value.id, notificationFormData.value);
    } else {
      await notificationsApi.create(notificationFormData.value);
    }
    showNotificationModal.value = false;
    loadNotifications();
    alert(editingNotification.value ? 'Notificacao atualizada!' : 'Notificacao criada!');
  } catch (error) {
    console.error('Error saving notification:', error);
    alert('Erro ao salvar notificacao');
  }
};

// Delete notification
const deleteNotification = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir esta notificacao?')) return;

  try {
    await notificationsApi.delete(id);
    loadNotifications();
    alert('Notificacao excluida!');
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    alert(error.response?.data?.error?.message || 'Erro ao excluir notificacao');
  }
};

// Send notification to all users
const sendNotification = async (id: string) => {
  if (!confirm('Enviar esta notificacao para todos os usuarios conectados?')) return;

  try {
    await notificationsApi.send(id);
    alert('Notificacao enviada para todos os usuarios!');
  } catch (error: any) {
    console.error('Error sending notification:', error);
    alert(error.response?.data?.error?.message || 'Erro ao enviar notificacao');
  }
};

// Toggle notification active status
const toggleNotificationActive = async (notification: any) => {
  try {
    await notificationsApi.update(notification.id, { isActive: !notification.isActive });
    loadNotifications();
  } catch (error) {
    console.error('Error toggling notification status:', error);
    alert('Erro ao alterar status da notificacao');
  }
};

onMounted(() => {
  loadCampaigns();
  loadBadges();
});
</script>

<template>
  <div class="campaigns-page">
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
        <router-link to="/contributions" class="nav-link">
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
        <router-link to="/proposals" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Propostas
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

    <!-- Hero Cover -->
    <div class="campaigns-hero">
      <div class="hero-background">
        <div class="hero-pattern"></div>
        <div class="hero-glow"></div>
      </div>
      <div class="hero-content">
        <!-- Main Tabs -->
        <div class="main-tabs">
          <button
            :class="['main-tab', { active: activeMainTab === 'campaigns' }]"
            @click="switchMainTab('campaigns')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            Campanhas
          </button>
          <button
            :class="['main-tab', { active: activeMainTab === 'badges' }]"
            @click="switchMainTab('badges')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
            Badges
          </button>
          <button
            :class="['main-tab', { active: activeMainTab === 'notifications' }]"
            @click="switchMainTab('notifications')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notificacoes
          </button>
        </div>

        <!-- Campaigns Hero Content -->
        <template v-if="activeMainTab === 'campaigns'">
          <div class="hero-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div class="hero-text">
            <h2>Campanhas de Incentivo</h2>
            <p>Crie desafios, defina bonus de XP e engaje sua equipe com campanhas interativas</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">{{ campaigns.length }}</span>
              <span class="hero-stat-label">Campanhas</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ activeCampaignsCount }}</span>
              <span class="hero-stat-label">Ativas</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalParticipants }}</span>
              <span class="hero-stat-label">Participacoes</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalApplicators }}</span>
              <span class="hero-stat-label">Aplicadores</span>
            </div>
          </div>
        </template>

        <!-- Badges Hero Content -->
        <template v-else-if="activeMainTab === 'badges'">
          <div class="hero-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <div class="hero-text">
            <h2>Badges e Conquistas</h2>
            <p>Crie badges para premiar seus aplicadores em campanhas e conquistas</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalBadges }}</span>
              <span class="hero-stat-label">Total</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ campaignBadgesCount }}</span>
              <span class="hero-stat-label">Campanhas</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ achievementBadgesCount }}</span>
              <span class="hero-stat-label">Conquistas</span>
            </div>
          </div>
        </template>

        <!-- Notifications Hero Content -->
        <template v-else>
          <div class="hero-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="hero-text">
            <h2>Notificacoes com Video</h2>
            <p>Envie notificacoes personalizadas com videos que premiam XP ao serem assistidos</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalNotifications }}</span>
              <span class="hero-stat-label">Total</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ activeNotificationsCount }}</span>
              <span class="hero-stat-label">Ativas</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{{ totalNotificationViews }}</span>
              <span class="hero-stat-label">Visualizacoes</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Actions Bar - Campaigns -->
    <div v-if="activeMainTab === 'campaigns'" class="actions-bar">
      <div class="filter-tabs">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'; loadCampaigns()">Todas</button>
        <button :class="{ active: filter === 'ACTIVE' }" @click="filter = 'ACTIVE'; loadCampaigns()">Ativas</button>
        <button :class="{ active: filter === 'DRAFT' }" @click="filter = 'DRAFT'; loadCampaigns()">Rascunhos</button>
        <button :class="{ active: filter === 'ENDED' }" @click="filter = 'ENDED'; loadCampaigns()">Encerradas</button>
      </div>
      <div class="action-buttons">
        <button class="btn-secondary" @click="openImportModal">Importar JSON</button>
        <button class="btn-primary" @click="openCreateModal()">Nova Campanha</button>
      </div>
    </div>

    <!-- Actions Bar - Badges -->
    <div v-else-if="activeMainTab === 'badges'" class="actions-bar">
      <div class="filter-tabs">
        <button :class="{ active: badgesFilter === 'all' }" @click="badgesFilter = 'all'">Todos</button>
        <button :class="{ active: badgesFilter === 'CAMPAIGN' }" @click="badgesFilter = 'CAMPAIGN'">Campanhas</button>
        <button :class="{ active: badgesFilter === 'ACHIEVEMENT' }" @click="badgesFilter = 'ACHIEVEMENT'">Conquistas</button>
        <button :class="{ active: badgesFilter === 'SPECIAL' }" @click="badgesFilter = 'SPECIAL'">Especiais</button>
        <button :class="{ active: badgesFilter === 'ROLE' }" @click="badgesFilter = 'ROLE'">Cargos</button>
      </div>
      <div class="action-buttons">
        <button class="btn-primary" @click="openBadgeModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Badge
        </button>
      </div>
    </div>

    <!-- Actions Bar - Notifications -->
    <div v-else class="actions-bar">
      <div class="filter-tabs">
        <button :class="{ active: notificationsFilter === 'all' }" @click="notificationsFilter = 'all'; loadNotifications()">Todas</button>
        <button :class="{ active: notificationsFilter === 'active' }" @click="notificationsFilter = 'active'; loadNotifications()">Ativas</button>
        <button :class="{ active: notificationsFilter === 'inactive' }" @click="notificationsFilter = 'inactive'; loadNotifications()">Inativas</button>
      </div>
      <div class="action-buttons">
        <button class="btn-primary" @click="openNotificationModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nova Notificacao
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="page-content">
      <!-- Campaigns Content -->
      <template v-if="activeMainTab === 'campaigns'">
        <div v-if="loading" class="loading">Carregando...</div>

        <div v-else-if="campaigns.length === 0" class="empty-state">
          Nenhuma campanha encontrada
        </div>

        <div v-else class="campaigns-grid">
        <div v-for="campaign in campaigns" :key="campaign.id" class="campaign-card">
          <!-- Banner Preview -->
          <div class="campaign-banner">
            <video v-if="campaign.bannerType === 'video' && campaign.bannerUrl" :src="`${API_URL}${campaign.bannerUrl}`" muted loop autoplay playsinline></video>
            <img v-else-if="campaign.bannerUrl" :src="`${API_URL}${campaign.bannerUrl}`" :alt="campaign.name" />
            <div v-else class="no-banner">Sem banner</div>
          </div>

          <!-- Campaign Info -->
          <div class="campaign-info">
            <div class="campaign-header">
              <h3>{{ campaign.name }}</h3>
              <span class="status-badge" :style="{ backgroundColor: getStatusColor(campaign.status) }">
                {{ getStatusLabel(campaign.status) }}
              </span>
            </div>

            <p class="campaign-description" v-if="campaign.description">{{ campaign.description }}</p>

            <div class="campaign-dates">
              <span>{{ formatDate(campaign.startDate) }} - {{ formatDate(campaign.endDate) }}</span>
            </div>

            <div class="campaign-stats">
              <div class="stat">
                <span class="stat-value">{{ campaign.participantsCount || 0 }}/{{ totalApplicators }}</span>
                <span class="stat-label">Participantes</span>
              </div>
              <div class="stat">
                <span class="stat-value">+{{ campaign.xpBonus }}</span>
                <span class="stat-label">XP Bonus</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ campaign.xpMultiplier }}x</span>
                <span class="stat-label">Multiplicador</span>
              </div>
            </div>

            <div class="campaign-actions">
              <button class="btn-icon" @click="openCreateModal(campaign)" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon" @click="exportCampaign(campaign.id)" title="Exportar JSON">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <!-- Ver Participantes -->
              <button v-if="campaign.participantsCount > 0" class="btn-icon btn-participants" @click="openParticipantsModal(campaign)" title="Ver Participantes">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
              <!-- Reenviar Banner -->
              <button v-if="campaign.status === 'ACTIVE'" class="btn-icon btn-resend" @click="resendBanner(campaign)" title="Reenviar Banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                </svg>
              </button>
              <!-- Selecionar Vencedores -->
              <button v-if="campaign.status === 'ACTIVE' || campaign.status === 'ENDED'" class="btn-icon btn-winners" @click="openWinnersModal(campaign)" title="Selecionar Vencedores">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </button>
              <button v-if="campaign.status === 'DRAFT'" class="btn-launch" @click="launchCampaign(campaign.id)" title="Lancar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Lancar
              </button>
              <button class="btn-icon btn-danger" @click="deleteCampaign(campaign.id)" title="Excluir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- Badges Content -->
      <template v-else-if="activeMainTab === 'badges'">
        <div v-if="badgesLoading" class="loading">Carregando badges...</div>

        <div v-else-if="filteredBadges.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
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
              <button class="btn-icon-action btn-edit" @click="openBadgeModal(badge)" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-delete" @click="deleteBadgeItem(badge.id)" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Notifications Content -->
      <template v-else>
        <div v-if="notificationsLoading" class="loading">Carregando notificacoes...</div>

        <div v-else-if="notifications.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>Nenhuma notificacao encontrada</p>
        </div>

        <div v-else class="notifications-grid">
          <div v-for="notification in notifications" :key="notification.id" class="notification-card">
            <div class="notification-header">
              <div class="notification-icon" :class="{ 'has-video': notification.videoUrl }">
                <svg v-if="notification.videoUrl" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div class="notification-status" :class="{ active: notification.isActive }">
                {{ notification.isActive ? 'Ativa' : 'Inativa' }}
              </div>
            </div>
            <div class="notification-content">
              <h3 class="notification-title">{{ notification.title }}</h3>
              <p class="notification-message">{{ notification.message }}</p>
              <div class="notification-meta">
                <span v-if="notification.xpReward > 0" class="xp-reward">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  +{{ notification.xpReward }} XP
                </span>
                <span v-if="notification.videoUrl" class="has-video-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Video
                </span>
              </div>
              <div class="notification-stats">
                <span>{{ notification.viewsCount || 0 }} visualizacoes</span>
                <span>{{ notification.completedCount || 0 }} completas</span>
              </div>
            </div>
            <div class="notification-actions">
              <button class="btn-icon-action btn-send" @click="sendNotification(notification.id)" title="Enviar para todos">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-toggle" @click="toggleNotificationActive(notification)" :title="notification.isActive ? 'Desativar' : 'Ativar'">
                <svg v-if="notification.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-edit" @click="openNotificationModal(notification)" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon-action btn-delete" @click="deleteNotification(notification.id)" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingCampaign ? 'Editar Campanha' : 'Nova Campanha' }}</h2>
          <button class="btn-close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="formData.name" type="text" placeholder="Nome da campanha" />
          </div>
          <div class="form-group">
            <label>Descricao</label>
            <textarea v-model="formData.description" placeholder="Descricao da campanha"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data Inicio</label>
              <input v-model="formData.startDate" type="date" />
            </div>
            <div class="form-group">
              <label>Data Fim</label>
              <input v-model="formData.endDate" type="date" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>XP Bonus</label>
              <input v-model.number="formData.xpBonus" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Multiplicador XP</label>
              <input v-model.number="formData.xpMultiplier" type="number" min="1" step="0.1" />
            </div>
          </div>
          <div class="form-group">
            <label>Banner (Video/Imagem)</label>
            <input type="file" @change="handleFileUpload" accept="image/*,video/*" />
            <input v-model="formData.bannerUrl" type="text" placeholder="Ou cole a URL do banner" class="mt-2" />
          </div>
          <div class="form-group">
            <label>Badge Premio (opcional)</label>
            <select v-model="formData.badgeId" class="badge-select">
              <option :value="null">Nenhum badge</option>
              <option v-for="badge in availableBadges" :key="badge.id" :value="badge.id">
                {{ badge.name }} ({{ badge.rarity }})
              </option>
            </select>
            <p class="form-hint">Os vencedores receberao este badge automaticamente</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">Cancelar</button>
          <button class="btn-primary" @click="saveCampaign">Salvar</button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Importar Campanha</h2>
          <button class="btn-close" @click="showImportModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Cole o JSON da campanha</label>
            <textarea v-model="importJson" placeholder='{"name": "...", "startDate": "...", ...}' rows="15"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showImportModal = false">Cancelar</button>
          <button class="btn-primary" @click="importCampaign">Importar</button>
        </div>
      </div>
    </div>

    <!-- Winners/Participants Modal -->
    <div v-if="showWinnersModal" class="modal-overlay" @click.self="showWinnersModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2 v-if="participantsMode === 'winners'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a962" stroke-width="2" style="margin-right: 8px; vertical-align: middle;">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
            Selecionar Vencedores: {{ selectedCampaign?.name }}
          </h2>
          <h2 v-else>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a962" stroke-width="2" style="margin-right: 8px; vertical-align: middle;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Participantes: {{ selectedCampaign?.name }}
          </h2>
          <button class="btn-close" @click="showWinnersModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Stats -->
          <div class="winners-stats">
            <div class="winner-stat">
              <span class="winner-stat-value">{{ availableParticipants.length }}</span>
              <span class="winner-stat-label">Participantes</span>
            </div>
            <div v-if="participantsMode === 'winners'" class="winner-stat">
              <span class="winner-stat-value">{{ selectedWinners.length }}</span>
              <span class="winner-stat-label">Selecionados</span>
            </div>
            <div v-if="participantsMode === 'winners'" class="winner-stat">
              <span class="winner-stat-value">{{ Object.values(winnerXpAmounts).reduce((a: number, b: number) => a + b, 0) }}</span>
              <span class="winner-stat-label">XP Total</span>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="winnersLoading" class="loading">Carregando participantes...</div>

          <!-- No Participants -->
          <div v-else-if="availableParticipants.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>Nenhum participante nesta campanha</p>
          </div>

          <!-- Participants List -->
          <div v-else class="participants-list">
            <div
              v-for="participant in availableParticipants"
              :key="participant.userId"
              class="participant-item"
              :class="{ selected: participantsMode === 'winners' && isWinnerSelected(participant.userId) }"
              @click="participantsMode === 'winners' && toggleWinner(participant.userId)"
            >
              <div v-if="participantsMode === 'winners'" class="participant-select">
                <div class="checkbox" :class="{ checked: isWinnerSelected(participant.userId) }">
                  <svg v-if="isWinnerSelected(participant.userId)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div class="participant-avatar">
                <img v-if="participant.user?.photoUrl" :src="`${API_URL}${participant.user.photoUrl}`" :alt="participant.user?.name" />
                <div v-else class="avatar-placeholder">{{ participant.user?.name?.charAt(0) || '?' }}</div>
              </div>
              <div class="participant-info">
                <span class="participant-name">{{ participant.user?.name || 'Aplicador' }}</span>
                <span class="participant-role">{{ participant.user?.role || 'APLICADOR' }}</span>
              </div>
              <div class="participant-xp" v-if="participantsMode === 'winners' && isWinnerSelected(participant.userId)" @click.stop>
                <label>XP:</label>
                <input
                  type="number"
                  v-model.number="winnerXpAmounts[participant.userId]"
                  min="0"
                  step="10"
                  class="xp-input"
                />
              </div>
              <div class="participant-position" v-if="participantsMode === 'winners' && isWinnerSelected(participant.userId)">
                <span class="position-badge">{{ selectedWinners.indexOf(participant.userId) + 1 }}º</span>
              </div>
              <button
                class="btn-remove-participant"
                @click.stop="removeParticipant(participant.userId, participant.user?.name || 'Participante')"
                title="Remover participante"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showWinnersModal = false">Fechar</button>
          <template v-if="participantsMode === 'winners'">
            <button class="btn-notify" @click="notifyWinners" :disabled="selectedWinners.length === 0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notificar
            </button>
            <button class="btn-primary" @click="saveWinners" :disabled="selectedWinners.length === 0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Salvar Vencedores
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Badge Create/Edit Modal -->
    <div v-if="showBadgeModal" class="modal-overlay" @click.self="showBadgeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingBadge ? 'Editar Badge' : 'Criar Badge' }}</h2>
          <button class="btn-close" @click="showBadgeModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome *</label>
            <input v-model="badgeFormData.name" type="text" placeholder="Ex: Campeao da Maratona" />
          </div>
          <div class="form-group">
            <label>Descricao</label>
            <textarea v-model="badgeFormData.description" placeholder="Descricao do badge..." rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Categoria</label>
              <select v-model="badgeFormData.category">
                <option value="CAMPAIGN">Campanha</option>
                <option value="ACHIEVEMENT">Conquista</option>
                <option value="SPECIAL">Especial</option>
                <option value="ROLE">Cargo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Raridade</label>
              <select v-model="badgeFormData.rarity">
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
              <input v-model="badgeFormData.color" type="color" />
              <input v-model="badgeFormData.color" type="text" placeholder="#c9a962" />
            </div>
          </div>
          <div class="form-group">
            <label>Icone do Badge *</label>
            <div class="icon-upload">
              <div class="icon-preview" :style="{ borderColor: badgeFormData.color }">
                <img v-if="badgeFormData.iconUrl" :src="getPhotoUrl(badgeFormData.iconUrl)" alt="Preview" />
                <span v-else>?</span>
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleBadgeIconUpload" accept="image/*" id="badge-icon-upload" class="hidden" :disabled="badgeUploading" />
                <label for="badge-icon-upload" class="btn-upload" :class="{ disabled: badgeUploading }">
                  {{ badgeUploading ? 'Enviando...' : 'Escolher Imagem' }}
                </label>
                <span class="upload-hint">PNG, JPG, SVG ou GIF (max 5MB)</span>
              </div>
            </div>
            <input v-model="badgeFormData.iconUrl" type="text" placeholder="Ou cole a URL do icone" class="mt-2" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBadgeModal = false">Cancelar</button>
          <button class="btn-primary" @click="saveBadgeItem" :disabled="!badgeFormData.name || !badgeFormData.iconUrl">
            {{ editingBadge ? 'Salvar' : 'Criar Badge' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Create/Edit Modal -->
    <div v-if="showNotificationModal" class="modal-overlay" @click.self="showNotificationModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingNotification ? 'Editar Notificacao' : 'Nova Notificacao' }}</h2>
          <button class="btn-close" @click="showNotificationModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Titulo *</label>
            <input v-model="notificationFormData.title" type="text" placeholder="Ex: Novidade importante!" />
          </div>
          <div class="form-group">
            <label>Mensagem *</label>
            <textarea v-model="notificationFormData.message" placeholder="Escreva a mensagem da notificacao..." rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>Video (opcional)</label>
            <div class="video-upload">
              <div class="video-preview" v-if="notificationFormData.videoUrl">
                <video :src="`${API_URL}${notificationFormData.videoUrl}`" controls width="100%"></video>
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleNotificationVideoUpload" accept="video/*" id="notification-video-upload" class="hidden" :disabled="notificationVideoUploading" />
                <label for="notification-video-upload" class="btn-upload" :class="{ disabled: notificationVideoUploading }">
                  {{ notificationVideoUploading ? 'Enviando...' : 'Escolher Video' }}
                </label>
                <span class="upload-hint">MP4, WebM ou OGG (max 100MB)</span>
              </div>
            </div>
            <input v-model="notificationFormData.videoUrl" type="text" placeholder="Ou cole a URL do video" class="mt-2" />
          </div>
          <div class="form-group">
            <label>Duracao do Video (segundos)</label>
            <input v-model.number="notificationFormData.videoDuration" type="number" min="0" placeholder="0" />
            <span class="form-hint">Tempo minimo que o usuario deve assistir para ganhar XP</span>
          </div>
          <div class="form-group">
            <label>Recompensa XP</label>
            <input v-model.number="notificationFormData.xpReward" type="number" min="0" step="10" placeholder="0" />
            <span class="form-hint">XP que o usuario ganha ao assistir o video completo</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showNotificationModal = false">Cancelar</button>
          <button class="btn-primary" @click="saveNotification" :disabled="!notificationFormData.title || !notificationFormData.message">
            {{ editingNotification ? 'Salvar' : 'Criar Notificacao' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.campaigns-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Hero Cover Section */
.campaigns-hero {
  position: relative;
  padding: 2.5rem 2rem;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-bottom: 1px solid rgba(201, 169, 98, 0.2);
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.hero-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(201, 169, 98, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(201, 169, 98, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 40% 80%, rgba(201, 169, 98, 0.05) 0%, transparent 30%);
}

.hero-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(201, 169, 98, 0.15) 0%, transparent 70%);
  filter: blur(60px);
  animation: pulse-glow 4s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.1); }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(201, 169, 98, 0.1) 100%);
  border: 1px solid rgba(201, 169, 98, 0.3);
  color: #c9a962;
  flex-shrink: 0;
}

.hero-text {
  flex: 1;
}

.hero-text h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #fff 0%, #c9a962 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-text p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  max-width: 500px;
}

.hero-stats {
  display: flex;
  gap: 1.5rem;
  flex-shrink: 0;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 90px;
  transition: all 0.3s ease;
}

.hero-stat:hover {
  background: rgba(201, 169, 98, 0.1);
  border-color: rgba(201, 169, 98, 0.3);
  transform: translateY(-2px);
}

.hero-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #c9a962;
  line-height: 1;
}

.hero-stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.filter-tabs button {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-tabs button:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

.filter-tabs button.active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #000000;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-gold);
  border: 2px solid var(--accent-gold);
  color: #000000;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary:hover {
  background: #d4b56e;
  border-color: #d4b56e;
  color: #000000;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.page-content {
  padding: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.campaign-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.campaign-banner {
  width: 100%;
  height: 180px;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.campaign-banner video,
.campaign-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-banner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.campaign-info {
  padding: 1.25rem;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.campaign-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.campaign-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.campaign-dates {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.campaign-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-gold);
}

.stat-label {
  font-size: 0.625rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.campaign-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-icon.btn-danger:hover {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: white;
}

.btn-launch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--accent-green);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
}

.btn-launch:hover {
  background: #16a34a;
}

/* Modal Styles */
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
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

/* Slides */
.slides-list {
  margin-bottom: 1.5rem;
}

.slide-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.slide-order {
  width: 32px;
  height: 32px;
  background: var(--accent-gold);
  color: var(--bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.slide-content {
  flex: 1;
}

.slide-type {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.slide-title {
  font-weight: 500;
}

.slide-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
}

.slide-media {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.add-slide-form {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.add-slide-form h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

/* Resend and Winners buttons */
.btn-resend {
  color: var(--accent-blue) !important;
  border-color: var(--accent-blue) !important;
}

.btn-resend:hover {
  background: var(--accent-blue) !important;
  color: white !important;
}

.btn-winners {
  color: var(--accent-gold) !important;
  border-color: var(--accent-gold) !important;
}

.btn-winners:hover {
  background: var(--accent-gold) !important;
  color: var(--bg-primary) !important;
}

/* Winners Modal Styles */
.winners-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.winner-stat {
  flex: 1;
  text-align: center;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.winner-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-gold);
}

.winner-stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.participants-list {
  max-height: 400px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.participant-item:hover {
  background: rgba(201, 169, 98, 0.1);
}

.participant-item.selected {
  border-color: var(--accent-gold);
  background: rgba(201, 169, 98, 0.15);
}

.participant-select {
  flex-shrink: 0;
}

.checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: var(--bg-primary);
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.participant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8983d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--bg-primary);
}

.participant-info {
  flex: 1;
  min-width: 0;
}

.participant-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-role {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.participant-xp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.participant-xp label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.xp-input {
  width: 70px;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--accent-gold);
  font-weight: 600;
  text-align: center;
}

.participant-position {
  flex-shrink: 0;
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent-gold) 0%, #b8983d 100%);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--bg-primary);
}

.btn-notify {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--accent-blue);
  border: 1px solid var(--accent-blue);
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-notify:hover:not(:disabled) {
  background: #2563eb;
}

.btn-notify:disabled,
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary svg,
.btn-notify svg {
  vertical-align: middle;
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.btn-remove-participant {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.btn-remove-participant:hover {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: white;
}

.btn-participants {
  color: var(--accent-green) !important;
  border-color: var(--accent-green) !important;
}

.btn-participants:hover {
  background: var(--accent-green) !important;
  color: white !important;
}

/* Main Tabs */
.main-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.main-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.main-tab:hover {
  background: rgba(201, 169, 98, 0.1);
  border-color: rgba(201, 169, 98, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.main-tab.active {
  background: rgba(201, 169, 98, 0.2);
  border-color: rgba(201, 169, 98, 0.5);
  color: #c9a962;
}

.main-tab svg {
  flex-shrink: 0;
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

/* Badge Form Styles */
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

/* Notifications Grid */
.notifications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.notification-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s ease;
}

.notification-card:hover {
  border-color: var(--accent-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.1);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.notification-icon.has-video {
  background: rgba(201, 169, 98, 0.2);
  color: var(--accent-gold);
}

.notification-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-tertiary);
}

.notification-status.active {
  background: rgba(34, 197, 94, 0.2);
  color: var(--accent-green);
}

.notification-content {
  padding: 1rem;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.notification-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.xp-reward {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(201, 169, 98, 0.2);
  color: var(--accent-gold);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.has-video-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent-blue);
  border-radius: 4px;
  font-size: 0.75rem;
}

.notification-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-action svg {
  width: 16px;
  height: 16px;
}

.btn-icon-action.btn-send {
  color: var(--accent-green);
}

.btn-icon-action.btn-send:hover {
  background: var(--accent-green);
  color: white;
  border-color: var(--accent-green);
}

.btn-icon-action.btn-toggle {
  color: var(--accent-blue);
}

.btn-icon-action.btn-toggle:hover {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.btn-icon-action.btn-edit {
  color: var(--accent-gold);
}

.btn-icon-action.btn-edit:hover {
  background: var(--accent-gold);
  color: #000;
  border-color: var(--accent-gold);
}

.btn-icon-action.btn-delete {
  color: var(--accent-red);
}

.btn-icon-action.btn-delete:hover {
  background: var(--accent-red);
  color: white;
  border-color: var(--accent-red);
}

/* Video Upload */
.video-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-preview {
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.video-preview video {
  display: block;
  max-height: 200px;
  object-fit: contain;
}
</style>
