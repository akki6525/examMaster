import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { documents } from './upload.js';
import { Flashcard } from '../types/index.js';

const router = Router();

// In-memory storage
export const flashcards: Map<string, Flashcard> = new Map();

// Generate flashcards from document
router.post('/generate/:documentId', async (req, res) => {
    try {
        const doc = documents.get(req.params.documentId);

        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const generatedCards: Flashcard[] = [];
        const questionFormats = [
            (term: string) => `What is ${term}?`,
            (term: string) => `Define: ${term}`,
            (term: string) => `Explain the concept of ${term}`,
            (term: string) => `What does ${term} refer to?`,
        ];

        // Generate from definitions - best quality cards
        for (let i = 0; i < doc.definitions.length; i++) {
            const def = doc.definitions[i];
            // Skip short/incomplete definitions
            if (def.definition.length < 20) continue;

            // Rotate through question formats
            const formatFn = questionFormats[i % questionFormats.length];

            // Ensure back has complete, readable content
            let backContent = def.definition;
            // Add context if definition is short
            if (backContent.length < 50) {
                backContent = `${def.term}: ${backContent}`;
            }
            // Ensure proper capitalization and ending
            backContent = backContent.charAt(0).toUpperCase() + backContent.slice(1);
            if (!backContent.match(/[.!?]$/)) {
                backContent += '.';
            }

            const card: Flashcard = {
                id: uuidv4(),
                front: formatFn(def.term),
                back: backContent,
                topic: doc.topics[0]?.title || 'General',
                difficulty: backContent.length > 150 ? 'hard' : backContent.length > 75 ? 'medium' : 'easy',
                documentId: doc.id
            };
            flashcards.set(card.id, card);
            generatedCards.push(card);
        }

        // Generate from key terms with context
        const usedTerms = new Set(doc.definitions.map(d => d.term.toLowerCase()));

        for (const term of doc.keyTerms.slice(0, 15)) {
            // Skip if already covered by definitions
            if (usedTerms.has(term.toLowerCase())) continue;

            const relevantTopic = doc.topics.find(t =>
                t.content.toLowerCase().includes(term.toLowerCase())
            );

            if (relevantTopic) {
                // Find sentences containing the term
                const sentences = relevantTopic.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
                const relevantSentences = sentences.filter(s =>
                    s.toLowerCase().includes(term.toLowerCase())
                );

                if (relevantSentences.length > 0) {
                    // Combine up to 2 relevant sentences for context
                    let backContent = relevantSentences.slice(0, 2).join('. ').trim();
                    if (!backContent.endsWith('.')) backContent += '.';

                    // Only create card if we have meaningful content
                    if (backContent.length >= 30) {
                        const card: Flashcard = {
                            id: uuidv4(),
                            front: `Explain: ${term}`,
                            back: backContent,
                            topic: relevantTopic.title,
                            difficulty: 'medium',
                            documentId: doc.id
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
                // Create a summary card for the topic
                let summary = topic.content.substring(0, 200);
                const lastPeriod = summary.lastIndexOf('.');
                if (lastPeriod > 100) {
                    summary = summary.substring(0, lastPeriod + 1);
                } else {
                    summary = summary.trim() + '...';
                }

                const card: Flashcard = {
                    id: uuidv4(),
                    front: `Summarize: ${topic.title}`,
                    back: summary,
                    topic: topic.title,
                    difficulty: 'hard',
                    documentId: doc.id
                };
                flashcards.set(card.id, card);
                generatedCards.push(card);
            }
        }

        // Generate from formulas if any
        for (const formula of doc.formulas.slice(0, 5)) {
            if (formula.length >= 5 && formula.length <= 100) {
                const card: Flashcard = {
                    id: uuidv4(),
                    front: `What is this formula?\\n\\n${formula}`,
                    back: `Formula: ${formula}\\n\\nThis formula appears in the document "${doc.fileName}".`,
                    topic: 'Formulas',
                    difficulty: 'hard',
                    documentId: doc.id
                };
                flashcards.set(card.id, card);
                generatedCards.push(card);
            }
        }

        res.json({
            success: true,
            count: generatedCards.length,
            flashcards: generatedCards
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Get all flashcards
router.get('/', (req, res) => {
    const { documentId, topic } = req.query;

    let cards = Array.from(flashcards.values());

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
router.get('/:id', (req, res) => {
    const card = flashcards.get(req.params.id);

    if (!card) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(card);
});

// Update flashcard
router.patch('/:id', (req, res) => {
    const card = flashcards.get(req.params.id);

    if (!card) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    const { front, back, difficulty } = req.body;

    if (front) card.front = front;
    if (back) card.back = back;
    if (difficulty) card.difficulty = difficulty;

    flashcards.set(card.id, card);

    res.json(card);
});

// Delete flashcard
router.delete('/:id', (req, res) => {
    const deleted = flashcards.delete(req.params.id);

    if (!deleted) {
        return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({ success: true });
});

// Create custom flashcard
router.post('/', (req, res) => {
    const { front, back, topic, difficulty, documentId } = req.body;

    if (!front || !back) {
        return res.status(400).json({ error: 'Front and back content required' });
    }

    const card: Flashcard = {
        id: uuidv4(),
        front,
        back,
        topic: topic || 'Custom',
        difficulty: difficulty || 'medium',
        documentId: documentId || 'custom'
    };

    flashcards.set(card.id, card);

    res.json(card);
});

export { router as flashcardsRouter };
