import express from 'express';
import cors from 'cors';
import { uploadRouter } from './routes/upload.js';
import { documentsRouter } from './routes/documents.js';
import { testsRouter } from './routes/tests.js';
import { flashcardsRouter } from './routes/flashcards.js';
import { officialQuestionsRouter } from './routes/official-questions.js';
import { practiceStatsRouter } from './routes/practice-stats.js';
import { insightsRouter } from './routes/ai-insights.js';
import { smartTestsRouter } from './routes/smart-tests.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/official-questions', officialQuestionsRouter);
app.use('/api/practice-stats', practiceStatsRouter);
app.use('/api/ai-insights', insightsRouter);
app.use('/api/smart-tests', smartTestsRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 ExamMaster Server running on http://localhost:${PORT}`);
});
