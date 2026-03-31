import { computed, ref } from 'vue';

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function safeGetUser() {
    try {
        const stored = localStorage.getItem('auth_user');
        if (!stored || stored === 'undefined' || stored === 'null') {
            return null;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Invalid auth_user in localStorage, clearing');
        localStorage.removeItem('auth_user');
        return null;
    }
}

const token = ref(localStorage.getItem('auth_token') || null);
const user = ref(safeGetUser());

const isAuthenticated = computed(() => !!token.value);

export function useAuth() {
    async function login(idToken) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
                idToken
            });

            if (response.data.success) {
                token.value = response.data.token;
                user.value = response.data.user;

                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('auth_user', JSON.stringify(response.data.user));

                return response.data;
            }
        } catch (error) {
            console.error('Login failed:', error);
            logout();
            throw error;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }

    async function verifyToken() {
        if (!token.value) return false;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
                headers: {
                    Authorization: `Bearer ${token.value}`
                }
            });

            return response.data.success;
        } catch (error) {
            console.error('Token verification failed:', error);
            logout();
            return false;
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        login,
        logout,
        verifyToken
    };
}
