import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { documents } from './upload.js';
import { generateQuestions } from '../services/question-generator.js';
import { MockTest, TestResult, Question, UserAnswer, TopicScore } from '../types/index.js';
import { officialQuestions } from './official-questions.js';
import { loadDB, saveDB } from '../services/persistence.js';

const router = Router();

// Load from persistent storage on startup
const _db = loadDB();
export const mockTests: Map<string, MockTest> = new Map(Object.entries(_db.mockTests));
export const testResults: Map<string, TestResult> = new Map(Object.entries(_db.testResults));

function persistDB() {
    const currentDB = loadDB();
    saveDB({
        mockTests: Object.fromEntries(mockTests),
        testResults: Object.fromEntries(testResults),
        importedQuestions: [],
        practiceStats: currentDB.practiceStats
    });
}

// Generate mock test from uploaded documents or official questions
router.post('/generate', async (req, res) => {
    try {
        const { documentIds = [], includeOfficial = false, examTypes = [], questionCount = 30, duration = 60, year } = req.body;

        let questions: Question[] = [];

        if (documentIds && documentIds.length > 0) {
            const allContent: any[] = [];
            for (const docId of documentIds) {
                const doc = documents.get(docId);
                if (doc) allContent.push(doc);
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
        const topicStats = db.practiceStats?.topicWiseScore || [];
        const weakTopics = topicStats
            .filter(ts => ts.total > 0 && (ts.correct / ts.total) < 0.7)
            .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
            .map(ts => ts.topic.toLowerCase());

        if ((includeOfficial || documentIds.length === 0) && examTypes && examTypes.length > 0) {
            let official = officialQuestions.filter(q =>
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
        const mockTest: MockTest = {
            id: testId,
            title: `${examName} Mock Test - ${formattedDate}`,
            description: `Test with ${questions.length} questions${examTypes.length > 0 ? ` from ${examName}` : ''}`,
            questions,
            duration,
            totalMarks: questions.length,
            createdAt: new Date()
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
router.post('/quick-practice', async (req, res) => {
    try {
        const { documentId, topic, questionCount = 10 } = req.body;
        const doc = documents.get(documentId);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        let questions = await generateQuestions([doc], questionCount);
        if (topic) {
            questions = questions.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()));
        }

        const testId = uuidv4();
        const mockTest: MockTest = {
            id: testId,
            title: `Quick Practice - ${topic || 'All Topics'}`,
            description: 'Practice mode - no time limit',
            questions: questions.slice(0, questionCount),
            duration: 0,
            totalMarks: questions.length,
            createdAt: new Date()
        };

        mockTests.set(testId, mockTest);
        persistDB();

        res.json({ success: true, testId, title: mockTest.title, questionCount: mockTest.questions.length });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get ALL results (for AI report) - must be before /:id to avoid shadowing
router.get('/results', (req, res) => {
    const results = Array.from(testResults.values()).map(r => {
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

// Get test by ID
router.get('/:id', (req, res) => {
    const test = mockTests.get(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

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

// Get all tests
router.get('/', (req, res) => {
    const tests = Array.from(mockTests.values()).map(test => ({
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
router.post('/:id/submit', (req, res) => {
    const test = mockTests.get(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const { answers, timeTaken } = req.body;
    if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'Answers array required' });

    const userAnswers: UserAnswer[] = [];
    const topicScores: Map<string, { correct: number; total: number; attempted: number; totalTime: number }> = new Map();
    let totalCorrect = 0;
    let totalWrong = 0;

    for (const test_question of test.questions) {
        const userAnswer = answers.find((a: any) => a.questionId === test_question.id);
        const providedAnswer = userAnswer?.answer;
        const isAttempted = providedAnswer !== undefined && providedAnswer !== null && providedAnswer !== '';
        const isCorrect = isAttempted && JSON.stringify(providedAnswer) === JSON.stringify(test_question.correctAnswer);

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

        const topicScore = topicScores.get(test_question.topic) || { correct: 0, total: 0, attempted: 0, totalTime: 0 };
        topicScore.total++;
        topicScore.totalTime += (userAnswer?.timeTaken || 0);
        if (isCorrect) topicScore.correct++;
        if (isAttempted) topicScore.attempted++;
        topicScores.set(test_question.topic, topicScore);
    }

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
    const result: TestResult = {
        id: resultId,
        testId: test.id,
        answers: userAnswers,
        score: parseFloat(calculatedScore.toFixed(2)),
        totalMarks: test.questions.length,
        percentage: Math.max(0, scorePercentage),
        timeTaken: timeTaken || 0,
        topicWiseScore,
        completedAt: new Date()
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

// Get all test results summary
router.get('/results', (req, res) => {
    const resultsSummary = Array.from(testResults.values()).map(result => {
        const test = mockTests.get(result.testId);
        return {
            id: result.id,
            testId: result.testId,
            testTitle: test?.title || 'Unknown Test',
            score: result.score,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            timeTaken: result.timeTaken,
            duration: test?.duration || 0,
            topicWiseScore: result.topicWiseScore,
            completedAt: result.completedAt,
        };
    });
    // Sort by newest first
    resultsSummary.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    res.json(resultsSummary);
});

// Get test result
router.get('/results/:resultId', (req, res) => {
    const result = testResults.get(req.params.resultId);
    if (!result) return res.status(404).json({ error: 'Result not found' });

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

// (GET /results is now above GET /:id to avoid route shadowing)

// Delete a test result
router.delete('/results/:resultId', (req, res) => {
    testResults.delete(req.params.resultId);
    persistDB();
    res.json({ success: true });
});

export { router as testsRouter };
