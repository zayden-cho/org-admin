<script setup>
</script>

<template>
    <router-view />
</template>

<style scoped></style>

<!-- ✅ 토스트 전역 스타일 -->
<style>
/* 토스트 z-index 최상위 */
.p-toast {
    z-index: 10000 !important;
}

.p-toast .p-toast-message {
    background: white !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(10px);
    border-left: 5px solid var(--primary-color);
}

/* 타입별 왼쪽 border 색상 */
.p-toast .p-toast-message-info {
    border-left-color: #2196F3 !important;
}

.p-toast .p-toast-message-success {
    border-left-color: #4CAF50 !important;
}

.p-toast .p-toast-message-warn {
    border-left-color: #FF9800 !important;
}

.p-toast .p-toast-message-error {
    border-left-color: #F44336 !important;
}
</style>
