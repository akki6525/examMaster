import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface DocumentInfo {
    id: string;
    fileName: string;
    fileType: string;
    topicsCount: number;
    definitionsCount: number;
    keyTermsCount: number;
    createdAt: string;
}

export interface DocumentDetails {
    id: string;
    fileName: string;
    fileType: string;
    rawText: string;
    topics: any[];
    definitions: any[];
    keyTerms: string[];
    formulas: string[];
    questionableContent: any[];
    createdAt: string;
}

interface DocumentState {
    documents: DocumentInfo[];
    selectedDocument: DocumentDetails | null;
    isLoading: boolean;
    error: string | null;
    uploadProgress: Record<string, number>;

    fetchDocuments: () => Promise<void>;
    fetchDocument: (id: string) => Promise<void>;
    uploadFile: (file: File) => Promise<void>;
    uploadFiles: (files: File[]) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null,
    uploadProgress: {},

    fetchDocuments: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/documents`);
            set({ documents: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchDocument: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/documents/${id}`);
            set({ selectedDocument: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        set((state) => ({
            uploadProgress: { ...state.uploadProgress, [file.name]: 0 },
            error: null
        }));

        try {
            await axios.post(`${API_URL}/upload/single`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    set((state) => ({
                        uploadProgress: { ...state.uploadProgress, [file.name]: progress }
                    }));
                }
            });

            // Refresh documents list
            await get().fetchDocuments();

            // Clear progress after success
            set((state) => {
                const { [file.name]: _, ...rest } = state.uploadProgress;
                return { uploadProgress: rest };
            });
        } catch (error: any) {
            set({ error: error.response?.data?.error || error.message });
            throw error;
        }
    },

    uploadFiles: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        set({ isLoading: true, error: null });

        try {
            await axios.post(`${API_URL}/upload/multiple`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await get().fetchDocuments();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.error || error.message, isLoading: false });
            throw error;
        }
    },

    deleteDocument: async (id: string) => {
        try {
            await axios.delete(`${API_URL}/documents/${id}`);
            await get().fetchDocuments();
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    clearError: () => set({ error: null })
}));
