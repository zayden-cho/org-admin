<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <svg
                    viewBox="0 0 173 171"
                    class="w-8 h-8"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g id="logo">
                        <path
                            d="m80.78.11C37.63,2.3,2.51,37.25.13,80.39c-1.27,22.92,6.55,44,20.15,60,2.5,2.94,3.55,6.84,2.72,10.61l-6.9,31.33c-.78,3.53,3.09,6.23,6.14,4.3l28.8-18.28c3-1.91,6.67-2.36,10.08-1.36,9.08,2.67,18.8,3.87,28.87,3.32,43.16-2.36,78.13-37.47,80.33-80.64C172.9,39.1,131.35-2.45,80.78.11Z"
                            fill="var(--primary-color)"
                        />
                        <path
                            d="m86.23,124.27c-18.35,0-33.29-14.93-33.29-33.28v-22.73c0-4.93,4.01-8.94,8.94-8.94s8.94,4.01,8.94,8.94v22.73c0,8.5,6.91,15.41,15.41,15.41s15.41-6.91,15.41-15.41v-22.73c0-4.93,4.01-8.94,8.94-8.94s8.94,4.01,8.94,8.94v22.73c0,18.35-14.93,33.28-33.28,33.28Z"
                            fill="white"
                        />
                    </g>
                </svg>
                <span>조직부 어드민</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <AppConfigurator />
                </div>
            </div>
        </div>
    </div>
</template>
