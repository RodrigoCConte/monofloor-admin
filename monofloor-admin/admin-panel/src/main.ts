import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import { useAuthStore } from './stores/auth';
import App from './App.vue';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Initialize auth store before router
const authStore = useAuthStore();
authStore.init();

app.use(router);
app.mount('#app');
