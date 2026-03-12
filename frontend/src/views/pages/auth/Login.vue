<script setup>
import { onMounted } from 'vue';

import { useRouter } from 'vue-router';

import AppLogo from '@/components/AppLogo.vue';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { login } = useAuth();

onMounted(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
        initializeGoogleSignIn();
    };
});

function initializeGoogleSignIn() {
    if (!window.google) return;

    window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: 'signin_with'
    });
}

async function handleCredentialResponse(response) {
    try {
        await login(response.credential);
        // ✅ 로그인 성공 → Dashboard
        router.push('/');
    } catch (error) {
        console.error('Login failed:', error);

        // ✅ 403 에러 (이메일 권한 없음) → /access 페이지
        if (error.response && error.response.status === 403) {
            router.push('/access');
        }
        // 다른 에러는 로그인 페이지에 그대로
    }
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="login-container">
                <div class="auth-box bg-surface-0 dark:bg-surface-900 login-content">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-8">
                            <AppLogo size="large" />
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">조합원 관리 시스템</div>
                        <span class="text-muted-color font-medium">Google 계정으로 로그인</span>
                    </div>

                    <div class="flex flex-col items-center">
                        <div id="google-signin-button" class="mb-4"></div>
                        <p class="text-sm text-muted-color mt-4 text-center">승인된 이메일만 접근 가능합니다</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    border-radius: 56px;
    padding: 0.3rem;
    background: linear-gradient(180deg, color-mix(in srgb, var(--p-primary-color), transparent 60%) 10%, transparent 30%);
}

.login-content {
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

#google-signin-button {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
