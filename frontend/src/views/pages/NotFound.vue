<script setup>
import { onMounted, ref } from 'vue';

import { useRouter } from 'vue-router';

const router = useRouter();
const countdown = ref(3);

onMounted(() => {
    const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value === 0) {
            clearInterval(timer);
            router.push('/');
        }
    }, 1000);
});

function goHome() {
    router.push('/');
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="notfound-container">
                <div class="auth-box bg-surface-0 dark:bg-surface-900 notfound-content">
                    <div class="flex flex-col items-center justify-center h-full">
                        <div class="flex justify-center items-center border-2 border-blue-500 rounded-full icon-container mb-6">
                            <i class="pi pi-fw pi-question-circle text-2xl text-blue-500"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-4 text-center">404</h1>
                        <h2 class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-4 text-center">페이지를 찾을 수 없습니다</h2>
                        <span class="text-muted-color mb-8 text-center">
                            요청하신 페이지가 존재하지 않습니다.<br />
                            {{ countdown }}초 후 메인으로 이동합니다.
                        </span>
                        <div class="mt-4">
                            <Button label="지금 메인으로 이동" @click="goHome" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notfound-container {
    border-radius: 56px;
    padding: 0.3rem;
    /* 파란색 (정보) */
    background: linear-gradient(180deg, rgba(59, 130, 246, 0.4) 10%, transparent 30%);
}

.notfound-content {
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
    width: 3.2rem;
    height: 3.2rem;
}
</style>
