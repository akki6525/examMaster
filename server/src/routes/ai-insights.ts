import { Router } from 'express';
import { testResults } from './tests.js';
import { loadDB } from '../services/persistence.js';

const router = Router();

router.get('/dashboard', (req, res) => {
    const results = Array.from(testResults.values())
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    const db = loadDB();
    const practiceStats = db.practiceStats || { totalAttempted: 0, correct: 0, incorrect: 0 };

    // AI Prediction Logic
    let predictedScore = 0;
    let priorityTopic = 'General Awareness';
    let studyGoal = 'Complete 1 Mock Test';
    let learningStreak = 1;

    if (results.length > 0) {
        // Simple moving average for predicted score
        const recentScores = results.slice(0, 5).map(r => r.percentage);
        predictedScore = Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length);
        
        // Find weakest topic from last 3 tests
        const topicCounts: Record<string, { correct: number; total: number }> = {};
        results.slice(0, 3).forEach(r => {
            r.topicWiseScore.forEach(ts => {
                if (!topicCounts[ts.topic]) topicCounts[ts.topic] = { correct: 0, total: 0 };
                topicCounts[ts.topic].correct += ts.correct;
                topicCounts[ts.topic].total += ts.total;
            });
        });

        let minAccuracy = 101;
        for (const [topic, counts] of Object.entries(topicCounts)) {
            const accuracy = (counts.correct / counts.total) * 100;
            if (accuracy < minAccuracy) {
                minAccuracy = accuracy;
                priorityTopic = topic;
            }
        }

        // Streak calculation (days with at least one test)
        const dates = new Set(results.map(r => new Date(r.completedAt).toDateString()));
        learningStreak = dates.size;
        
        if (predictedScore < 50) studyGoal = `Revise ${priorityTopic} fundamentals`;
        else if (predictedScore < 80) studyGoal = `Practice 20 questions in ${priorityTopic}`;
        else studyGoal = 'Try a Hard difficulty Mock Test';
    }

    res.json({
        predictedScore,
        priorityTopic,
        studyGoal,
        learningStreak,
        lastTestDate: results.length > 0 ? results[0].completedAt : null,
        totalQuestionsAnswered: practiceStats.totalAttempted
    });
});

export { router as insightsRouter };
