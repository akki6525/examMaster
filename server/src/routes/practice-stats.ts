import { Router } from 'express';
import { loadDB, saveDB, getPracticeStats, DEFAULT_PRACTICE_STATS } from '../services/persistence.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect all stats endpoints
router.use(authMiddleware);

// GET /api/practice-stats  — returns current user's practice stats
router.get('/', (req: any, res) => {
    const stats = getPracticeStats(req.userId);
    res.json(stats);
});

// POST /api/practice-stats/answer  — record a single answer
// Body: { questionId, topic, userAnswer, correctAnswer, isCorrect, eliminatedCount? }
router.post('/answer', (req: any, res) => {
    const { questionId, topic, userAnswer, isCorrect, eliminatedCount } = req.body;
    if (!questionId || !topic) {
        return res.status(400).json({ error: 'questionId and topic are required' });
    }

    const db = loadDB();
    
    // Get user's specific stats block
    if (!db.practiceStats[req.userId]) {
        db.practiceStats[req.userId] = JSON.parse(JSON.stringify(DEFAULT_PRACTICE_STATS));
    }
    const stats = db.practiceStats[req.userId];

    if (!stats.answeredQuestions) stats.answeredQuestions = {};
    if (!stats.dailyStats) stats.dailyStats = {};
    if (!stats.topicWiseScore) stats.topicWiseScore = [];
    if (!stats.eliminationStats) {
        stats.eliminationStats = { skipped: 0, wrong: 0, correct: 0, questions: {} };
    }
    if (!stats.eliminationStats.questions) stats.eliminationStats.questions = {};

    const alreadyAnswered = !!stats.answeredQuestions[questionId];

    // Record the answer (overwrite if re-answered)
    const wasCorrectBefore = stats.answeredQuestions[questionId]?.isCorrect ?? false;
    stats.answeredQuestions[questionId] = { userAnswer, isCorrect: !!isCorrect };

    // Adjust totals
    if (!alreadyAnswered) {
        stats.totalAttempted++;
        if (isCorrect) stats.correct++;
        else stats.incorrect++;

        // Update daily stats
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (!stats.dailyStats[today] || typeof stats.dailyStats[today] === 'number') {
            stats.dailyStats[today] = { total: 0, correct: 0 };
        }
        stats.dailyStats[today].total += 1;
        if (isCorrect) stats.dailyStats[today].correct += 1;
    } else {
        // Update correct/incorrect if answer changed
        if (wasCorrectBefore && !isCorrect) {
            stats.correct--;
            stats.incorrect++;
        } else if (!wasCorrectBefore && isCorrect) {
            stats.incorrect--;
            stats.correct++;
        }
    }

    // Update topic-wise scores
    let topicEntry = stats.topicWiseScore.find(t => t.topic === topic);
    if (!topicEntry) {
        topicEntry = { topic, correct: 0, total: 0, percentage: 0 };
        stats.topicWiseScore.push(topicEntry);
    }

    if (!alreadyAnswered) {
        topicEntry.total++;
        if (isCorrect) topicEntry.correct++;
    } else {
        if (wasCorrectBefore && !isCorrect) topicEntry.correct--;
        else if (!wasCorrectBefore && isCorrect) topicEntry.correct++;
    }
    topicEntry.percentage = topicEntry.total > 0
        ? Math.round((topicEntry.correct / topicEntry.total) * 100) : 0;

    // --- Atomically update elimination stats ---
    const questionsMap = stats.eliminationStats.questions;
    const existingElim = questionsMap[questionId];
    const usedElimination = (eliminatedCount && eliminatedCount > 0) || !!existingElim;

    if (usedElimination) {
        if (existingElim) {
            // Remove old count contribution
            if (existingElim.status === 'skipped') stats.eliminationStats.skipped--;
            else if (existingElim.status === 'wrong') stats.eliminationStats.wrong--;
            else if (existingElim.status === 'correct') stats.eliminationStats.correct--;

            // Update with new answer status
            existingElim.status = isCorrect ? 'correct' : 'wrong';
            existingElim.userAnswer = userAnswer;
            existingElim.isCorrect = !!isCorrect;
            if (eliminatedCount !== undefined) existingElim.eliminatedCount = eliminatedCount;
        } else if (eliminatedCount && eliminatedCount > 0) {
            // First time this question is being answered WITH eliminations used
            // (the /elimination POST may have been lost or not yet fired)
            questionsMap[questionId] = {
                eliminatedCount,
                userAnswer,
                isCorrect: !!isCorrect,
                status: isCorrect ? 'correct' : 'wrong'
            };
        }

        // Re-apply count from updated/new record
        const updatedRecord = questionsMap[questionId];
        if (updatedRecord) {
            if (updatedRecord.status === 'correct') stats.eliminationStats.correct++;
            else if (updatedRecord.status === 'wrong') stats.eliminationStats.wrong++;
        }
    }

    stats.eliminationStats.questions = questionsMap;
    stats.lastUpdated = new Date().toISOString();
    db.practiceStats[req.userId] = stats;
    saveDB(db);

    res.json({ success: true, stats });
});

// POST /api/practice-stats/elimination — record/toggle option elimination
router.post('/elimination', (req: any, res) => {
    const { questionId, topic, eliminatedCount } = req.body;
    if (!questionId) {
        return res.status(400).json({ error: 'questionId is required' });
    }

    const db = loadDB();
    if (!db.practiceStats[req.userId]) {
        db.practiceStats[req.userId] = JSON.parse(JSON.stringify(DEFAULT_PRACTICE_STATS));
    }
    const stats = db.practiceStats[req.userId];
    if (!stats.answeredQuestions) stats.answeredQuestions = {};
    if (!stats.dailyStats) stats.dailyStats = {};
    if (!stats.topicWiseScore) stats.topicWiseScore = [];
    if (!stats.eliminationStats) {
        stats.eliminationStats = { skipped: 0, wrong: 0, correct: 0, questions: {} };
    }

    const questionsMap = stats.eliminationStats.questions || {};
    const existing = questionsMap[questionId];

    if (eliminatedCount > 0) {
        if (!existing) {
            // Check if this question was already answered in general practice
            const generalAnswer = stats.answeredQuestions && stats.answeredQuestions[questionId];
            if (generalAnswer) {
                // If it was already answered, it inherits that status
                const isCorrect = generalAnswer.isCorrect;
                questionsMap[questionId] = {
                    eliminatedCount,
                    userAnswer: generalAnswer.userAnswer,
                    isCorrect: !!isCorrect,
                    status: isCorrect ? 'correct' : 'wrong'
                };
                if (isCorrect) stats.eliminationStats.correct++;
                else stats.eliminationStats.wrong++;
            } else {
                // New skipped (unattempted) question
                questionsMap[questionId] = {
                    eliminatedCount,
                    status: 'skipped'
                };
                stats.eliminationStats.skipped++;
            }
        } else {
            // Update the count of eliminated options
            existing.eliminatedCount = eliminatedCount;
        }
    } else if (existing) {
        // If eliminatedCount is 0, they cleared option elimination on this question, remove stats count contribution
        if (existing.status === 'skipped') stats.eliminationStats.skipped--;
        else if (existing.status === 'wrong') stats.eliminationStats.wrong--;
        else if (existing.status === 'correct') stats.eliminationStats.correct--;
        delete questionsMap[questionId];
    }

    stats.eliminationStats.questions = questionsMap;
    stats.lastUpdated = new Date().toISOString();
    db.practiceStats[req.userId] = stats;
    saveDB(db);

    res.json({ success: true, stats });
});

// DELETE /api/practice-stats  — reset current user's stats
router.delete('/', (req: any, res) => {
    const db = loadDB();
    db.practiceStats[req.userId] = {
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
    saveDB(db);
    res.json({ success: true });
});

export { router as practiceStatsRouter };
