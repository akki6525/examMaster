import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    username: string;
    email: string;
    phone: string;
    password?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    clearAuthData: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: (username, password) => {
                const storedUser = get().user;
                
                // If a user is already "registered" in local storage for this session
                // check if the username matches and password matches
                if (storedUser && storedUser.username.toLowerCase() === username.toLowerCase()) {
                    if (storedUser.password === password) {
                        set({ isAuthenticated: true });
                        return true;
                    } else {
                        return false; // Wrong password
                    }
                }

                // If no user exists or it's a new username, treat this as a "registration + login"
                set({
                    user: {
                        username,
                        password,
                        email: `${username.toLowerCase()}@example.com`,
                        phone: '+91 99999 88888'
                    },
                    isAuthenticated: true
                });
                return true;
            },
            logout: () => set({ isAuthenticated: false }), // We keep the user data but set auth to false
            updateProfile: (data) => set((state) => ({
                user: state.user ? { ...state.user, ...data } : null
            })),
            clearAuthData: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'exammaster-auth-storage', // Using a specific name for clarity
        }
    )
);
