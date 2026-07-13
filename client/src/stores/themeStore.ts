import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 
    | 'light' 
    | 'dark' 
    | 'system'
    | 'cyberpunk'
    | 'dracula'
    | 'nord'
    | 'onedark'
    | 'monokai'
    | 'solarized'
    | 'tokyonight'
    | 'rose';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'theme-storage',
        }
    )
);
