import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  // Initialize from localStorage
  const init = () => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
    }
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(email, password);

      if (response.data.success) {
        token.value = response.data.data.token;
        user.value = response.data.data.user;

        localStorage.setItem('admin_token', token.value!);
        localStorage.setItem('admin_user', JSON.stringify(user.value));

        return true;
      }

      throw new Error('Login failed');
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Erro ao fazer login';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    init,
    login,
    logout,
  };
});
