<script setup>
import { onMounted } from 'vue';

import { primaryColors, surfaces, applyTheme } from '@/composables/useTheme';
import { useLayout } from '@/layout/composables/layout';

const { layoutConfig } = useLayout();

onMounted(() => {
    const primaryColor = primaryColors.find((c) => c.name === layoutConfig.primary);
    const surfaceColor = surfaces.find((c) => c.name === layoutConfig.surface);

    if (primaryColor) {
        applyTheme('primary', primaryColor);
    }

    if (surfaceColor) {
        applyTheme('surface', surfaceColor);
    }
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>

<style>
/* 토스트 z-index 최상위 */
.p-toast {
    z-index: 10000 !important;
}

.p-toast .p-toast-message {
    background: white !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(10px);
    border-left: 5px solid var(--p-primary-color);
}

/* 타입별 왼쪽 border 색상 */
.p-toast .p-toast-message-info {
    border-left-color: #2196f3 !important;
}

.p-toast .p-toast-message-success {
    border-left-color: #4caf50 !important;
}

.p-toast .p-toast-message-warn {
    border-left-color: #ff9800 !important;
}

.p-toast .p-toast-message-error {
    border-left-color: #f44336 !important;
}
</style>
