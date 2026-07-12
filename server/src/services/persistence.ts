import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MockTest, TestResult } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'db.json');

export interface UserRecord {
    id: string;
    username: string;
    name: string;
    passwordHash: string;
    email: string;
    phone: string;
    avatar?: string;
}

export interface PracticeStatsDB {
    totalAttempted: number;
    correct: number;
    incorrect: number;
    topicWiseScore: { topic: string; correct: number; total: number; percentage: number }[];
    answeredQuestions: Record<string, { userAnswer: string; isCorrect: boolean }>;
    dailyStats: Record<string, { total: number; correct: number }>;
    lastUpdated: string;
}

interface DB {
    users: Record<string, UserRecord>;
    mockTests: Record<string, MockTest & { userId?: string }>;
    testResults: Record<string, TestResult & { userId?: string }>;
    importedQuestions: any[];
    documents: Record<string, any>;
    flashcards: Record<string, any>;
    practiceStats: Record<string, PracticeStatsDB>;
}

export const DEFAULT_PRACTICE_STATS: PracticeStatsDB = {
    totalAttempted: 0,
    correct: 0,
    incorrect: 0,
    topicWiseScore: [],
    answeredQuestions: {},
    dailyStats: {},
    lastUpdated: new Date().toISOString()
};

function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function loadDB(): DB {
    ensureDataDir();
    if (!existsSync(DB_PATH)) {
        return { users: {}, mockTests: {}, testResults: {}, importedQuestions: [], documents: {}, flashcards: {}, practiceStats: {} };
    }
    try {
        const raw = readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        
        if (!parsed.users) parsed.users = {};
        if (!parsed.mockTests) parsed.mockTests = {};
        if (!parsed.testResults) parsed.testResults = {};
        if (!parsed.importedQuestions) parsed.importedQuestions = [];
        if (!parsed.documents) parsed.documents = {};
        if (!parsed.flashcards) parsed.flashcards = {};
        if (!parsed.practiceStats) parsed.practiceStats = {};

        // Restore Date objects for MockTest and TestResult
        for (const id in parsed.mockTests) {
            parsed.mockTests[id].createdAt = new Date(parsed.mockTests[id].createdAt);
        }
        for (const id in parsed.testResults) {
            parsed.testResults[id].completedAt = new Date(parsed.testResults[id].completedAt);
        }
        
        return parsed;
    } catch {
        return { users: {}, mockTests: {}, testResults: {}, importedQuestions: [], documents: {}, flashcards: {}, practiceStats: {} };
    }
}

export function saveDB(db: DB): void {
    ensureDataDir();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function getPracticeStats(userId: string): PracticeStatsDB {
    const db = loadDB();
    if (!db.practiceStats[userId]) {
        db.practiceStats[userId] = { ...DEFAULT_PRACTICE_STATS };
        saveDB(db);
    }
    
    // Ensure nested fields are present
    const stats = db.practiceStats[userId];
    if (!stats.answeredQuestions) stats.answeredQuestions = {};
    if (!stats.dailyStats) stats.dailyStats = {};
    if (!stats.topicWiseScore) stats.topicWiseScore = [];
    
    return stats;
}

