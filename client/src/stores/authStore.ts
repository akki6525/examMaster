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
    individual_user_logged_in_time?: number;
    last_active_time?: number;
    last_logout_time?: number;
    is_online?: boolean;
    total_logged_in_duration_ms?: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (username: string, verificationName: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    requestOtp: (username: string) => Promise<{ success: boolean; message?: string; mockOtp?: string; previewUrl?: string; error?: string }>;
    verifyOtpReset: (username: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    clearAuthData: () => void;
}

// Setup dynamic Axios request interceptor to always attach current auth token
axios.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState()?.token;
        if (token && !config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Automatically load token on application start for Axios defaults
(() => {
    try {
        const stored = localStorage.getItem('exammaster-auth-storage');
        if (stored) {
            let parsed;
            try {
                // Try reading Base64 obfuscated storage first
                parsed = JSON.parse(atob(stored));
            } catch {
                // Fallback to plain JSON read for backward compatibility (first load)
                parsed = JSON.parse(stored);
            }
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
            logout: async () => {
                try {
                    await axios.post(`${API_BASE}/auth/logout`);
                } catch {
                    // Ignore backend logout network errors
                }
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
            resetPassword: async (username, verificationName, newPassword) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/reset-password`, { username, verificationName, newPassword });
                    return { success: true, message: res.data.message };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to reset password.'
                    };
                }
            },
            requestOtp: async (username) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/request-otp`, { username });
                    return { 
                        success: true, 
                        message: res.data.message, 
                        mockOtp: res.data.mockOtp,
                        previewUrl: res.data.previewUrl
                    };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to request OTP.'
                    };
                }
            },
            verifyOtpReset: async (username, otp, newPassword) => {
                try {
                    const res = await axios.post(`${API_BASE}/auth/verify-otp-reset`, { username, otp, newPassword });
                    return { success: true, message: res.data.message };
                } catch (err: any) {
                    return {
                        success: false,
                        error: err.response?.data?.error || 'Failed to verify OTP and reset password.'
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
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    try {
                        // Decode Base64 obfuscated storage for client-side local cache security
                        const decrypted = atob(str);
                        return JSON.parse(decrypted);
                    } catch {
                        // Fallback support for migrating previous plain JSON cache
                        try {
                            return JSON.parse(str);
                        } catch {
                            return null;
                        }
                    }
                },
                setItem: (name, value) => {
                    const str = JSON.stringify(value);
                    // Encode Base64 obfuscated storage for client-side local cache security
                    const encrypted = btoa(str);
                    localStorage.setItem(name, encrypted);
                },
                removeItem: (name) => localStorage.removeItem(name),
            }
        }
    )
);
