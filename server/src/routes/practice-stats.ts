import { Router } from 'express';
import { loadDB, saveDB, PracticeStatsDB } from '../services/persistence.js';

const router = Router();

function getDB() {
    return loadDB();
}

// GET /api/practice-stats  — returns current practice stats
router.get('/', (req, res) => {
    const db = getDB();
    res.json(db.practiceStats);
});

// POST /api/practice-stats/answer  — record a single answer
// Body: { questionId, topic, userAnswer, correctAnswer, isCorrect }
router.post('/answer', (req, res) => {
    const { questionId, topic, userAnswer, isCorrect } = req.body;
    if (!questionId || !topic) {
        return res.status(400).json({ error: 'questionId and topic are required' });
    }

    const db = getDB();
    const stats = db.practiceStats;

    const alreadyAnswered = !!stats.answeredQuestions[questionId];

    // Record the answer (overwrite if re-answered)
    const wasCorrectBefore = stats.answeredQuestions[questionId]?.isCorrect ?? false;
    stats.answeredQuestions[questionId] = { userAnswer, isCorrect: !!isCorrect };

    // Adjust totals
    if (!alreadyAnswered) {
        stats.totalAttempted++;
        if (isCorrect) stats.correct++;
        else stats.incorrect++;

        // Update daily stats (use local time for consistency with user experience)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        stats.dailyStats = stats.dailyStats || {};
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
    db.practiceStats = stats;
    saveDB(db);

    res.json({ success: true, stats });
});

// DELETE /api/practice-stats  — reset all practice stats
router.delete('/', (req, res) => {
    const db = getDB();
    db.practiceStats = {
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
