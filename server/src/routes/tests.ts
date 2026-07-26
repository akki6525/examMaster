import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { documents } from './upload.js';
import { generateQuestions } from '../services/question-generator.js';
import { MockTest, TestResult, Question, UserAnswer, TopicScore } from '../types/index.js';
import { getOfficialQuestions } from './official-questions.js';
import { loadDB, saveDB } from '../services/persistence.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Load from persistent storage on startup
const _db = loadDB();
export const mockTests: Map<string, MockTest & { userId?: string }> = new Map(Object.entries(_db.mockTests));
export const testResults: Map<string, TestResult & { userId?: string }> = new Map(Object.entries(_db.testResults));

// Protect all test routes
router.use(authMiddleware);

function persistDB() {
    const currentDB = loadDB();
    saveDB({
        ...currentDB,
        mockTests: Object.fromEntries(mockTests),
        testResults: Object.fromEntries(testResults),
    });
}

// Generate mock test from uploaded documents or official questions
router.post('/generate', async (req: any, res) => {
    try {
        const { documentIds = [], includeOfficial = false, examTypes = [], questionCount = 30, duration = 60, year } = req.body;

        let questions: Question[] = [];

        if (documentIds && documentIds.length > 0) {
            const allContent: any[] = [];
            for (const docId of documentIds) {
                const doc = documents.get(docId);
                // Ensure document exists and belongs to the requesting user
                if (doc && doc.userId === req.userId) {
                    allContent.push(doc);
                }
            }
            if (allContent.length > 0) {
                const docQuestionLimit = includeOfficial && examTypes.length > 0
                    ? Math.ceil(questionCount * 0.7)
                    : questionCount;
                const generatedQuestions = await generateQuestions(allContent, docQuestionLimit);
                questions = [...questions, ...generatedQuestions];
            }
        }

        // AI Optimization: Prioritize questions from topics where user has lower accuracy
        const db = loadDB();
        const userStats = db.practiceStats[req.userId] || { topicWiseScore: [] };
        const topicStats = userStats.topicWiseScore || [];
        const weakTopics = topicStats
            .filter(ts => ts.total > 0 && (ts.correct / ts.total) < 0.7)
            .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
            .map(ts => ts.topic.toLowerCase());

        if ((includeOfficial || documentIds.length === 0) && examTypes && examTypes.length > 0) {
            let official = getOfficialQuestions().filter(q =>
                examTypes.some((et: string) =>
                    q.examName?.toUpperCase() === et.toUpperCase() ||
                    q.examName?.replace(' ', '-').toUpperCase() === et.toUpperCase()
                )
            );
            if (year) official = official.filter(q => q.year === year);
            
            // AI Re-ranking: Move questions from weak topics to the front
            official = official.sort((a, b) => {
                const aIsWeak = weakTopics.includes(a.topic.toLowerCase());
                const bIsWeak = weakTopics.includes(b.topic.toLowerCase());
                if (aIsWeak && !bIsWeak) return -1;
                if (!aIsWeak && bIsWeak) return 1;
                return Math.random() - 0.5;
            });

            const officialCount = documentIds.length > 0 ? Math.floor(questionCount * 0.3) : questionCount;
            questions = [...questions, ...official.slice(0, officialCount)];
        }

        if (questions.length === 0) {
            return res.status(400).json({ error: 'No questions available. Please select an exam type or upload documents.' });
        }

        // Deduplicate questions to prevent identical questions from appearing multiple times
        const uniqueQuestions = new Map();
        questions.forEach(q => uniqueQuestions.set((q.question || '').trim().toLowerCase(), q));
        questions = Array.from(uniqueQuestions.values());

        questions = questions.sort(() => Math.random() - 0.5).slice(0, questionCount);

        const testId = uuidv4();
        const examName = examTypes.length > 0 ? examTypes.join(', ') : 'Mixed';
        const formattedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const mockTest: MockTest & { userId?: string } = {
            id: testId,
            title: `${examName} Mock Test - ${formattedDate}`,
            description: `Test with ${questions.length} questions${examTypes.length > 0 ? ` from ${examName}` : ''}`,
            questions,
            duration,
            totalMarks: questions.length,
            createdAt: new Date(),
            userId: req.userId
        };

        mockTests.set(testId, mockTest);
        persistDB();

        res.json({
            success: true,
            testId,
            title: mockTest.title,
            questionCount: questions.length,
            duration: mockTest.duration,
            totalMarks: mockTest.totalMarks
        });
    } catch (error) {
        console.error('Test generation error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Generate quick practice test
router.post('/quick-practice', async (req: any, res) => {
    try {
        const { documentId, topic, questionCount = 10 } = req.body;
        const doc = documents.get(documentId);
        
        // Security check: ensure doc belongs to user
        if (!doc || doc.userId !== req.userId) {
            return res.status(404).json({ error: 'Document not found' });
        }

        let questions = await generateQuestions([doc], questionCount);
        if (topic) {
            questions = questions.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()));
        }

        const testId = uuidv4();
        const mockTest: MockTest & { userId?: string } = {
            id: testId,
            title: `Quick Practice - ${topic || 'All Topics'}`,
            description: 'Practice mode - no time limit',
            questions: questions.slice(0, questionCount),
            duration: 0,
            totalMarks: questions.length,
            createdAt: new Date(),
            userId: req.userId
        };

        mockTests.set(testId, mockTest);
        persistDB();

        res.json({ success: true, testId, title: mockTest.title, questionCount: mockTest.questions.length });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get ALL results for authenticated user (for AI report) - must be before /:id to avoid shadowing
router.get('/results', (req: any, res) => {
    const currentUserId = req.userId || 'default-user';
    const db = loadDB();
    const dbUser = db.users[currentUserId];
    const username = dbUser ? dbUser.username : '';

    const results = Array.from(testResults.values())
        .filter(r => {
            if (currentUserId === 'default-user') {
                return !r.userId || r.userId === 'default-user';
            }
            return r.userId === currentUserId || (username && r.userId === username);
        })
        .map(r => {
            const test = mockTests.get(r.testId);
            return {
                id: r.id,
                testId: r.testId,
                testTitle: test?.title || 'Unknown Test',
                score: r.score,
                totalMarks: r.totalMarks,
                percentage: r.percentage,
                timeTaken: r.timeTaken,
                duration: test?.duration || 0,
                topicWiseScore: r.topicWiseScore,
                completedAt: r.completedAt
            };
        }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    res.json(results);
});

// Get test by ID for authenticated user
router.get('/:id', (req: any, res) => {
    const test = mockTests.get(req.params.id);
    if (!test || (test.userId && test.userId !== req.userId && req.userId !== 'default-user')) {
        return res.status(404).json({ error: 'Test not found' });
    }

    const testWithoutAnswers = {
        ...test,
        questions: test.questions.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            topic: q.topic
        }))
    };
    res.json(testWithoutAnswers);
});

// Get all tests for authenticated user
router.get('/', (req: any, res) => {
    const tests = Array.from(mockTests.values())
        .filter(test => !test.userId || test.userId === req.userId || req.userId === 'default-user')
        .map(test => ({
            id: test.id,
            title: test.title,
            description: test.description,
            questionCount: test.questions.length,
            duration: test.duration,
            totalMarks: test.totalMarks,
            createdAt: test.createdAt
        }));
    res.json(tests);
});

// Submit test answers
router.post('/:id/submit', (req: any, res) => {
    const test = mockTests.get(req.params.id);
    if (!test || (test.userId && test.userId !== req.userId && req.userId !== 'default-user')) {
        return res.status(404).json({ error: 'Test not found' });
    }

    const { answers, timeTaken } = req.body;
    if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'Answers array required' });

    const db = loadDB();
    const userAnswers: UserAnswer[] = [];
    const topicScores: Map<string, { correct: number; total: number; attempted: number; totalTime: number }> = new Map();
    let totalCorrect = 0;
    let totalWrong = 0;
    const currentUserId = req.userId || 'default-user';
    if (!db.practiceStats) db.practiceStats = {};
    if (!db.practiceStats[currentUserId]) {
        db.practiceStats[currentUserId] = {
            totalAttempted: 0,
            correct: 0,
            incorrect: 0,
            topicWiseScore: [],
            answeredQuestions: {},
            dailyStats: {},
            lastUpdated: new Date().toISOString(),
            eliminationStats: { skipped: 0, wrong: 0, correct: 0, questions: {} }
        };
    }
    const practiceStats = db.practiceStats[currentUserId];
    if (!practiceStats.eliminationStats) {
        practiceStats.eliminationStats = { skipped: 0, wrong: 0, correct: 0, questions: {} };
    }
    if (!practiceStats.answeredQuestions) practiceStats.answeredQuestions = {};
    if (!practiceStats.dailyStats) practiceStats.dailyStats = {};

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (const test_question of test.questions) {
        const userAnswer = answers.find((a: any) => a.questionId === test_question.id);
        const providedAnswer = userAnswer?.answer;
        const isAttempted = providedAnswer !== undefined && providedAnswer !== null && providedAnswer !== '';
        
        let isCorrect = false;
        if (isAttempted) {
            const normUser = String(providedAnswer).trim().toLowerCase();
            const normCorr = String(test_question.correctAnswer).trim().toLowerCase();
            isCorrect = normUser === normCorr;
            if (!isCorrect && typeof test_question.correctAnswer === 'string' && test_question.correctAnswer.length === 1 && test_question.options) {
                const charCode = test_question.correctAnswer.toUpperCase().charCodeAt(0) - 65;
                if (charCode >= 0 && charCode < test_question.options.length) {
                    isCorrect = String(test_question.options[charCode]).trim().toLowerCase() === normUser;
                }
            }
        }

        if (isCorrect) {
            totalCorrect++;
        } else if (isAttempted) {
            totalWrong++;
        }

        userAnswers.push({
            questionId: test_question.id,
            userAnswer: providedAnswer || '',
            isCorrect: !!isCorrect,
            timeTaken: userAnswer?.timeTaken || 0,
            flagged: userAnswer?.flagged || false
        });

        // Sync with practiceStats for cumulative stats
        if (isAttempted) {
            const topic = test_question.topic || 'General';
            const alreadyAnswered = !!practiceStats.answeredQuestions[test_question.id];
            practiceStats.answeredQuestions[test_question.id] = { userAnswer: String(providedAnswer), isCorrect: !!isCorrect };

            if (!alreadyAnswered) {
                practiceStats.totalAttempted++;
                if (isCorrect) practiceStats.correct++;
                else practiceStats.incorrect++;

                if (!practiceStats.dailyStats[today] || typeof practiceStats.dailyStats[today] === 'number') {
                    practiceStats.dailyStats[today] = { total: 0, correct: 0 };
                }
                practiceStats.dailyStats[today].total += 1;
                if (isCorrect) practiceStats.dailyStats[today].correct += 1;
            }

            let topicEntry = practiceStats.topicWiseScore.find(t => t.topic === topic);
            if (!topicEntry) {
                topicEntry = { topic, correct: 0, total: 0, percentage: 0 };
                practiceStats.topicWiseScore.push(topicEntry);
            }
            if (!alreadyAnswered) {
                topicEntry.total++;
                if (isCorrect) topicEntry.correct++;
            }
            topicEntry.percentage = topicEntry.total > 0 ? Math.round((topicEntry.correct / topicEntry.total) * 100) : 0;
        }

        // Track elimination technique in mock tests
        const eliminatedOptions = userAnswer?.eliminatedOptions || [];
        if (eliminatedOptions.length > 0) {
            const questionsMap = practiceStats.eliminationStats.questions || {};
            const existing = questionsMap[test_question.id];
            if (existing) {
                if (existing.status === 'skipped') practiceStats.eliminationStats.skipped--;
                else if (existing.status === 'wrong') practiceStats.eliminationStats.wrong--;
                else if (existing.status === 'correct') practiceStats.eliminationStats.correct--;
            }
            const status = !isAttempted ? 'skipped' : (isCorrect ? 'correct' : 'wrong');
            questionsMap[test_question.id] = {
                eliminatedCount: eliminatedOptions.length,
                userAnswer: providedAnswer || '',
                isCorrect: !!isCorrect,
                status
            };
            if (status === 'skipped') practiceStats.eliminationStats.skipped++;
            else if (status === 'wrong') practiceStats.eliminationStats.wrong++;
            else if (status === 'correct') practiceStats.eliminationStats.correct++;
        }

        const topicScore = topicScores.get(test_question.topic) || { correct: 0, total: 0, attempted: 0, totalTime: 0 };
        topicScore.total++;
        topicScore.totalTime += (userAnswer?.timeTaken || 0);
        if (isCorrect) topicScore.correct++;
        if (isAttempted) topicScore.attempted++;
        topicScores.set(test_question.topic, topicScore);
    }

    practiceStats.lastUpdated = new Date().toISOString();
    db.practiceStats[currentUserId] = practiceStats;
    saveDB(db);

    const topicWiseScore: TopicScore[] = Array.from(topicScores.entries()).map(([topic, score]) => ({
        topic,
        correct: score.correct,
        total: score.total,
        attempted: score.attempted,
        percentage: Math.round((score.correct / score.total) * 100),
        avgTime: Math.round(score.totalTime / score.total)
    } as any));

    const calculatedScore = totalCorrect - (totalWrong * 0.25);
    const scorePercentage = Math.round((calculatedScore / test.questions.length) * 100);

    const resultId = uuidv4();
    const result: TestResult & { userId?: string } = {
        id: resultId,
        testId: test.id,
        answers: userAnswers,
        score: parseFloat(calculatedScore.toFixed(2)),
        totalMarks: test.questions.length,
        percentage: Math.max(0, scorePercentage),
        timeTaken: timeTaken || 0,
        topicWiseScore,
        completedAt: new Date(),
        userId: req.userId
    };

    testResults.set(resultId, result);
    persistDB();

    res.json({
        resultId,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        timeTaken: result.timeTaken,
        topicWiseScore: result.topicWiseScore,
        detailedResults: test.questions.map(q => {
            const ua = userAnswers.find(a => a.questionId === q.id);
            return { ...q, userAnswer: ua?.userAnswer, isCorrect: ua?.isCorrect, timeTaken: ua?.timeTaken };
        })
    });
});

// Get test result
router.get('/results/:resultId', (req: any, res) => {
    const result = testResults.get(req.params.resultId);
    if (!result || result.userId !== req.userId) {
        return res.status(404).json({ error: 'Result not found' });
    }

    const test = mockTests.get(result.testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const detailedResults = test.questions.map(q => {
        const userAnswer = result.answers.find(a => a.questionId === q.id);
        return {
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            difficulty: q.difficulty,
            topic: q.topic,
            examName: (q as any).examName,
            year: (q as any).year,
            userAnswer: userAnswer?.userAnswer || '',
            isCorrect: userAnswer?.isCorrect || false,
            timeTaken: userAnswer?.timeTaken || 0
        };
    });

    res.json({
        resultId: result.id,
        testId: result.testId,
        testTitle: test.title,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        timeTaken: result.timeTaken,
        duration: test.duration || 0,
        topicWiseScore: result.topicWiseScore,
        completedAt: result.completedAt,
        detailedResults
    });
});

// Delete a test result
router.delete('/results/:resultId', (req: any, res) => {
    const result = testResults.get(req.params.resultId);
    if (!result || result.userId !== req.userId) {
        return res.status(404).json({ error: 'Result not found' });
    }

    testResults.delete(req.params.resultId);
    persistDB();
    res.json({ success: true });
});

export { router as testsRouter };
