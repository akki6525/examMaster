import nlp from 'compromise';
import { Topic, Definition, QuestionableContent, ExtractedQuestion } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

interface NLPResult {
    topics: Topic[];
    definitions: Definition[];
    keyTerms: string[];
    formulas: string[];
    questionableContent: QuestionableContent[];
    extractedQuestions: ExtractedQuestion[];
}

export async function processWithNLP(text: string): Promise<NLPResult> {
    const doc = nlp(text);

    // First, try to extract existing questions from the document
    const extractedQuestions = extractExistingQuestions(text);

    // Extract topics from headings and key sentences
    const topics = extractTopics(text, doc);

    // Extract definitions (skip if document contains many questions)
    const definitions = extractedQuestions.length > 5 ? [] : extractDefinitions(text, doc);

    // Extract key terms (nouns, proper nouns, technical terms)
    const keyTerms = extractKeyTerms(doc);

    // Extract formulas and equations
    const formulas = extractFormulas(text);

    // Identify question-worthy content
    const questionableContent = identifyQuestionableContent(text, doc);

    return {
        topics,
        definitions,
        keyTerms,
        formulas,
        questionableContent,
        extractedQuestions
    };
}

// Extract existing MCQ questions from document text
function extractExistingQuestions(text: string): ExtractedQuestion[] {
    const questions: ExtractedQuestion[] = [];

    // Clean up escaped characters from DOCX/markdown conversion
    let cleanText = text
        .replace(/\\+\(/g, '(')
        .replace(/\\+\)/g, ')')
        .replace(/\\+\./g, '.')
        .replace(/\\+-/g, '-');

    // PDF extraction often uses double spaces instead of newlines - convert them
    // Also handle cases where options and answers are on same line
    cleanText = cleanText
        .replace(/\s{2,}/g, '\n')  // Convert 2+ spaces to newline
        .replace(/(Options:)/gi, '\n$1\n')  // Put Options: on its own line
        .replace(/(Correct Answer:)/gi, '\n$1')  // Put Correct Answer: on its own line
        .replace(/(\([a-d]\))/gi, '\n$1');  // Put each option on its own line

    // Debug: Log first 1000 chars and check for patterns
    console.log('[NLP DEBUG] Text has ### headers:', cleanText.includes('###'));
    console.log('[NLP DEBUG] Text has Q#: pattern:', /Q\d+:/i.test(cleanText));
    console.log('[NLP DEBUG] First 500 chars after cleanup:', cleanText.substring(0, 500));

    // Try splitting by ### headers (markdown format from DOCX)
    if (cleanText.includes('###')) {
        const sections = cleanText.split(/(?=###\s+)/);

        for (const section of sections) {
            if (!section.startsWith('###')) continue;

            const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 3) continue;

            // Question is the first line after ###
            let questionText = lines[0].replace(/^###\s*/, '').trim();
            if (!questionText || questionText.length < 10) continue;

            const options: string[] = [];
            let correctAnswer = '';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (/^options:?$/i.test(line)) continue;

                // Match options: (a), (b), etc
                const optionMatch = line.match(/^\(?([a-d])\)?[\.)\s]+(.+)$/i);
                if (optionMatch) {
                    options.push(optionMatch[2].trim());
                }

                // Match: Correct Answer: (c) 1976 or Correct Answer: (c)
                const answerMatch = line.match(/^correct\s*answer:?\s*\(?([a-d])\)?\s*(.*)$/i);
                if (answerMatch) {
                    if (answerMatch[2] && answerMatch[2].trim().length > 0) {
                        correctAnswer = answerMatch[2].trim();
                    } else {
                        const idx = answerMatch[1].toLowerCase().charCodeAt(0) - 97;
                        if (options[idx]) correctAnswer = options[idx];
                    }
                }
            }

            if (options.length >= 2 && questionText.length > 10) {
                questions.push({ question: questionText, options, correctAnswer: correctAnswer || options[0], type: 'mcq' });
            }
        }
    }

    // Try Q#: format (PDF style: Q1:, Q2:, etc.)
    if (questions.length === 0 && /Q\d+:/i.test(cleanText)) {
        const sections = cleanText.split(/(?=Q\d+:)/i);

        for (const section of sections) {
            if (!/^Q\d+:/i.test(section)) continue;

            const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 3) continue;

            // Question text (first line, remove Q#: prefix)
            let questionText = lines[0].replace(/^Q\d+:\s*/i, '').trim();
            if (!questionText || questionText.length < 10) continue;

            const options: string[] = [];
            let correctAnswer = '';
            let foundAnswer = false;

            for (let i = 1; i < lines.length && !foundAnswer; i++) {
                const line = lines[i];
                if (/^options:?$/i.test(line)) continue;

                // Match: Correct Answer: (c) Speed - check this FIRST
                const answerMatch = line.match(/^correct\s*answer:?\s*\(?([a-d])\)?\s*(.*)$/i);
                if (answerMatch) {
                    if (answerMatch[2] && answerMatch[2].trim().length > 0) {
                        correctAnswer = answerMatch[2].trim();
                    } else {
                        const idx = answerMatch[1].toLowerCase().charCodeAt(0) - 97;
                        if (options[idx]) correctAnswer = options[idx];
                    }
                    foundAnswer = true;
                    break;  // Stop processing after finding answer
                }

                // Match options: (a), (b), (c), (d) - only if we haven't found 4 yet
                if (options.length < 4) {
                    const optionMatch = line.match(/^\(?([a-d])\)?[\.)\s]+(.+)$/i);
                    if (optionMatch) {
                        const optionText = optionMatch[2].trim();
                        // Don't add empty or very short options
                        if (optionText.length >= 1 && !optionText.match(/^Correct Answer/i)) {
                            options.push(optionText);
                        }
                    }
                }
            }

            if (options.length >= 2 && questionText.length > 10) {
                questions.push({ question: questionText, options: options.slice(0, 4), correctAnswer: correctAnswer || options[0], type: 'mcq' });
            }
        }
    }

    // If no markdown or Q#: questions found, try generic patterns
    if (questions.length === 0) {
        const patternQuestions = extractWithPatterns(cleanText);
        questions.push(...patternQuestions);
    }

    console.log(`[NLP] Extracted ${questions.length} questions from document`);
    return questions;
}

// Parse a question block to extract question, options, and answer
function parseQuestionBlock(block: string): ExtractedQuestion | null {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) return null;

    // Find question line (first substantial line)
    let questionText = '';
    let questionEndIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip line numbers or prefixes
        const cleanLine = line.replace(/^(?:\d+\.|Q\d+[.:]?|Question\s*\d+[.:]?)\s*/i, '').trim();

        // Check if this line contains options
        if (/^\s*\(?[a-d]\)?[.)\s]/i.test(line) || /^options:/i.test(line)) {
            questionEndIndex = i;
            break;
        }

        if (cleanLine.length > 10) {
            questionText += (questionText ? ' ' : '') + cleanLine;
        }
    }

    if (!questionText || questionText.length < 15) return null;

    // Extract options
    const options: string[] = [];
    let correctAnswer = '';

    for (let i = questionEndIndex; i < lines.length; i++) {
        const line = lines[i];

        // Match option pattern: (a), a), (a., a.
        const optionMatch = line.match(/^\s*\(?([a-d])\)?[.)\s]+(.+)$/i);
        if (optionMatch) {
            options.push(optionMatch[2].trim());
        }

        // Match correct answer patterns
        const answerMatch = line.match(/(?:correct answer|answer)[:\s]*\(?([a-d])\)?/i);
        if (answerMatch) {
            const answerLetter = answerMatch[1].toLowerCase();
            const answerIndex = answerLetter.charCodeAt(0) - 'a'.charCodeAt(0);
            if (options[answerIndex]) {
                correctAnswer = options[answerIndex];
            }
        }

        // Also check for inline answer like "(c) 1976" where 1976 is the answer
        if (!correctAnswer && /correct/i.test(line)) {
            const inlineMatch = line.match(/\(?([a-d])\)?\s*[:\s]*(.+?)(?:\s*$|[,.])/i);
            if (inlineMatch && inlineMatch[2]) {
                correctAnswer = inlineMatch[2].trim();
            }
        }
    }

    // Need at least 2 options to be a valid MCQ
    if (options.length < 2) return null;

    // If no explicit answer found, skip this question
    if (!correctAnswer && options.length >= 4) {
        // Try to find answer from the options that matches a pattern
        return null;
    }

    return {
        question: questionText,
        options,
        correctAnswer: correctAnswer || options[0], // Default to first if not found
        type: 'mcq'
    };
}

// Extract questions using various regex patterns
function extractWithPatterns(text: string): ExtractedQuestion[] {
    const questions: ExtractedQuestion[] = [];

    // Pattern: Question followed by options on separate lines
    const questionPattern = /([A-Z][^?]+\?)\s*(?:Options:?\s*)?\n\s*\(?a\)?[.)\s]+([^\n]+)\n\s*\(?b\)?[.)\s]+([^\n]+)\n\s*\(?c\)?[.)\s]+([^\n]+)\n\s*\(?d\)?[.)\s]+([^\n]+)(?:\n.*?(?:correct answer|answer)[:\s]*\(?([a-d])\)?)?/gi;

    let match;
    while ((match = questionPattern.exec(text)) !== null) {
        const options = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
        let correctAnswer = '';

        if (match[6]) {
            const answerIndex = match[6].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
            correctAnswer = options[answerIndex] || '';
        }

        questions.push({
            question: match[1].trim(),
            options,
            correctAnswer,
            type: 'mcq'
        });
    }

    return questions;
}

function extractTopics(text: string, doc: any): Topic[] {
    const topics: Topic[] = [];

    // Split by common heading patterns
    const sections = text.split(/\n(?=[A-Z][A-Za-z\s]{2,50}:|\d+\.\s+[A-Z]|#{1,3}\s+)/);

    for (const section of sections) {
        if (section.trim().length < 50) continue;

        const lines = section.split('\n');
        const title = lines[0]?.trim().replace(/[:##]+/g, '').trim() || 'General';
        const content = lines.slice(1).join('\n').trim();

        if (content.length > 20) {
            // Extract subtopics
            const subtopics = content
                .split('\n')
                .filter(line => /^[-•*]\s+|^\d+\)\s+|^[a-z]\)\s+/i.test(line.trim()))
                .map(line => line.replace(/^[-•*\d)a-z]+\s*/i, '').trim())
                .filter(s => s.length > 5)
                .slice(0, 10);

            // Determine importance based on length and keyword density
            const importance = determineImportance(content);

            topics.push({
                id: uuidv4(),
                title: title.slice(0, 100),
                content: content.slice(0, 5000),
                subtopics,
                importance
            });
        }
    }

    // If no topics found, create one general topic
    if (topics.length === 0) {
        topics.push({
            id: uuidv4(),
            title: 'Main Content',
            content: text.slice(0, 5000),
            subtopics: [],
            importance: 'medium'
        });
    }

    return topics.slice(0, 20);
}

function extractDefinitions(text: string, doc: any): Definition[] {
    const definitions: Definition[] = [];
    let match;

    // Pattern 1: "Term is/are/refers to/means..." (flexible verb matching)
    const pattern1 = /([A-Z][a-zA-Z\s]{2,50}?)\s+(?:is|are|refers to|means|can be defined as|denotes|represents|signifies)\s+([^.!?]+[.!?])/gi;
    while ((match = pattern1.exec(text)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (definition.length >= 20 && term.length >= 3) {
            definitions.push({ term, definition, source: 'pattern' });
        }
    }

    // Pattern 2: "Term: definition" or "Term - definition"
    const pattern2 = /^([A-Z][a-zA-Z\s]{2,40})(?::|–|-)\s+([A-Z][^.!?\n]+[.!?]?)/gm;
    while ((match = pattern2.exec(text)) !== null) {
        const term = match[1].trim();
        let definition = match[2].trim();
        // Ensure definition ends properly
        if (!definition.endsWith('.') && !definition.endsWith('!') && !definition.endsWith('?')) {
            definition += '.';
        }
        if (definition.length >= 15 && term.length >= 3) {
            definitions.push({ term, definition, source: 'pattern' });
        }
    }

    // Pattern 3: Parenthetical definitions "Term (definition)"
    const pattern3 = /([A-Z][a-zA-Z\s]{2,30})\s*\(([^)]{15,150})\)/g;
    while ((match = pattern3.exec(text)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (definition.length >= 15) {
            definitions.push({ term, definition, source: 'parenthetical' });
        }
    }

    // Pattern 4: "known as" / "called" patterns
    const pattern4 = /([A-Z][a-zA-Z\s]{2,40})\s+(?:is (?:also )?(?:known|called|termed|named))\s+([^.!?]+[.!?])/gi;
    while ((match = pattern4.exec(text)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (definition.length >= 10) {
            definitions.push({ term, definition, source: 'pattern' });
        }
    }

    // Pattern 5: Use NLP sentences for definitions
    const sentences = doc.sentences().out('array');
    for (const sentence of sentences) {
        if (sentence.length < 30 || sentence.length > 300) continue;

        // Look for definition indicators
        if (/\b(definition|meaning|refers to|known as|described as|defined as)\b/i.test(sentence)) {
            // Extract the subject (first capitalized phrase)
            const termMatch = sentence.match(/^([A-Z][a-zA-Z\s]{2,30}?)(?:\s+is|\s+are|\s+means)/);
            if (termMatch) {
                definitions.push({
                    term: termMatch[1].trim(),
                    definition: sentence,
                    source: 'nlp'
                });
            }
        }
    }

    // Pattern 6: Q&A format "What is X? X is..."
    const qaPattern = /(?:What is|Define)\s+([^?]+)\?\s*([A-Z][^.!?]+[.!?])/gi;
    while ((match = qaPattern.exec(text)) !== null) {
        const term = match[1].trim();
        const definition = match[2].trim();
        if (definition.length >= 20) {
            definitions.push({ term, definition, source: 'qa' });
        }
    }

    // Clean up definitions - ensure they are complete sentences
    const cleanedDefs = definitions.map(def => ({
        ...def,
        term: def.term.replace(/\s+/g, ' ').trim(),
        definition: cleanDefinition(def.definition)
    })).filter(def =>
        def.term.length >= 3 &&
        def.definition.length >= 20 &&
        !def.term.match(/^(The|A|An|This|That|These|Those)\s/i) &&
        def.definition.split(' ').length >= 4 &&
        // Exclude exam question-like text (not actual definitions)
        !isExamQuestionText(def.term) &&
        !isExamQuestionText(def.definition)
    );

    // Remove duplicates (case-insensitive term matching)
    const unique = cleanedDefs.filter((def, index, self) =>
        index === self.findIndex(d => d.term.toLowerCase() === def.term.toLowerCase())
    );

    return unique.slice(0, 50);
}

// Check if text looks like an exam question (not a definition)
function isExamQuestionText(text: string): boolean {
    const examQuestionPatterns = [
        /which of the following/i,
        /who among the following/i,
        /not correct/i,
        /is incorrect/i,
        /is correct/i,
        /select the (correct|wrong|right)/i,
        /choose the (correct|wrong|right)/i,
        /\bQ\d+\b/,
        /\bquestion\s*\d+/i,
        /^\s*\([a-d]\)/i,
        /^\s*[a-d]\)/i,
        /true or false/i,
        /fill in the blank/i,
        /\?$/,  // Ends with question mark
        /which (one|statement)/i,
        /consider the following statements/i,
        /assertion.*reason/i,
        /match the following/i,
        /arrange in (correct |chronological )?order/i
    ];

    return examQuestionPatterns.some(pattern => pattern.test(text));
}

// Helper to clean up definition text
function cleanDefinition(text: string): string {
    let cleaned = text.replace(/\s+/g, ' ').trim();
    // Ensure proper ending
    if (!cleaned.match(/[.!?]$/)) {
        cleaned += '.';
    }
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

function extractKeyTerms(doc: any): string[] {
    const terms: Set<string> = new Set();

    // Extract nouns and proper nouns
    const nouns = doc.nouns().out('array');
    nouns.forEach((noun: string) => {
        if (noun.length > 3 && noun.length < 50) {
            terms.add(noun);
        }
    });

    // Extract topics/subjects
    const topics = doc.topics().out('array');
    topics.forEach((topic: string) => terms.add(topic));

    // Extract acronyms
    const acronyms = doc.acronyms().out('array');
    acronyms.forEach((acr: string) => terms.add(acr));

    return Array.from(terms).slice(0, 100);
}

function extractFormulas(text: string): string[] {
    const formulas: string[] = [];

    // Mathematical formulas with operators
    const mathPattern = /[A-Za-z]\s*=\s*[A-Za-z0-9\s+\-*/^()√∫∑]+/g;
    let match;

    while ((match = mathPattern.exec(text)) !== null) {
        if (match[0].length > 5 && match[0].length < 200) {
            formulas.push(match[0].trim());
        }
    }

    // Chemical formulas
    const chemPattern = /[A-Z][a-z]?\d*(?:\s*[+→]\s*[A-Z][a-z]?\d*)+/g;

    while ((match = chemPattern.exec(text)) !== null) {
        formulas.push(match[0].trim());
    }

    return [...new Set(formulas)].slice(0, 30);
}

function identifyQuestionableContent(text: string, doc: any): QuestionableContent[] {
    const content: QuestionableContent[] = [];

    // Definitions are great for questions
    const defPattern = /([A-Z][a-zA-Z\s]{2,50})\s+(?:is|are|refers to|means)\s+([^.]+\.)/gi;
    let match;

    while ((match = defPattern.exec(text)) !== null) {
        content.push({
            content: match[0],
            type: 'definition',
            suggestedQuestionType: ['mcq', 'fill-blank', 'short-answer']
        });
    }

    // Lists are good for matching questions
    const listPattern = /(?:^|\n)(?:\d+[.)]\s+|\*\s+|-\s+)(.+)(?:\n(?:\d+[.)]\s+|\*\s+|-\s+).+){2,}/gm;

    while ((match = listPattern.exec(text)) !== null) {
        content.push({
            content: match[0],
            type: 'list',
            suggestedQuestionType: ['mcq', 'match']
        });
    }

    // Facts with dates/numbers
    const factPattern = /[A-Z][^.]*\b\d{4}\b[^.]*\./g;

    while ((match = factPattern.exec(text)) !== null) {
        content.push({
            content: match[0],
            type: 'fact',
            suggestedQuestionType: ['mcq', 'true-false', 'fill-blank']
        });
    }

    // Examples
    const examplePattern = /(?:for example|e\.g\.|such as|like)[^.]+\./gi;

    while ((match = examplePattern.exec(text)) !== null) {
        content.push({
            content: match[0],
            type: 'example',
            suggestedQuestionType: ['mcq', 'short-answer']
        });
    }

    return content.slice(0, 100);
}

function determineImportance(content: string): 'high' | 'medium' | 'low' {
    const importantKeywords = [
        'important', 'key', 'crucial', 'essential', 'fundamental',
        'must', 'should', 'remember', 'note', 'definition',
        'formula', 'theorem', 'law', 'principle', 'rule'
    ];

    const keywordCount = importantKeywords.filter(kw =>
        content.toLowerCase().includes(kw)
    ).length;

    if (keywordCount >= 3 || content.length > 1000) return 'high';
    if (keywordCount >= 1 || content.length > 500) return 'medium';
    return 'low';
}
