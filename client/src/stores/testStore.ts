import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface Question {
    id: string;
    type: 'mcq' | 'true-false' | 'short-answer' | 'fill-blank' | 'match';
    question: string;
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    subtopic?: string;
    source?: string;
    sourceType?: 'uploaded' | 'official';
    examName?: string;
    year?: number;
}

export interface Test {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    duration: number;
    totalMarks: number;
    createdAt: string;
}

export interface UserAnswer {
    questionId: string;
    answer: string | string[];
    timeTaken: number;
    flagged: boolean;
}

export interface TestResult {
    resultId: string;
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    topicWiseScore: {
        topic: string;
        correct: number;
        total: number;
        percentage: number;
    }[];
    detailedResults: (Question & {
        userAnswer: string | string[];
        isCorrect: boolean;
        timeTaken: number;
    })[];
}

interface TestState {
    tests: Test[];
    currentTest: Test | null;
    currentQuestionIndex: number;
    userAnswers: UserAnswer[];
    testResult: TestResult | null;
    isLoading: boolean;
    error: string | null;
    testStartTime: number | null;
    questionStartTime: number | null;

    fetchTests: () => Promise<void>;
    generateTest: (documentIds: string[], options?: {
        includeOfficial?: boolean;
        examTypes?: string[];
        questionCount?: number;
        duration?: number;
    }) => Promise<string>;
    startTest: (testId: string) => Promise<void>;
    setAnswer: (questionId: string, answer: string | string[]) => void;
    toggleFlag: (questionId: string) => void;
    goToQuestion: (index: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    submitTest: () => Promise<TestResult>;
    clearTest: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
    tests: [],
    currentTest: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    testResult: null,
    isLoading: false,
    error: null,
    testStartTime: null,
    questionStartTime: null,

    fetchTests: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get(`${API_URL}/tests`);
            set({ tests: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    generateTest: async (documentIds, options = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/tests/generate`, {
                documentIds,
                ...options
            });

            await get().fetchTests();
            set({ isLoading: false });
            return response.data.testId;
        } catch (error: any) {
            set({ error: error.response?.data?.error || error.message, isLoading: false });
            throw error;
        }
    },

    startTest: async (testId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/tests/${testId}`);
            const test = response.data;

            set({
                currentTest: test,
                currentQuestionIndex: 0,
                userAnswers: test.questions.map((q: Question) => ({
                    questionId: q.id,
                    answer: '',
                    timeTaken: 0,
                    flagged: false
                })),
                testResult: null,
                isLoading: false,
                testStartTime: Date.now(),
                questionStartTime: Date.now()
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    setAnswer: (questionId: string, answer: string | string[]) => {
        set((state) => ({
            userAnswers: state.userAnswers.map((ua) =>
                ua.questionId === questionId ? { ...ua, answer } : ua
            )
        }));
    },

    toggleFlag: (questionId: string) => {
        set((state) => ({
            userAnswers: state.userAnswers.map((ua) =>
                ua.questionId === questionId ? { ...ua, flagged: !ua.flagged } : ua
            )
        }));
    },

    goToQuestion: (index: number) => {
        const state = get();
        if (!state.currentTest) return;

        // Save time for current question
        if (state.questionStartTime !== null) {
            const timeSpent = Date.now() - state.questionStartTime;
            const currentQuestion = state.currentTest.questions[state.currentQuestionIndex];

            set((s) => ({
                userAnswers: s.userAnswers.map((ua) =>
                    ua.questionId === currentQuestion.id
                        ? { ...ua, timeTaken: ua.timeTaken + timeSpent }
                        : ua
                )
            }));
        }

        set({
            currentQuestionIndex: index,
            questionStartTime: Date.now()
        });
    },

    nextQuestion: () => {
        const state = get();
        if (!state.currentTest) return;

        if (state.currentQuestionIndex < state.currentTest.questions.length - 1) {
            get().goToQuestion(state.currentQuestionIndex + 1);
        }
    },

    prevQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex > 0) {
            get().goToQuestion(state.currentQuestionIndex - 1);
        }
    },

    submitTest: async () => {
        const state = get();
        if (!state.currentTest) throw new Error('No active test');

        // Save final question time
        if (state.questionStartTime !== null) {
            const timeSpent = Date.now() - state.questionStartTime;
            const currentQuestion = state.currentTest.questions[state.currentQuestionIndex];

            set((s) => ({
                userAnswers: s.userAnswers.map((ua) =>
                    ua.questionId === currentQuestion.id
                        ? { ...ua, timeTaken: ua.timeTaken + timeSpent }
                        : ua
                )
            }));
        }

        const totalTime = state.testStartTime ? Date.now() - state.testStartTime : 0;

        set({ isLoading: true });
        try {
            const response = await axios.post(`${API_URL}/tests/${state.currentTest.id}/submit`, {
                answers: get().userAnswers,
                timeTaken: totalTime
            });

            const result: TestResult = response.data;
            set({ testResult: result, isLoading: false });
            return result;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    clearTest: () => {
        set({
            currentTest: null,
            currentQuestionIndex: 0,
            userAnswers: [],
            testResult: null,
            testStartTime: null,
            questionStartTime: null
        });
    }
}));
