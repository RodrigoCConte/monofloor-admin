<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const handleSubmit = async () => {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    router.push('/');
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <img src="/logo.png" alt="Monofloor" class="logo-image" />
        </div>
        <p class="admin-badge">Painel Administrativo</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@monofloor.com"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="********"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button type="submit" class="login-button" :disabled="authStore.loading">
          {{ authStore.loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="footer-text">
        <span>Sistema de gestao de equipes Monofloor</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  padding: 20px;
}

.login-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.logo-image {
  height: 60px;
  width: auto;
}

.admin-badge {
  display: inline-block;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-color);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  font-size: 16px;
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.form-group input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  padding: 12px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  text-align: center;
}

.login-button {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  border: none;
  padding: 16px;
  border-radius: var(--border-radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 8px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(201, 169, 98, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.footer-text {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.footer-text span {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Tablet Responsive Styles (768px and below) */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 40px 32px;
    max-width: 100%;
    box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.4);
  }

  .login-header {
    margin-bottom: 32px;
  }

  .logo-image {
    height: 50px;
  }

  .admin-badge {
    font-size: 11px;
    padding: 5px 14px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-group input {
    padding: 14px;
    font-size: 15px;
  }

  .login-button {
    padding: 14px;
    font-size: 15px;
  }

  .footer-text {
    margin-top: 28px;
    padding-top: 20px;
  }

  .footer-text span {
    font-size: 11px;
  }
}

/* Mobile Responsive Styles (480px and below) */
@media (max-width: 480px) {
  .login-container {
    padding: 12px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: var(--border-radius-lg);
    box-shadow: 0 10px 25px -8px rgba(0, 0, 0, 0.3);
  }

  .login-header {
    margin-bottom: 28px;
  }

  .logo {
    margin-bottom: 12px;
  }

  .logo-image {
    height: 45px;
  }

  .admin-badge {
    font-size: 10px;
    padding: 4px 12px;
    border-radius: 16px;
  }

  .login-form {
    gap: 18px;
  }

  .form-group {
    gap: 6px;
  }

  .form-group label {
    font-size: 12px;
  }

  .form-group input {
    padding: 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .form-group input::placeholder {
    font-size: 13px;
  }

  .error-message {
    padding: 10px 14px;
    font-size: 12px;
  }

  .login-button {
    padding: 12px;
    font-size: 14px;
    margin-top: 6px;
    border-radius: 8px;
  }

  .footer-text {
    margin-top: 24px;
    padding-top: 18px;
  }

  .footer-text span {
    font-size: 10px;
    display: block;
    line-height: 1.4;
  }
}

/* Extra Small Mobile (360px and below) */
@media (max-width: 360px) {
  .login-container {
    padding: 8px;
  }

  .login-card {
    padding: 24px 20px;
  }

  .logo-image {
    height: 40px;
  }

  .admin-badge {
    font-size: 9px;
    padding: 4px 10px;
  }

  .form-group input {
    padding: 11px;
    font-size: 13px;
  }

  .login-button {
    padding: 11px;
    font-size: 13px;
  }
}
</style>
