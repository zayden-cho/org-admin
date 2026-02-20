import { createRouter, createWebHistory } from 'vue-router';

import AppLayout from '@/layout/AppLayout.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/krews',
                    name: 'krews',
                    component: () => import('@/views/krews/KrewsManagement.vue')
                }
            ]
        }
    ]
});

export default router;
