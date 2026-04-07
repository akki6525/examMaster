import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    documentId: string;
}

interface FlashcardState {
    flashcards: Flashcard[];
    currentIndex: number;
    isFlipped: boolean;
    isLoading: boolean;
    error: string | null;

    fetchFlashcards: (documentId?: string) => Promise<void>;
    generateFlashcards: (documentId: string) => Promise<void>;
    nextCard: () => void;
    prevCard: () => void;
    toggleFlip: () => void;
    goToCard: (index: number) => void;
    shuffleCards: () => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
    flashcards: [],
    currentIndex: 0,
    isFlipped: false,
    isLoading: false,
    error: null,

    fetchFlashcards: async (documentId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const url = documentId
                ? `${API_URL}/flashcards?documentId=${documentId}`
                : `${API_URL}/flashcards`;
            const response = await axios.get(url);
            set({ flashcards: response.data, isLoading: false, currentIndex: 0 });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    generateFlashcards: async (documentId: string) => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/flashcards/generate/${documentId}`);
            await get().fetchFlashcards(documentId);
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    nextCard: () => {
        const state = get();
        if (state.currentIndex < state.flashcards.length - 1) {
            set({ currentIndex: state.currentIndex + 1, isFlipped: false });
        }
    },

    prevCard: () => {
        const state = get();
        if (state.currentIndex > 0) {
            set({ currentIndex: state.currentIndex - 1, isFlipped: false });
        }
    },

    toggleFlip: () => {
        set((state) => ({ isFlipped: !state.isFlipped }));
    },

    goToCard: (index: number) => {
        set({ currentIndex: index, isFlipped: false });
    },

    shuffleCards: () => {
        const state = get();
        const shuffled = [...state.flashcards].sort(() => Math.random() - 0.5);
        set({ flashcards: shuffled, currentIndex: 0, isFlipped: false });
    }
}));
