import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Dream {
    id: string;
    userId: string;
    title: string;
    targetYear: string;
    description: string;
    isAchieved: boolean;
    createdAt: string;
}

interface DreamState {
    dreams: Dream[];
    addDream: (dream: Omit<Dream, 'id' | 'createdAt'>) => void;
    updateDream: (id: string, updates: Partial<Dream>) => void;
    deleteDream: (id: string) => void;
    toggleAchieved: (id: string) => void;
    getDreamsByUser: (userId: string) => Dream[];
}

export const useDreamStore = create<DreamState>()(
    persist(
        (set, get) => ({
            dreams: [],
            addDream: (dreamData) => {
                const newDream: Dream = {
                    ...dreamData,
                    id: Math.random().toString(36).substring(2, 9),
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ dreams: [newDream, ...state.dreams] }));
            },
            updateDream: (id, updates) => {
                set((state) => ({
                    dreams: state.dreams.map((d) => (d.id === id ? { ...d, ...updates } : d)),
                }));
            },
            deleteDream: (id) => {
                set((state) => ({
                    dreams: state.dreams.filter((d) => d.id !== id),
                }));
            },
            toggleAchieved: (id) => {
                set((state) => ({
                    dreams: state.dreams.map((d) =>
                        d.id === id ? { ...d, isAchieved: !d.isAchieved } : d
                    ),
                }));
            },
            getDreamsByUser: (userId) => {
                return get().dreams.filter((d) => d.userId === userId);
            },
        }),
        {
            name: 'exammaster-dream-storage',
        }
    )
);
