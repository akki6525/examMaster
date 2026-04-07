import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MockTest, TestResult } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'db.json');

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
    mockTests: Record<string, MockTest>;
    testResults: Record<string, TestResult>;
    importedQuestions: any[];
    practiceStats: PracticeStatsDB;
}

const DEFAULT_PRACTICE_STATS: PracticeStatsDB = {
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
        return { mockTests: {}, testResults: {}, importedQuestions: [], practiceStats: DEFAULT_PRACTICE_STATS };
    }
    try {
        const raw = readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Restore Date objects for MockTest and TestResult
        for (const id in parsed.mockTests) {
            parsed.mockTests[id].createdAt = new Date(parsed.mockTests[id].createdAt);
        }
        for (const id in parsed.testResults) {
            parsed.testResults[id].completedAt = new Date(parsed.testResults[id].completedAt);
        }
        // Ensure practiceStats exists for backward compat
        if (!parsed.practiceStats) {
            parsed.practiceStats = DEFAULT_PRACTICE_STATS;
        }
        if (!parsed.practiceStats.answeredQuestions) {
            parsed.practiceStats.answeredQuestions = {};
        }
        if (!parsed.practiceStats.dailyStats) {
            parsed.practiceStats.dailyStats = {};
        }
        return parsed;
    } catch {
        return { mockTests: {}, testResults: {}, importedQuestions: [], practiceStats: DEFAULT_PRACTICE_STATS };
    }
}

export function saveDB(db: DB): void {
    ensureDataDir();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}
