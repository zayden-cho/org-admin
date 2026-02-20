<script setup>
import { ref } from 'vue';

import AppMenuItem from '@/layout/AppMenuItem.vue';

const model = ref([
    {
        label: '홈',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/'
            }
        ]
    },
    {
        label: '관리',
        items: [
            {
                label: '조합원 목록',
                icon: 'pi pi-fw pi-users',
                to: '/krews'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
