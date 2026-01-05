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
    redirect: '/comercial',
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
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/Map.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/requests',
    name: 'Requests',
    component: () => import('../views/Requests.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contributions',
    redirect: '/requests',
  },
  {
    path: '/help-requests',
    redirect: '/requests',
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
  // Enterprise Modules
  {
    path: '/comercial',
    name: 'Comercial',
    component: () => import('../views/Comercial.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/piui',
    name: 'PIUI',
    component: () => import('../views/PIUI.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/planejamento',
    name: 'Planejamento',
    component: () => import('../views/Planejamento.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/posvenda',
    name: 'PosVenda',
    component: () => import('../views/PosVenda.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/enterprise',
    name: 'Enterprise',
    component: () => import('../views/Enterprise.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/scheduling',
    name: 'Scheduling',
    component: () => import('../views/Scheduling.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/comercial');
  } else {
    next();
  }
});

export default router;
