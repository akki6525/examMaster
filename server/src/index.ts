import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// Load variables from .env file manually at startup
(() => {
    try {
        const rootEnv = path.resolve(process.cwd(), '.env');
        const serverEnv = path.resolve(process.cwd(), 'server', '.env');
        
        let envPath = rootEnv;
        if (!fs.existsSync(rootEnv) && fs.existsSync(serverEnv)) {
            envPath = serverEnv;
        }
        
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const idx = trimmed.indexOf('=');
                    if (idx > -1) {
                        const key = trimmed.substring(0, idx).trim();
                        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                        process.env[key] = val;
                    }
                }
            });
            console.log(`[ENV] Environment variables loaded from: ${envPath}`);
        } else {
            console.log('[ENV] No .env file found in workspace root or server directory.');
        }
    } catch (e) {
        console.error('[ENV] Failed to load .env file:', e);
    }
})();

import { uploadRouter } from './routes/upload.js';
import { documentsRouter } from './routes/documents.js';
import { testsRouter } from './routes/tests.js';
import { flashcardsRouter } from './routes/flashcards.js';
import { officialQuestionsRouter } from './routes/official-questions.js';
import { practiceStatsRouter } from './routes/practice-stats.js';
import { insightsRouter } from './routes/ai-insights.js';
import { smartTestsRouter } from './routes/smart-tests.js';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Routes
app.use('/api/auth', authRouter);
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
    const isProd = process.env.NODE_ENV === 'production';
    console.error('Error:', err.stack || err.message);
    res.status(500).json({ 
        error: isProd ? 'An unexpected internal server error occurred.' : err.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 ExamMaster Server running on http://localhost:${PORT}`);
});
