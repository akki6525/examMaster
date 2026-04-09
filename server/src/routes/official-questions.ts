import { Router } from 'express';
import { Question } from '../types/index.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scrapeQuestions, fetchFromExternalAPI } from '../services/scraper.js';
import { loadDB, saveDB } from '../services/persistence.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load questions from JSON database
function loadQuestionsFromDatabase(): Question[] {
    const dbPath = join(__dirname, '../../data/official-questions.json');

    if (!existsSync(dbPath)) {
        console.warn('Official questions database not found at:', dbPath);
        return [];
    }

    try {
        const data = JSON.parse(readFileSync(dbPath, 'utf-8'));
        const questions: Question[] = [];

        // Parse SSC CGL questions
        if (data.ssc_cgl) {
            Object.entries(data.ssc_cgl).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'SSC CGL',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UPSC questions
        if (data.upsc) {
            Object.entries(data.upsc).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UPSC',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKPSC questions
        if (data.ukpsc) {
            Object.entries(data.ukpsc).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKPSC',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKSSSC questions
        if (data.uksssc) {
            Object.entries(data.uksssc).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKSSSC',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKPSC-PCS questions
        if (data["ukpsc-pcs"]) {
            Object.entries(data["ukpsc-pcs"]).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKPSC-PCS',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKPSC-ROARO questions
        if (data["ukpsc-roaro"]) {
            Object.entries(data["ukpsc-roaro"]).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKPSC-ROARO',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKSSSC-VDO questions
        if (data["uksssc-vdo"]) {
            Object.entries(data["uksssc-vdo"]).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKSSSC-VDO',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKSSSC-Patwari questions
        if (data["uksssc-patwari"]) {
            Object.entries(data["uksssc-patwari"]).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKSSSC-Patwari',
                        sourceType: 'official'
                    });
                });
            });
        }

        // Parse UKSSSC-Forest questions
        if (data["uksssc-forest"]) {
            Object.entries(data["uksssc-forest"]).forEach(([year, yearQuestions]: [string, any]) => {
                yearQuestions.forEach((q: any) => {
                    questions.push({
                        type: 'mcq',
                        ...q,
                        examName: 'UKSSSC-Forest',
                        sourceType: 'official'
                    });
                });
            });
        }

        console.log(`Loaded ${questions.length} official questions from database`);
        return questions;
    } catch (error) {
        console.error('Error loading questions database:', error);
        return [];
    }
}

// Initialize questions database — merge JSON db + persisted imports
const _db = loadDB();
let _officialQuestions: Question[] = [
    ...loadQuestionsFromDatabase(),
    ...(_db.importedQuestions || [])
];

export function getOfficialQuestions() {
    return _officialQuestions;
}

function persistImported() {
    const imported = _officialQuestions.filter(q => q.source === 'pdf-import' || q.source === 'imported');
    const existing = loadDB();
    saveDB({ ...existing, importedQuestions: imported });
}

// Available exam types
const examTypes = [
    { id: 'SSC CGL', name: 'SSC CGL', years: [2026, 2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'SSC CGL').length },
    { id: 'UPSC', name: 'UPSC Civil Services', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UPSC').length },
    { id: 'UKPSC', name: 'UKPSC (Uttarakhand PCS)', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKPSC').length },
    { id: 'UKPSC-PCS', name: 'UKPSC PCS Prelims/Mains', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKPSC-PCS').length },
    { id: 'UKPSC-ROARO', name: 'UKPSC RO/ARO', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKPSC-ROARO').length },
    { id: 'UKSSSC', name: 'UKSSSC (Uttarakhand SSC)', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKSSSC').length },
    { id: 'UKSSSC-VDO', name: 'UKSSSC VDO/Gram Vikas', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKSSSC-VDO').length },
    { id: 'UKSSSC-Patwari', name: 'UKSSSC Patwari/Lekhpal', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKSSSC-Patwari').length },
    { id: 'UKSSSC-Forest', name: 'UKSSSC Forest Guard', years: [2025, 2024, 2023, 2022], questionCount: _officialQuestions.filter(q => q.examName === 'UKSSSC-Forest').length }
];

// Get available exam types
router.get('/exams', (req, res) => {
    res.json(examTypes.map(e => ({
        ...e,
        questionCount: _officialQuestions.filter(q => q.examName === e.id).length
    })));
});

// Get questions by exam type
router.get('/by-exam/:examType', (req, res) => {
    const { year, topic, difficulty, limit = 50 } = req.query;
    const examType = req.params.examType;

    let questions = _officialQuestions.filter(q =>
        q.examName?.toUpperCase() === examType.toUpperCase() ||
        q.examName?.replace(' ', '-').toUpperCase() === examType.toUpperCase()
    );

    if (year) {
        questions = questions.filter(q => q.year === parseInt(year as string));
    }

    if (topic) {
        questions = questions.filter(q =>
            q.topic.toLowerCase().includes((topic as string).toLowerCase())
        );
    }

    if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Apply limit
    const limitedQuestions = questions.slice(0, parseInt(limit as string));

    res.json({
        examType: req.params.examType,
        total: questions.length,
        returned: limitedQuestions.length,
        questions: limitedQuestions
    });
});

// Get all topics for an exam type
router.get('/topics/:examType', (req, res) => {
    const questions = _officialQuestions.filter(q =>
        q.examName?.toUpperCase() === req.params.examType.toUpperCase()
    );
    const topics = [...new Set(questions.map(q => q.topic))];

    res.json({
        examType: req.params.examType,
        topicCount: topics.length,
        topics
    });
});

// Get statistics for all exams
router.get('/stats', (req, res) => {
    const stats = examTypes.map(exam => {
        const questions = _officialQuestions.filter(q => q.examName === exam.id);
        const topics = [...new Set(questions.map(q => q.topic))];
        const yearCounts: Record<number, number> = {};

        questions.forEach(q => {
            if (q.year) {
                yearCounts[q.year] = (yearCounts[q.year] || 0) + 1;
            }
        });

        return {
            examType: exam.id,
            examName: exam.name,
            totalQuestions: questions.length,
            topicCount: topics.length,
            yearWise: yearCounts,
            difficultyBreakdown: {
                easy: questions.filter(q => q.difficulty === 'easy').length,
                medium: questions.filter(q => q.difficulty === 'medium').length,
                hard: questions.filter(q => q.difficulty === 'hard').length
            }
        };
    });

    res.json({
        totalQuestions: _officialQuestions.length,
        examStats: stats
    });
});

// Search official questions
router.get('/search', (req, res) => {
    const { query, examType, year, topic, difficulty } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Search query required' });
    }

    let questions = _officialQuestions.filter(q =>
        q.question.toLowerCase().includes((query as string).toLowerCase()) ||
        q.topic.toLowerCase().includes((query as string).toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes((query as string).toLowerCase()))
    );

    if (examType) {
        questions = questions.filter(q => q.examName?.toUpperCase() === (examType as string).toUpperCase());
    }

    if (year) {
        questions = questions.filter(q => q.year === parseInt(year as string));
    }

    if (topic) {
        questions = questions.filter(q => q.topic.toLowerCase().includes((topic as string).toLowerCase()));
    }

    if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
    }

    res.json({
        query,
        total: questions.length,
        questions: questions.slice(0, 50)
    });
});

// Get random questions from official database
router.get('/random', (req, res) => {
    const { count = 10, examType, difficulty, topics } = req.query;

    let questions = [..._officialQuestions];

    if (examType) {
        const examTypes = (examType as string).split(',');
        questions = questions.filter(q =>
            examTypes.some(et => q.examName?.toUpperCase() === et.toUpperCase())
        );
    }

    if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
    }

    if (topics) {
        const topicList = (topics as string).split(',');
        questions = questions.filter(q =>
            topicList.some(t => q.topic.toLowerCase().includes(t.toLowerCase()))
        );
    }

    // Shuffle and take count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, parseInt(count as string));

    res.json({
        requested: parseInt(count as string),
        total: selected.length,
        questions: selected
    });
});

// Scrape questions from external sources (on-demand)
router.post('/scrape', async (req, res) => {
    const { examType, year } = req.body;

    if (!examType) {
        return res.status(400).json({ error: 'Exam type required' });
    }

    try {
        const scrapedQuestions = await scrapeQuestions(examType, year);

        // Add scraped questions to the database (temporary, in-memory)
        if (scrapedQuestions.length > 0) {
            _officialQuestions = [..._officialQuestions, ...scrapedQuestions];
        }

        res.json({
            message: `Scraped ${scrapedQuestions.length} questions for ${examType}`,
            questions: scrapedQuestions
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape questions' });
    }
});

// Fetch from external API
router.post('/fetch-external', async (req, res) => {
    const { source = 'GENERAL' } = req.body;

    try {
        const questions = await fetchFromExternalAPI(source);

        if (questions.length > 0) {
            _officialQuestions = [..._officialQuestions, ...questions];
        }

        res.json({
            message: `Fetched ${questions.length} questions from external API`,
            questions
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from external API' });
    }
});

// Reload questions database
router.post('/reload', (req, res) => {
    _officialQuestions = loadQuestionsFromDatabase();
    res.json({
        message: 'Questions database reloaded',
        totalQuestions: _officialQuestions.length
    });
});

// Import questions from pasted text
router.post('/import', (req, res) => {
    const { text, examType = 'UKPSC', year = 2024, topic = 'General Studies' } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content required' });
    }

    const importedQuestions: Question[] = [];

    // Clean the text
    let cleanText = text
        .replace(/\\+\(/g, '(')
        .replace(/\\+\)/g, ')')
        .replace(/\s{2,}/g, '\n');

    // Try Q#: format (Q1:, Q2:, etc.)
    const qnSections = cleanText.split(/(?=Q\d+[:.]\s*)/i);

    for (const section of qnSections) {
        if (!/^Q\d+[:.]/i.test(section)) continue;

        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 3) continue;

        const questionText = lines[0].replace(/^Q\d+[:.]\s*/i, '').trim();
        if (questionText.length < 10) continue;

        const options: string[] = [];
        let correctAnswer = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (/^options:?$/i.test(line)) continue;

            const answerMatch = line.match(/^(?:correct\s*)?answer:?\s*\(?([a-d])\)?\s*(.*)$/i);
            if (answerMatch) {
                if (answerMatch[2]?.trim()) {
                    correctAnswer = answerMatch[2].trim();
                } else {
                    const idx = answerMatch[1].toLowerCase().charCodeAt(0) - 97;
                    if (options[idx]) correctAnswer = options[idx];
                }
                break;
            }

            if (options.length < 4) {
                const optMatch = line.match(/^\(?([a-d])\)?[.):\s]+(.+)$/i);
                if (optMatch) {
                    options.push(optMatch[2].trim());
                }
            }
        }

        if (options.length >= 2 && questionText.length > 10) {
            importedQuestions.push({
                id: `imported-${Date.now()}-${importedQuestions.length}`,
                question: questionText,
                options,
                correctAnswer: correctAnswer || options[0],
                explanation: '',
                type: 'mcq',
                difficulty: 'medium',
                topic,
                source: 'imported',
                sourceType: 'official',
                examName: examType,
                year: parseInt(year as string) || 2024
            });
        }
    }

    // Add to in-memory store
    if (importedQuestions.length > 0) {
        _officialQuestions = [..._officialQuestions, ...importedQuestions];
        persistImported();
    }

    res.json({
        message: `Successfully imported ${importedQuestions.length} questions`,
        imported: importedQuestions.length,
        questions: importedQuestions
    });
});

// Import pre-parsed questions from PDF (structured, no re-parsing needed)
router.post('/import-parsed', (req, res) => {
    const { questions: parsedQuestions, examType = 'UKPSC', year = 2025, topic = 'General Studies' } = req.body;

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        return res.status(400).json({ error: 'No questions provided' });
    }

    const importedQuestions: Question[] = [];

    for (const q of parsedQuestions) {
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) continue;

        importedQuestions.push({
            id: `pdf-import-${Date.now()}-${importedQuestions.length}`,
            question: String(q.question).trim(),
            options: q.options.map((o: any) => String(o).trim()),
            correctAnswer: String(q.correctAnswer || q.options[0]).trim(),
            explanation: String(q.explanation || '').trim(),
            type: 'mcq',
            difficulty: 'medium',
            topic: String(topic),
            ...(req.body.subtopic ? { subtopic: String(req.body.subtopic) } : {}),
            source: 'pdf-import',
            sourceType: 'official',
            examName: String(q.examType || examType),
            year: parseInt(String(q.year || year)) || 2025,
        });
    }

    if (importedQuestions.length > 0) {
        _officialQuestions = [..._officialQuestions, ...importedQuestions];
        persistImported();
    }

    console.log(`PDF Import: added ${importedQuestions.length} questions to ${examType} (${year}) - ${topic}`);

    res.json({
        message: `Successfully imported ${importedQuestions.length} questions from PDF`,
        imported: importedQuestions.length,
        questions: importedQuestions,
    });
});

export { router as officialQuestionsRouter };
