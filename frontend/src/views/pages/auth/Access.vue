<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToLogin() {
    router.push('/login');
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="access-container">
                <div class="auth-box bg-surface-0 dark:bg-surface-900 access-content">
                    <div class="flex flex-col items-center justify-center h-full">
                        <div class="flex justify-center items-center border-2 border-orange-400 rounded-full icon-container mb-6">
                            <i class="text-orange-400 pi pi-fw pi-lock text-2xl"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-4 text-center">접근 권한 없음</h1>
                        <span class="text-muted-color mb-8 text-center">
                            이 이메일은 시스템 접근 권한이 없습니다.<br />
                            관리자에게 문의하세요.
                        </span>
                        <div class="mt-4">
                            <Button label="다시 로그인" @click="goToLogin" severity="warn" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.access-container {
    border-radius: 56px;
    padding: 0.3rem;
    background: linear-gradient(180deg, rgba(251, 146, 60, 0.4) 10%, transparent 30%);
}

.access-content {
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
