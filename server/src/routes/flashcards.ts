import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { documents } from './upload.js';
import { Flashcard } from '../types/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { loadDB, saveDB } from '../services/persistence.js';

const router = Router();

// Load from persistent DB on startup
const _db = loadDB();
export const flashcards: Map<string, Flashcard & { userId?: string }> = new Map(Object.entries(_db.flashcards || {}));

export function persistFlashcards() {
    const currentDB = loadDB();
    saveDB({
        ...currentDB,
        flashcards: Object.fromEntries(flashcards)
    });
}

// All flashcard routes require authentication
router.use(authMiddleware);

// Generate flashcards from document
router.post('/generate/:documentId', async (req: any, res) => {
    try {
        const doc = documents.get(req.params.documentId);

        // Security check: ensure document belongs to the requesting user
        if (!doc || doc.userId !== req.userId) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const generatedCards: (Flashcard & { userId?: string })[] = [];
        const questionFormats = [
            (term: string) => `What is ${term}?`,
            (term: string) => `Define: ${term}`,
            (term: string) => `Explain the concept of ${term}`,
            (term: string) => `What does ${term} refer to?`,
        ];

        // Generate from definitions - best quality cards
        for (let i = 0; i < doc.definitions.length; i++) {
            const def = doc.definitions[i];
            if (def.definition.length < 20) continue;

            const formatFn = questionFormats[i % questionFormats.length];

            let backContent = def.definition;
            if (backContent.length < 50) {
                backContent = `${def.term}: ${backContent}`;
            }
            backContent = backContent.charAt(0).toUpperCase() + backContent.slice(1);
            if (!backContent.match(/[.!?]$/)) {
                backContent += '.';
            }

            const card: Flashcard & { userId?: string } = {
                id: uuidv4(),
                front: formatFn(def.term),
                back: backContent,
                topic: doc.topics[0]?.title || 'General',
                difficulty: backContent.length > 150 ? 'hard' : backContent.length > 75 ? 'medium' : 'easy',
                documentId: doc.id,
                userId: req.userId
            };
            flashcards.set(card.id, card);
            generatedCards.push(card);
        }

        // Generate from key terms with context
        const usedTerms = new Set(doc.definitions.map(d => d.term.toLowerCase()));

        for (const term of doc.keyTerms.slice(0, 15)) {
            if (usedTerms.has(term.toLowerCase())) continue;

            const relevantTopic = doc.topics.find(t =>
                t.content.toLowerCase().includes(term.toLowerCase())
            );

            if (relevantTopic) {
                const sentences = relevantTopic.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
                const relevantSentences = sentences.filter(s =>
                    s.toLowerCase().includes(term.toLowerCase())
                );

                if (relevantSentences.length > 0) {
                    let backContent = relevantSentences.slice(0, 2).join('. ').trim();
                    if (!backContent.endsWith('.')) backContent += '.';

                    if (backContent.length >= 30) {
                        const card: Flashcard & { userId?: string } = {
                            id: uuidv4(),
                            front: `Explain: ${term}`,
                            back: backContent,
                            topic: relevantTopic.title,
                            difficulty: 'medium',
                            documentId: doc.id,
                            userId: req.userId
                        };
                        flashcards.set(card.id, card);
                        generatedCards.push(card);
                        usedTerms.add(term.toLowerCase());
                    }
                }
            }
        }

        // Generate topic summary cards
        for (const topic of doc.topics.slice(0, 5)) {
            if (topic.content.length >= 100 && topic.subtopics.length > 0) {
                let summary = topic.content.substring(0, 200);
                const lastPeriod = summary.lastIndexOf('.');
                if (lastPeriod > 100) {
                    summary = summary.substring(0, lastPeriod + 1);
                } else {
                    summary = summary.trim() + '...';
                }

                const card: Flashcard & { userId?: string } = {
                    id: uuidv4(),
                    front: `Summarize: ${topic.title}`,
                    back: summary,
                    topic: topic.title,
                    difficulty: 'hard',
                    documentId: doc.id,
                    userId: req.userId
                };
                flashcards.set(card.id, card);
                generatedCards.push(card);
            }
        }

        // Generate from formulas if any
        for (const formula of doc.formulas.slice(0, 5)) {
            if (formula.length >= 5 && formula.length <= 100) {
                const card: Flashcard & { userId?: string } = {
                    id: uuidv4(),
                    front: `What is this formula?\\n\\n${formula}`,
                    back: `Formula: ${formula}\\n\\nThis formula appears in the document "${doc.fileName}".`,
                    topic: 'Formulas',
                    difficulty: 'hard',
                    documentId: doc.id,
                    userId: req.userId
                };
                flashcards.set(card.id, card);
                generatedCards.push(card);
            }
        }

        persistFlashcards();

        res.json({
            success: true,
            count: generatedCards.length,
            flashcards: generatedCards
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get all flashcards for authenticated user
router.get('/', (req: any, res) => {
    const { documentId, topic } = req.query;

    let cards = Array.from(flashcards.values()).filter(c => c.userId === req.userId);

    if (documentId) {
        cards = cards.filter(c => c.documentId === documentId);
    }

    if (topic) {
        cards = cards.filter(c =>
            c.topic.toLowerCase().includes((topic as string).toLowerCase())
        );
    }

    res.json(cards);
});

// Get flashcard by ID
router.get('/:id', (req: any, res) => {
    const card = flashcards.get(req.params.id);

    if (!card || card.userId !== req.userId) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(card);
});

// Update flashcard
router.patch('/:id', (req: any, res) => {
    const card = flashcards.get(req.params.id);

    if (!card || card.userId !== req.userId) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    const { front, back, difficulty } = req.body;

    if (front) card.front = front;
    if (back) card.back = back;
    if (difficulty) card.difficulty = difficulty;

    flashcards.set(card.id, card);
    persistFlashcards();

    res.json(card);
});

// Delete flashcard
router.delete('/:id', (req: any, res) => {
    const card = flashcards.get(req.params.id);
    if (!card || card.userId !== req.userId) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    const deleted = flashcards.delete(req.params.id);

    if (!deleted) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    persistFlashcards();
    res.json({ success: true });
});

// Create custom flashcard
router.post('/', (req: any, res) => {
    const { front, back, topic, difficulty, documentId } = req.body;

    if (!front || !back) {
        return res.status(400).json({ error: 'Front and back content required' });
    }

    const card: Flashcard & { userId?: string } = {
        id: uuidv4(),
        front,
        back,
        topic: topic || 'Custom',
        difficulty: difficulty || 'medium',
        documentId: documentId || 'custom',
        userId: req.userId
    };

    flashcards.set(card.id, card);
    persistFlashcards();

    res.json(card);
});

export { router as flashcardsRouter };
