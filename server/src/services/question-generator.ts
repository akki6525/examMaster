import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionType, ExtractedContent } from '../types/index.js';

export async function generateQuestions(
    documents: ExtractedContent[],
    count: number = 30
): Promise<Question[]> {
    const questions: Question[] = [];

    for (const doc of documents) {
        // PRIORITY 1: Use pre-extracted questions from the document (already formatted Q&A)
        if (doc.extractedQuestions && doc.extractedQuestions.length > 0) {
            for (const eq of doc.extractedQuestions) {
                questions.push({
                    id: uuidv4(),
                    type: eq.type,
                    question: eq.question,
                    options: eq.options,
                    correctAnswer: eq.correctAnswer,
                    explanation: `Correct answer: ${eq.correctAnswer}`,
                    difficulty: 'medium',
                    topic: doc.topics[0]?.title || 'General',
                    source: doc.fileName,
                    sourceType: 'uploaded'
                });
            }
        }

        // PRIORITY 2: Generate from definitions (only if no extracted questions found)
        if (!doc.extractedQuestions || doc.extractedQuestions.length < 5) {
            for (const def of doc.definitions) {
                const mcqQuestion = generateMCQFromDefinition(def, doc);
                if (mcqQuestion) questions.push(mcqQuestion);

                const fillBlank = generateFillBlankFromDefinition(def, doc);
                if (fillBlank) questions.push(fillBlank);
            }

            // Generate from questionable content
            for (const qc of doc.questionableContent) {
                const question = generateFromQuestionableContent(qc, doc);
                if (question) questions.push(question);
            }

            // Generate from topics
            for (const topic of doc.topics) {
                const topicQuestions = generateFromTopic(topic, doc);
                questions.push(...topicQuestions);
            }

            // Generate true/false questions
            const tfQuestions = generateTrueFalseQuestions(doc);
            questions.push(...tfQuestions);
        }
    }

    // Shuffle and return requested count
    return shuffleArray(questions).slice(0, count);
}

function generateMCQFromDefinition(
    def: { term: string; definition: string; source: string },
    doc: ExtractedContent
): Question | null {
    if (!def.term || !def.definition || def.definition.length < 20) return null;

    // Get other definitions for wrong options
    const otherDefs = doc.definitions.filter(d => d.term !== def.term && d.definition.length >= 20);

    // Create question asking "What is X?" with definition as correct answer
    if (otherDefs.length >= 3) {
        const wrongDefinitions = otherDefs
            .slice(0, 3)
            .map(d => truncateText(d.definition, 100));

        const correctDef = truncateText(def.definition, 100);
        const options = shuffleArray([correctDef, ...wrongDefinitions]);

        return {
            id: uuidv4(),
            type: 'mcq',
            question: `What is ${def.term}?`,
            options,
            correctAnswer: correctDef,
            explanation: `${def.term}: ${def.definition}`,
            difficulty: determineDifficulty(def.definition),
            topic: doc.topics[0]?.title || 'General',
            source: doc.fileName,
            sourceType: 'uploaded'
        };
    }

    // Fallback: Generate with term options if not enough other definitions
    const otherTerms = doc.definitions
        .filter(d => d.term !== def.term)
        .map(d => d.term)
        .slice(0, 3);

    // Fill with key terms if needed
    while (otherTerms.length < 3) {
        const randomTerm = doc.keyTerms[Math.floor(Math.random() * doc.keyTerms.length)];
        if (randomTerm && !otherTerms.includes(randomTerm) && randomTerm !== def.term) {
            otherTerms.push(randomTerm);
        } else if (otherTerms.length < 3) {
            // Generate placeholder only as last resort
            otherTerms.push(`Option ${String.fromCharCode(65 + otherTerms.length)}`);
        }
    }

    const options = shuffleArray([def.term, ...otherTerms.slice(0, 3)]);

    return {
        id: uuidv4(),
        type: 'mcq',
        question: `Which of the following best matches this definition: "${truncateText(def.definition, 120)}"`,
        options,
        correctAnswer: def.term,
        explanation: `${def.term} is defined as: ${def.definition}`,
        difficulty: determineDifficulty(def.definition),
        topic: doc.topics[0]?.title || 'General',
        source: doc.fileName,
        sourceType: 'uploaded'
    };
}

// Helper to truncate text cleanly at word boundary
function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function generateFillBlankFromDefinition(
    def: { term: string; definition: string; source: string },
    doc: ExtractedContent
): Question | null {
    if (!def.term || def.term.length < 3 || def.definition.length < 20) return null;

    // Try to create a contextual fill-in-blank
    const termRegex = new RegExp(`\\b${escapeRegex(def.term)}\\b`, 'gi');
    const blankDef = def.definition.replace(termRegex, '_______');

    // If term appears in definition, use that
    if (blankDef !== def.definition) {
        return {
            id: uuidv4(),
            type: 'fill-blank',
            question: `Complete the following statement:\n\n"${blankDef}"`,
            correctAnswer: def.term,
            explanation: `The correct answer is "${def.term}". Full statement: ${def.definition}`,
            difficulty: 'medium',
            topic: doc.topics[0]?.title || 'General',
            source: doc.fileName,
            sourceType: 'uploaded'
        };
    }

    // Otherwise, create a definition-based question
    return {
        id: uuidv4(),
        type: 'fill-blank',
        question: `_______ is defined as: ${truncateText(def.definition, 150)}`,
        correctAnswer: def.term,
        explanation: `The answer is "${def.term}".`,
        difficulty: 'easy',
        topic: doc.topics[0]?.title || 'General',
        source: doc.fileName,
        sourceType: 'uploaded'
    };
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateFromQuestionableContent(
    qc: { content: string; type: string; suggestedQuestionType: QuestionType[] },
    doc: ExtractedContent
): Question | null {
    const questionType = qc.suggestedQuestionType[0] || 'mcq';

    if (qc.type === 'fact') {
        // Extract numbers/dates for fill-in-blank
        const match = qc.content.match(/\b(\d{4}|\d+)\b/);
        if (match) {
            return {
                id: uuidv4(),
                type: 'fill-blank',
                question: qc.content.replace(match[0], '_______'),
                correctAnswer: match[0],
                explanation: qc.content,
                difficulty: 'medium',
                topic: doc.topics[0]?.title || 'General',
                source: doc.fileName,
                sourceType: 'uploaded'
            };
        }
    }

    if (qc.type === 'definition') {
        return {
            id: uuidv4(),
            type: 'short-answer',
            question: `Explain the following: ${qc.content.split(' ').slice(0, 5).join(' ')}...`,
            correctAnswer: qc.content,
            explanation: qc.content,
            difficulty: 'medium',
            topic: doc.topics[0]?.title || 'General',
            source: doc.fileName,
            sourceType: 'uploaded'
        };
    }

    return null;
}

function generateFromTopic(
    topic: { id: string; title: string; content: string; subtopics: string[]; importance: string },
    doc: ExtractedContent
): Question[] {
    const questions: Question[] = [];

    // Generate MCQ about the topic
    if (topic.subtopics.length >= 2) {
        const wrongOptions = doc.topics
            .filter(t => t.id !== topic.id)
            .flatMap(t => t.subtopics)
            .slice(0, 3);

        if (wrongOptions.length >= 3) {
            const correctOption = topic.subtopics[0];
            const options = shuffleArray([correctOption, ...wrongOptions.slice(0, 3)]);

            questions.push({
                id: uuidv4(),
                type: 'mcq',
                question: `Which of the following is related to "${topic.title}"?`,
                options,
                correctAnswer: correctOption,
                explanation: `"${correctOption}" is a subtopic of "${topic.title}".`,
                difficulty: 'easy',
                topic: topic.title,
                source: doc.fileName,
                sourceType: 'uploaded'
            });
        }
    }

    // Generate short answer from topic
    if (topic.content.length > 100) {
        questions.push({
            id: uuidv4(),
            type: 'short-answer',
            question: `Briefly explain: ${topic.title}`,
            correctAnswer: topic.content.substring(0, 300),
            explanation: topic.content.substring(0, 500),
            difficulty: topic.importance === 'high' ? 'hard' : 'medium',
            topic: topic.title,
            source: doc.fileName,
            sourceType: 'uploaded'
        });
    }

    return questions;
}

function generateTrueFalseQuestions(doc: ExtractedContent): Question[] {
    const questions: Question[] = [];
    const defs = doc.definitions.filter(d => d.definition.length >= 20);

    // Generate true statements with proper grammar
    for (const def of defs.slice(0, 5)) {
        // Create a grammatically correct statement
        const statement = formatTrueFalseStatement(def.term, def.definition);

        questions.push({
            id: uuidv4(),
            type: 'true-false',
            question: `True or False: ${statement}`,
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: `This is TRUE. ${def.term}: ${def.definition}`,
            difficulty: 'easy',
            topic: doc.topics[0]?.title || 'General',
            source: doc.fileName,
            sourceType: 'uploaded'
        });
    }

    // Generate false statements by mixing up definitions
    for (let i = 0; i < Math.min(3, defs.length - 1); i++) {
        const nextIndex = (i + 1) % defs.length;
        if (defs[nextIndex] && defs[i].term !== defs[nextIndex].term) {
            const falseStatement = formatTrueFalseStatement(defs[i].term, defs[nextIndex].definition);

            questions.push({
                id: uuidv4(),
                type: 'true-false',
                question: `True or False: ${falseStatement}`,
                options: ['True', 'False'],
                correctAnswer: 'False',
                explanation: `This is FALSE. ${defs[i].term} is actually: ${defs[i].definition}`,
                difficulty: 'medium',
                topic: doc.topics[0]?.title || 'General',
                source: doc.fileName,
                sourceType: 'uploaded'
            });
        }
    }

    return questions;
}

// Helper to format true/false statements grammatically
function formatTrueFalseStatement(term: string, definition: string): string {
    // Check if definition already starts with a verb
    const startsWithVerb = /^(is|are|was|were|refers|means|denotes|represents|can be)/i.test(definition);

    if (startsWithVerb) {
        return `${term} ${definition}`;
    }

    // Check if definition is a noun phrase (describing what it is)
    const isNounPhrase = /^(a |an |the |one |any )/i.test(definition);

    if (isNounPhrase) {
        return `${term} is ${definition}`;
    }

    // Default: add "refers to"
    return `${term} refers to ${definition.charAt(0).toLowerCase()}${definition.slice(1)}`;
}

function determineDifficulty(text: string): 'easy' | 'medium' | 'hard' {
    const words = text.split(' ').length;
    const complexWords = text.match(/[a-z]{10,}/gi)?.length || 0;

    if (words > 50 || complexWords > 5) return 'hard';
    if (words > 25 || complexWords > 2) return 'medium';
    return 'easy';
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
