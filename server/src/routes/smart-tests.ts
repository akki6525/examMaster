import { Router } from 'express';
import { generateSmartMockTest, getAvailableExamPatterns } from '../services/mock-test-engine.js';
import { mockTests, testResults } from './tests.js';
import { loadDB, saveDB } from '../services/persistence.js';

const router = Router();

function persistDB() {
    const currentDB = loadDB();
    saveDB({
        ...currentDB,
        mockTests: Object.fromEntries(mockTests),
        testResults: Object.fromEntries(testResults)
    });
}

// Get available smart exam patterns
router.get('/patterns', (req, res) => {
    res.json(getAvailableExamPatterns());
});

// Generate a smart mock test
router.post('/generate', (req, res) => {
    try {
        const { examId, year } = req.body;
        
        if (!examId) {
            return res.status(400).json({ error: 'Exam ID is required' });
        }

        const test = generateSmartMockTest(examId, year ? parseInt(year) : undefined);
        
        mockTests.set(test.id, test);
        persistDB();

        res.json({
            success: true,
            testId: test.id,
            title: test.title,
            duration: test.duration,
            questionCount: test.questions.length,
            totalMarks: test.totalMarks,
            sections: test.sections
        });
    } catch (error) {
        console.error('Smart test generation error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

export { router as smartTestsRouter };
