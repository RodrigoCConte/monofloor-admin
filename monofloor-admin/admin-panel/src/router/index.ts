import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/applicators',
    name: 'Applicators',
    component: () => import('../views/Applicators.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('../views/ProjectDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/Map.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contributions',
    name: 'Contributions',
    component: () => import('../views/Contributions.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/help-requests',
    name: 'HelpRequests',
    component: () => import('../views/HelpRequests.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/campaigns',
    name: 'Campaigns',
    component: () => import('../views/Campaigns.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/academy',
    name: 'Academy',
    component: () => import('../views/Academy.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/badges',
    redirect: '/campaigns',
  },
  {
    path: '/dashboard',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
