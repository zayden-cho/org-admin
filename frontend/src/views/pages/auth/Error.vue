<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToDashboard() {
    router.push('/');
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="error-container">
                <div class="auth-box bg-surface-0 dark:bg-surface-900 error-content">
                    <div class="flex flex-col items-center justify-center h-full">
                        <div class="flex justify-center items-center border-2 border-red-500 rounded-full icon-container mb-6">
                            <i class="pi pi-fw pi-exclamation-circle text-2xl text-red-500"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-4 text-center">오류 발생</h1>
                        <span class="text-muted-color mb-8 text-center">요청을 처리하는 중 문제가 발생했습니다.</span>
                        <div class="mt-4">
                            <Button label="대시보드로 이동" @click="goToDashboard" severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.error-container {
    border-radius: 56px;
    padding: 0.3rem;
    background: linear-gradient(180deg, rgba(239, 68, 68, 0.4) 10%, transparent 30%);
}

.error-content {
    border-radius: 53px;
}

.auth-box {
    width: 600px;
    min-height: 500px;
    padding: 5rem 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

@media (max-width: 640px) {
    .auth-box {
        width: 90vw;
        padding: 3rem 2rem;
    }
}

.icon-container {
    height: 3.2rem;
    width: 3.2rem;
}
</style>
