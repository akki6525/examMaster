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
    individual_user_logged_in_time?: number;
}

export interface PracticeStatsDB {
    totalAttempted: number;
    correct: number;
    incorrect: number;
    topicWiseScore: { topic: string; correct: number; total: number; percentage: number }[];
    answeredQuestions: Record<string, { userAnswer: string; isCorrect: boolean }>;
    dailyStats: Record<string, { total: number; correct: number }>;
    lastUpdated: string;
    eliminationStats?: {
        skipped: number;
        wrong: number;
        correct: number;
        questions: Record<string, {
            eliminatedCount: number;
            userAnswer?: string | string[];
            isCorrect?: boolean;
            status: 'skipped' | 'wrong' | 'correct';
        }>;
    };
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
    lastUpdated: new Date().toISOString(),
    eliminationStats: {
        skipped: 0,
        wrong: 0,
        correct: 0,
        questions: {}
    }
};

import { encrypt, decrypt } from '../utils/crypto.js';

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

        // Decrypt user records transparently
        for (const userId in parsed.users) {
            const u = parsed.users[userId];
            if (u) {
                u.username = decrypt(u.username);
                u.name = decrypt(u.name);
                u.email = decrypt(u.email);
                u.phone = decrypt(u.phone);
            }
        }

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
    
    // Create serialized users copies with encrypted credentials to write to file
    const serializedUsers: Record<string, UserRecord> = {};
    for (const userId in db.users) {
        const u = db.users[userId];
        if (u) {
            serializedUsers[userId] = {
                ...u,
                username: encrypt(u.username),
                name: encrypt(u.name),
                email: encrypt(u.email),
                phone: encrypt(u.phone)
            };
        }
    }
    
    const dbToSave = {
        ...db,
        users: serializedUsers
    };
    
    writeFileSync(DB_PATH, JSON.stringify(dbToSave, null, 2), 'utf-8');
}

export function getPracticeStats(userId: string): PracticeStatsDB {
    const db = loadDB();
    if (!db.practiceStats[userId]) {
        db.practiceStats[userId] = JSON.parse(JSON.stringify(DEFAULT_PRACTICE_STATS));
        saveDB(db);
    }
    
    // Ensure nested fields are present
    const stats = db.practiceStats[userId];
    if (!stats.answeredQuestions) stats.answeredQuestions = {};
    if (!stats.dailyStats) stats.dailyStats = {};
    if (!stats.topicWiseScore) stats.topicWiseScore = [];
    if (!stats.eliminationStats) {
        stats.eliminationStats = {
            skipped: 0,
            wrong: 0,
            correct: 0,
            questions: {}
        };
    }
    
    return stats;
}

