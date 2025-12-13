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
  assignProject: (id: string, projectId: string, projectRole: string) =>
    api.post(`/api/admin/applicators/${id}/assign-project`, { projectId, projectRole }),
};

// Projects API
export const projectsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/admin/projects', { params }),
  getById: (id: string) => api.get(`/api/admin/projects/${id}`),
  create: (data: any) => api.post('/api/admin/projects', data),
  update: (id: string, data: any) => api.put(`/api/admin/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/projects/${id}`),
  getTemplate: () => api.get('/api/admin/projects/template', { responseType: 'blob' }),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/admin/projects/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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
};
