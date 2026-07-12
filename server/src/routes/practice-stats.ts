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
// Body: { questionId, topic, userAnswer, correctAnswer, isCorrect }
router.post('/answer', (req: any, res) => {
    const { questionId, topic, userAnswer, isCorrect } = req.body;
    if (!questionId || !topic) {
        return res.status(400).json({ error: 'questionId and topic are required' });
    }

    const db = loadDB();
    
    // Get user's specific stats block
    if (!db.practiceStats[req.userId]) {
        db.practiceStats[req.userId] = { ...DEFAULT_PRACTICE_STATS };
    }
    const stats = db.practiceStats[req.userId];

    if (!stats.answeredQuestions) stats.answeredQuestions = {};
    if (!stats.dailyStats) stats.dailyStats = {};
    if (!stats.topicWiseScore) stats.topicWiseScore = [];

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
        lastUpdated: new Date().toISOString()
    };
    saveDB(db);
    res.json({ success: true });
});

export { router as practiceStatsRouter };
