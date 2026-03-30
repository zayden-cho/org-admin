import { createRouter, createWebHistory } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import AppLayout from '@/layout/AppLayout.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/access',
            name: 'access',
            component: () => import('@/views/pages/auth/Access.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: {
                        title: '대시 보드'
                    }
                },
                {
                    path: '/krews',
                    name: 'krews',
                    component: () => import('@/views/krews/KrewsManagement.vue'),
                    meta: {
                        title: '조합원 목록'
                    }
                },
                {
                    path: '/events',
                    name: 'events',
                    component: () => import('@/views/events/EventManagement.vue'),
                    meta: {
                        title: '행사 목록'
                    }
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue'),
            meta: { requiresAuth: false }
        }
    ]
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, verifyToken } = useAuth();
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false);

    if (requiresAuth) {
        if (!isAuthenticated.value) {
            next('/login');
        } else {
            const isValid = await verifyToken();
            if (isValid) {
                next();
            } else {
                next('/login');
            }
        }
    } else {
        if (to.path === '/login' && isAuthenticated.value) {
            next('/');
        } else {
            next();
        }
    }
});

export default router;
