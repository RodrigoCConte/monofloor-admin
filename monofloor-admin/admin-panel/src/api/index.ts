import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://devoted-wholeness-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/admin/login', { email, password }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/api/admin/dashboard/stats'),
  getTopApplicators: () => api.get('/api/admin/dashboard/top-applicators'),
  getOnlineApplicators: () => api.get('/api/admin/dashboard/online-applicators'),
};

// Applicators API
export const applicatorsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/applicators', { params }),
  getById: (id: string) => api.get(`/api/admin/applicators/${id}`),
  approve: (id: string) => api.post(`/api/admin/applicators/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/api/admin/applicators/${id}/reject`, { reason }),
  updateRole: (id: string, role: string) =>
    api.put(`/api/admin/applicators/${id}/role`, { role }),
  assignProject: (id: string, projectId: string, projectRole: string) =>
    api.post(`/api/admin/applicators/${id}/assign-project`, { projectId, projectRole }),
  delete: (id: string) => api.delete(`/api/admin/applicators/${id}`),
  // Projects management
  getProjects: (id: string) => api.get(`/api/admin/applicators/${id}/projects`),
  addProject: (id: string, projectId: string, projectRole?: string) =>
    api.post(`/api/admin/applicators/${id}/projects`, { projectId, projectRole: projectRole || 'APLICADOR_I' }),
  removeProject: (id: string, projectId: string) =>
    api.delete(`/api/admin/applicators/${id}/projects/${projectId}`),
  // XP adjustment
  adjustXp: (id: string, amount: number, reason: string, type: 'PRAISE' | 'PENALTY') =>
    api.post(`/api/admin/applicators/${id}/xp`, { amount, reason, type }),
  // Earnings
  getEarnings: (id: string, month?: number, year?: number) =>
    api.get(`/api/admin/applicators/${id}/earnings`, { params: { month, year } }),
};

// Projects API
export const projectsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/projects', { params }),
  getById: (id: string) => api.get(`/api/admin/projects/${id}`),
  create: (data: any) => api.post('/api/admin/projects', data),
  update: (id: string, data: any) => api.put(`/api/admin/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/projects/${id}`),
  deleteAll: () => api.delete('/api/admin/projects'),
  getTemplate: () => api.get('/api/admin/projects/template', { responseType: 'blob' }),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/admin/projects/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Team management
  getTeam: (id: string) => api.get(`/api/admin/projects/${id}/team`),
  addTeamMember: (id: string, userId: string, projectRole: string) =>
    api.post(`/api/admin/projects/${id}/team`, { userId, projectRole }),
  removeTeamMember: (id: string, userId: string) =>
    api.delete(`/api/admin/projects/${id}/team/${userId}`),
  // Check-ins and Reports
  getCheckins: (id: string, params?: { dateFrom?: string; dateTo?: string }) =>
    api.get(`/api/admin/projects/${id}/checkins`, { params }),
  getReports: (id: string, params?: { dateFrom?: string; dateTo?: string }) =>
    api.get(`/api/admin/projects/${id}/reports`, { params }),
  // Night Shift
  configureNightShift: (id: string, data: { slots?: number; startDate?: string; endDate?: string }) =>
    api.put(`/api/admin/projects/${id}/night-shift`, data),
  getNightShiftInvites: (id: string) =>
    api.get(`/api/admin/projects/${id}/night-shift/invites`),
  sendNightShiftInvites: (id: string, userIds: string[]) =>
    api.post(`/api/admin/projects/${id}/night-shift/invites`, { userIds }),
  cancelNightShiftInvite: (projectId: string, inviteId: string) =>
    api.delete(`/api/admin/projects/${projectId}/night-shift/invites/${inviteId}`),
  // Entry Request (Liberacao na Portaria)
  requestEntry: (id: string, userIds: string[]) =>
    api.post(`/api/admin/projects/${id}/request-entry`, { userIds }),
  // Tasks / Gantt
  getTasks: (id: string, status?: string) =>
    api.get(`/api/admin/projects/${id}/tasks`, { params: { status } }),
  getTask: (projectId: string, taskId: string) =>
    api.get(`/api/admin/projects/${projectId}/tasks/${taskId}`),
  createTask: (projectId: string, data: any) =>
    api.post(`/api/admin/projects/${projectId}/tasks`, data),
  updateTask: (projectId: string, taskId: string, data: any) =>
    api.put(`/api/admin/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId: string, taskId: string) =>
    api.delete(`/api/admin/projects/${projectId}/tasks/${taskId}`),
  generateTasks: (projectId: string, scope?: 'PISO' | 'PAREDE_TETO' | 'COMBINADO') =>
    api.post(`/api/admin/projects/${projectId}/tasks/generate`, scope ? { scope } : {}),
  syncDeadline: (projectId: string, data: { deadlineDate?: string; estimatedDays?: number }) =>
    api.post(`/api/admin/projects/${projectId}/tasks/sync-deadline`, data),
  getScope: (projectId: string) =>
    api.get(`/api/admin/projects/${projectId}/tasks/scope`),
  reorderTasks: (projectId: string, taskIds: string[]) =>
    api.put(`/api/admin/projects/${projectId}/tasks/reorder`, { taskIds }),
  getTasksStats: (projectId: string) =>
    api.get(`/api/admin/projects/${projectId}/tasks/stats`),
  publishTasks: (projectId: string) =>
    api.post(`/api/admin/projects/${projectId}/tasks/publish`),
  // Task assignments
  getTaskAssignments: (projectId: string, taskId: string) =>
    api.get(`/api/admin/projects/${projectId}/tasks/${taskId}/assignments`),
  updateTaskAssignments: (projectId: string, taskId: string, userIds: string[]) =>
    api.put(`/api/admin/projects/${projectId}/tasks/${taskId}/assignments`, { userIds }),
  bulkUpdateTaskAssignments: (projectId: string, taskIds: string[], userIds: string[]) =>
    api.put(`/api/admin/projects/${projectId}/tasks/bulk-assignments`, { taskIds, userIds }),
};

// Tasks API (standalone for task-types)
export const tasksApi = {
  getTaskTypes: () => api.get('/api/admin/projects/task-types'),
};

// Reports API
export const reportsApi = {
  generateDaily: (projectId: string, date: string) =>
    api.post('/api/admin/reports/generate-daily', { projectId, date }),
  generatePeriod: (projectId: string, startDate: string, endDate: string) =>
    api.post('/api/admin/reports/generate-period', { projectId, startDate, endDate }),
  getGenerated: (params?: { projectId?: string; type?: string; page?: number }) =>
    api.get('/api/admin/reports/generated', { params }),
};

// Locations API
export const locationsApi = {
  getAll: (params?: { projectId?: string; onlineOnly?: boolean }) =>
    api.get('/api/admin/locations', { params }),
  getMapData: () => api.get('/api/admin/locations/map'),
  getById: (userId: string) => api.get(`/api/admin/locations/${userId}`),
  getHistory: (userId: string, hours?: number) =>
    api.get(`/api/admin/locations/${userId}/history`, { params: { hours } }),
  // Timeline for playback
  getTimeline: (userId: string, date?: string) =>
    api.get(`/api/admin/locations/${userId}/timeline`, { params: { date } }),
  // List of applicators with status
  getApplicatorsList: () => api.get('/api/admin/locations/applicators/list'),
  // Projects with coordinates for map
  getProjectsForMap: () => api.get('/api/admin/locations/projects'),
};

// Contributions API
export const contributionsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/contributions', { params }),
  getPendingCount: () => api.get('/api/admin/contributions/pending-count'),
  approve: (id: string) => api.post(`/api/admin/contributions/${id}/approve`),
  reject: (id: string) => api.post(`/api/admin/contributions/${id}/reject`),
};

// Help Requests API
export const helpRequestsApi = {
  getAll: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/help-requests', { params }),
  getPendingCount: () => api.get('/api/admin/help-requests/pending-count'),
  getById: (id: string) => api.get(`/api/admin/help-requests/${id}`),
  updateStatus: (id: string, status: string, adminNotes?: string) =>
    api.put(`/api/admin/help-requests/${id}`, { status, adminNotes }),
  resolve: (id: string, adminNotes?: string) =>
    api.post(`/api/admin/help-requests/${id}/resolve`, { adminNotes }),
  cancel: (id: string, adminNotes?: string) =>
    api.post(`/api/admin/help-requests/${id}/cancel`, { adminNotes }),
};

// Campaigns API
export const campaignsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/campaigns', { params }),
  getById: (id: string) => api.get(`/api/admin/campaigns/${id}`),
  create: (data: any) => api.post('/api/admin/campaigns', data),
  update: (id: string, data: any) => api.put(`/api/admin/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/campaigns/${id}`),
  launch: (id: string) => api.post(`/api/admin/campaigns/${id}/launch`),
  // Slides
  addSlide: (id: string, data: any) => api.post(`/api/admin/campaigns/${id}/slides`, data),
  updateSlide: (id: string, slideId: string, data: any) =>
    api.put(`/api/admin/campaigns/${id}/slides/${slideId}`, data),
  deleteSlide: (id: string, slideId: string) =>
    api.delete(`/api/admin/campaigns/${id}/slides/${slideId}`),
  reorderSlides: (id: string, slideIds: string[]) =>
    api.post(`/api/admin/campaigns/${id}/slides/reorder`, { slideIds }),
  // Import/Export
  import: (data: any) => api.post('/api/admin/campaigns/import', data),
  export: (id: string) => api.get(`/api/admin/campaigns/export/${id}`),
  // Upload
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/admin/campaigns/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Winners
  saveWinners: (id: string, winners: { userId: string; position: number; xpAwarded: number }[]) =>
    api.post(`/api/admin/campaigns/${id}/winners`, { winners }),
  notifyWinners: (id: string, winnerIds: string[]) =>
    api.post(`/api/admin/campaigns/${id}/winners/notify`, { winnerIds }),
  // Resend banner to non-participants
  resendBanner: (id: string) =>
    api.post(`/api/admin/campaigns/${id}/resend`),
  // Remove participant from campaign
  removeParticipant: (campaignId: string, userId: string) =>
    api.delete(`/api/admin/campaigns/${campaignId}/participants/${userId}`),
};

// Badges API
export const badgesApi = {
  getAll: (params?: { category?: string; rarity?: string; isActive?: boolean }) =>
    api.get('/api/admin/badges', { params }),
  getById: (id: string) => api.get(`/api/admin/badges/${id}`),
  create: (data: { name: string; description?: string; iconUrl: string; color?: string; category?: string; rarity?: string }) =>
    api.post('/api/admin/badges', data),
  update: (id: string, data: any) => api.put(`/api/admin/badges/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/badges/${id}`),
  uploadIcon: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/admin/badges/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  award: (id: string, userIds: string[]) =>
    api.post(`/api/admin/badges/${id}/award`, { userIds }),
  revoke: (badgeId: string, userId: string) =>
    api.delete(`/api/admin/badges/${badgeId}/revoke/${userId}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { isActive?: boolean; limit?: number; offset?: number }) =>
    api.get('/api/admin/notifications', { params }),
  getById: (id: string) => api.get(`/api/admin/notifications/${id}`),
  create: (data: { title: string; message: string; videoUrl?: string; videoDuration?: number; xpReward?: number }) =>
    api.post('/api/admin/notifications', data),
  update: (id: string, data: any) => api.put(`/api/admin/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/notifications/${id}`),
  send: (id: string) => api.post(`/api/admin/notifications/${id}/send`),
  getStats: (id: string) => api.get(`/api/admin/notifications/${id}/stats`),
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/api/admin/notifications/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Academy API (Educational Videos & Quizzes)
export const academyApi = {
  // Videos
  getVideos: (params?: { category?: string; level?: string; isActive?: boolean; limit?: number; offset?: number }) =>
    api.get('/api/admin/academy/videos', { params }),
  getVideo: (id: string) => api.get(`/api/admin/academy/videos/${id}`),
  createVideo: (data: {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationSeconds: number;
    category?: string;
    level?: string;
    xpForWatching?: number;
    isRequired?: boolean;
  }) => api.post('/api/admin/academy/videos', data),
  updateVideo: (id: string, data: any) => api.put(`/api/admin/academy/videos/${id}`, data),
  deleteVideo: (id: string) => api.delete(`/api/admin/academy/videos/${id}`),
  publishVideo: (id: string) => api.post(`/api/admin/academy/videos/${id}/publish`),
  getVideoStats: (id: string) => api.get(`/api/admin/academy/videos/${id}/stats`),
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/api/admin/academy/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Quiz
  getQuiz: (videoId: string) => api.get(`/api/admin/academy/videos/${videoId}/quiz`),
  saveQuiz: (videoId: string, data: {
    title?: string;
    passingScore?: number;
    maxAttempts?: number;
    xpReward?: number;
    questions: Array<{
      questionText: string;
      questionType?: string;
      explanation?: string;
      answers: Array<{
        answerText: string;
        isCorrect: boolean;
      }>;
    }>;
  }) => api.post(`/api/admin/academy/videos/${videoId}/quiz`, data),
  deleteQuiz: (videoId: string) => api.delete(`/api/admin/academy/videos/${videoId}/quiz`),
};
