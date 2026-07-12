import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export interface User {
    id?: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    clearAuthData: () => void;
}

// Automatically load token on application start for Axios defaults
(() => {
    try {
        const stored = localStorage.getItem('exammaster-auth-storage');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.state?.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.state.token}`;
            }
        }
    } catch (e) {
        console.error('Error restoring authorization headers:', e);
    }
})();

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (username, password) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
                    const { token, user } = res.data;
                    
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    set({
                        user,
                        token,
                        isAuthenticated: true
                    });
                    return { success: true };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to sign in. Please verify your credentials.'
                    };
                }
            },
            register: async (username, name, password) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/register`, { username, name, password });
                    const { token, user } = res.data;
                    
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    set({
                        user,
                        token,
                        isAuthenticated: true
                    });
                    return { success: true };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Registration failed. Username may already be in use.'
                    };
                }
            },
            logout: () => {
                delete axios.defaults.headers.common['Authorization'];
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });
            },
            updateProfile: async (data) => {
                try {
                    const res = await axios.patch(`${API_BASE}/auth/profile`, data);
                    set({ user: res.data });
                    return { success: true };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to update profile.'
                    };
                }
            },
            resetPassword: async (username, newPassword) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/reset-password`, { username, newPassword });
                    return { success: true, message: res.data.message };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to reset password.'
                    };
                }
            },
            clearAuthData: () => {
                delete axios.defaults.headers.common['Authorization'];
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'exammaster-auth-storage',
        }
    )
);
