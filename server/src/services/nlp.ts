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

    // Normalize spacing and insert helpful newlines. PDFs often place items
    // on the same line (e.g. "Ans 1. 1320 2. 1310 3. 1330 4. 1300 Q.2 ...").
    cleanText = cleanText
        // Convert sequences of 3+ spaces to a newline (PDF extracting sometimes
        // uses multiple spaces as separators)
        .replace(/\s{3,}/g, '\n')
        // Ensure question headers start on their own line
        .replace(/\b(Q\.\d+|Q\d+)\b/gi, '\n$1')
        // Ensure Answer/Ans/Chosen Option and Question ID markers are on their own lines
        .replace(/(Options:)/gi, '\n$1\n')
        .replace(/(Correct Answer:)/gi, '\n$1\n')
        .replace(/(Chosen Option\s*:)/gi, '\n$1\n')
        .replace(/(Question ID\s*:)/gi, '\n$1\n')
        .replace(/(Option \d ID\s*:)/gi, '\n$1\n')
        // Put parenthetical options like (a) on their own lines
        .replace(/(\([a-dA-D0-9]+\))/g, '\n$1')
    // Ensure a space after option digit-dot sequences like "1." when missing (avoid touching decimals like 5.6)
    .replace(/([1-4])\.(?=\S)/g, '$1. ')
        // Put isolated numbered options (e.g. "1.") onto new lines when preceded by a non-newline
        .replace(/([^\n])([1-4]\.\s)/g, '$1\n$2')
        // Handle common "Ans 1." inline marker - put markers on their own lines
        .replace(/(Ans[:\s]*[1-4]\.?)/gi, '\n$1\n')
        // Break long inline multi-option sequences into separate lines: "1. A 2. B 3. C 4. D"
        // broaden lookahead to include various question boundaries like "Q.", "Question ID", "Question" or end of text
    .replace(/1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\.\s*(.+?)(?=(?:\s+Q\.|\s+Q\d+\b|\s+Question\b|\s+Question\s+ID|$))/gi, '1. $1\n2. $2\n3. $3\n4. $4')
    // Also handle cases where numbering uses parentheses: "(1) A (2) B (3) C (4) D"
    .replace(/\(1\)\s*(.+?)\s*\(2\)\s*(.+?)\s*\(3\)\s*(.+?)\s*\(4\)\s*(.+?)(?=(?:\s+Q\.|\s+Q\d+\b|\s+Question\b|\s+Question\s+ID|$))/gi, '1. $1\n2. $2\n3. $3\n4. $4')
    // Looser splitting: force newline before 2., 3., 4. when they appear inline (helps many PDF extraction cases)
    .replace(/\s+2\.\s+/g, '\n2. ')
    .replace(/\s+3\.\s+/g, '\n3. ')
    .replace(/\s+4\.\s+/g, '\n4. ')
    // If options still remain inline after an "Ans" marker (e.g. "Ans 1. 1320 2. 1310 ..."), try a looser split
    .replace(/Ans\s*(?:[:\-])?\s*(?:1\.|\(1\))\s*/gi, '\nAns ');

    // Debug: Log first 1000 chars and check for patterns
    console.log('[NLP DEBUG] Text length:', cleanText.length);
    console.log('[NLP DEBUG] Text has ### headers:', cleanText.includes('###'));
    console.log('[NLP DEBUG] Text has Q#: pattern:', /Q\.?\d+[\s.:]/i.test(cleanText));
    console.log('[NLP DEBUG] First 500 chars after cleanup:', cleanText.substring(0, 500));

    // Try splitting by ### headers (markdown format from DOCX)
    if (cleanText.includes('###')) {
        const sections = cleanText.split(/(?=###\s+)/);

        for (const section of sections) {
            if (!section.startsWith('###')) continue;

            let lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            // Remove blocks that only contain option IDs or other metadata we don't want
            lines = lines.filter(l => !/^Option\s+\d+\s+ID\s*:/i.test(l) && !/^Question\s*ID\s*:/i.test(l));
            if (lines.length < 3) continue;

            // Question is the first line after ###
            let questionText = lines[0].replace(/^###\s*/, '').trim();
            if (!questionText || questionText.length < 10) continue;

            const options: string[] = [];
            let correctAnswer = '';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (/^options:?$/i.test(line)) continue;

                // Handle lines like "Ans 1320" where answer text follows Ans without a letter marker
                const ansOnlyMatchHeader = line.match(/^Ans[:\s]+(.+)$/i);
                if (ansOnlyMatchHeader) {
                    options.push(ansOnlyMatchHeader[1].trim());
                    continue;
                }

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

    // Try Q#: or Q.N or QN format (PDF style: Q1:, Q.1, Q1 etc.)
    if (questions.length === 0 && /Q\.?\d+[\s.:]/i.test(cleanText)) {
        const sections = cleanText.split(/(?=Q\.?\d+[\s.:])/i);

        for (const section of sections) {
            if (!/Q\.?\d+[\s.:]/i.test(section)) continue;

            const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Try to detect inline multi-option patterns that are on the same line as the question
            // e.g. "... ? Ans 1. 56 hours 2. 55 hours 3. 48 hours 4. 47 hours ..."
            // Looser match: match 1. ... 2. ... 3. ... 4. ... anywhere in section
            const inlineMulti = section.match(/(?:Ans\s*)?1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\.\s*(.+?)/i);
            let questionText = '';
            let options: string[] = [];
            let correctAnswer = '';
            let optionIndex = -1;
            let foundMetadata = false;

            if (inlineMulti) {
                // question is everything before the match
                const qBefore = section.substring(0, inlineMulti.index || 0).replace(/^Q\.?\d+[\s.:]*/i, '').trim();
                questionText = qBefore;
                options = [inlineMulti[1].trim(), inlineMulti[2].trim(), inlineMulti[3].trim(), inlineMulti[4].trim()].map(o=>o.replace(/Question\s*ID.*$/i,'').trim());
                // try to find chosen option or Answer within the section
                const chosenMatch = section.match(/(?:Chosen Option|Correct Option|Correct Answer)\s*[:\s]*(\d+)/i);
                if (chosenMatch) {
                    const idx = parseInt(chosenMatch[1]) - 1;
                    correctAnswer = options[idx] || '';
                } else {
                    const officialAnswerMatch = section.match(/\bAnswer\s*[:\s]*(\d+|[a-d])\b/i);
                    if (officialAnswerMatch) {
                        const val = officialAnswerMatch[1];
                        if (val.match(/^[1-4]$/)) correctAnswer = options[parseInt(val) - 1] || '';
                        else if (val.match(/^[a-d]$/i)) correctAnswer = options[val.toLowerCase().charCodeAt(0) - 97] || '';
                    }
                }
            } else {
                // If no inline multi-option and there are not enough lines, skip
                if (lines.length < 2) continue;

                // Fallback to line-wise scanning
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    // Common option starts: 1. , (1) , a) , (a) , Ans 1.
                    if (line.match(/^(?:Ans\s+)?(?:1\.\s+|\(1\)\s+|[a-d]\)\s+|\([a-d]\)\s+)/i)) {
                        optionIndex = i;
                        break;
                    }
                    
                    // If the line contains multiple options like "1. A 2. B 3. C 4. D"
                    if (line.match(/1\.\s+.+?2\.\s+.+?3\.\s+.+?4\.\s+.+/i)) {
                        optionIndex = i;
                        break;
                    }

                    // Add to question text if it's not the Q header itself or just "Ans"
                    let cleanLine = line.replace(/^Q\.?\d+[\s.:]*/i, '').trim();
                    // Skip if it is just "Ans" or weird formatting artifacts
                    if (cleanLine.toLowerCase() === 'ans' || cleanLine === '.' || cleanLine === ':') continue;
                    
                    if (cleanLine.length > 0) {
                        questionText += (questionText ? ' ' : '') + cleanLine;
                    }
                }
            }

            // Extract options
            if (optionIndex !== -1) {
                for (let i = optionIndex; i < lines.length; i++) {
                    const line = lines[i];
                    
                    if (line.match(/Question ID|Option \d ID|Status|Chosen Option/i)) {
                        foundMetadata = true;
                    }

                    // Check for multiple options on one line
                    const multiOptionMatch = line.match(/(?:Ans\s+)?1\.\s+(.+?)\s+2\.\s+(.+?)\s+3\.\s+(.+?)\s+4\.\s+(.+)$/i);
                    if (multiOptionMatch) {
                        options = [multiOptionMatch[1], multiOptionMatch[2], multiOptionMatch[3], multiOptionMatch[4]];
                        continue;
                    }
                    // Handle Ans-only like "Ans 1320" (option 1 text without explicit 1.)
                    const ansOnlyMatch = line.match(/^Ans[:\s]+(.+)$/i);
                    if (ansOnlyMatch) {
                        options.push(ansOnlyMatch[1].trim());
                        continue;
                    }

                    // Match individual option patterns
                    const optionMatch = line.match(/^(?:Ans\s+)?(?:\(?([1-4]|[a-d])\)?[\.\)]\s+)(.+)$/i);
                    if (optionMatch) {
                        const optText = optionMatch[2].trim();
                        if (optText.length > 0) {
                            options.push(optText);
                        }
                    } else if (options.length > 0 && options.length < 4 && !foundMetadata) {
                        // Continuation of previous option
                        options[options.length - 1] += ' ' + line;
                    }

                    // Look for correct answer indicators (Chosen Option is common in answer keys)
                    const chosenMatch = line.match(/(?:Chosen Option|Correct Option|Correct Answer)\s*[:\s]*(\d+)/i);
                    if (chosenMatch) {
                        const idx = parseInt(chosenMatch[1]) - 1;
                        if (options[idx]) {
                            correctAnswer = options[idx];
                        } else if (chosenMatch[1].match(/^[1-4]$/)) {
                            // If options index not yet found, store index
                            correctAnswer = `OPTION_INDEX_${chosenMatch[1]}`;
                        }
                    }
                    
                    // Also check for official Answer: X format
                    const officialAnswerMatch = line.match(/^Answer\s*[:\s]*(\d+|[a-d])/i);
                    if (officialAnswerMatch && !correctAnswer) {
                        const val = officialAnswerMatch[1];
                        if (val.match(/^[1-4]$/)) {
                            correctAnswer = `OPTION_INDEX_${val}`;
                        } else if (val.match(/^[a-d]$/i)) {
                            const idx = val.toLowerCase().charCodeAt(0) - 97;
                            correctAnswer = `OPTION_INDEX_${idx + 1}`;
                        }
                    }
                }
            }

            // Post-process correctAnswer if it was an index
            if (correctAnswer && correctAnswer.startsWith('OPTION_INDEX_')) {
                const idx = parseInt(correctAnswer.replace('OPTION_INDEX_', '')) - 1;
                correctAnswer = options[idx] || '';
            }

            if (options.length >= 2 && questionText.length > 5) {
                questions.push({ 
                    question: questionText, 
                    options: options.slice(0, 4), 
                    correctAnswer: correctAnswer || options[0], 
                    type: 'mcq' 
                });
            }
            // Fallback: if we couldn't parse options but the section contains an 'Ans' inline
            // and/or 'Question ID', try to extract options heuristically from the substring
            if ((options.length < 2) && /\bAns\b/i.test(section)) {
                try {
                    const qBody = section.replace(/^Q\.?\d+[\s.:]*/i, '');
                    const qidMatch = qBody.match(/Question\s*ID\s*[:\s]/i);
                    const qidPos = qidMatch ? qBody.indexOf(qidMatch[0]) : -1;
                    const beforeQid = qidPos >= 0 ? qBody.substring(0, qidPos) : qBody;

                    const ansPos = beforeQid.search(/\bAns\b/i);
                    let optsPart = '';
                    if (ansPos >= 0) {
                        optsPart = beforeQid.substring(ansPos + 3); // after 'Ans'
                    } else {
                        // try to find the first '1.' occurrence
                        const oneMatch = beforeQid.match(/1\.\s*/);
                        optsPart = oneMatch ? beforeQid.substring(oneMatch.index!) : '';
                    }

                    if (optsPart && optsPart.trim().length > 0) {
                        // Split by occurrences of '2.' '3.' '4.' that often appear inline
                        const parts = optsPart.split(/\s+(?=[1-4]\.\s+)/g).map(p => p.replace(/^[1-4]\.\s*/,'').trim()).filter(Boolean);
                        if (parts.length >= 2) {
                            options = parts.slice(0,4);
                            // attempt to set question text if missing
                            if (!questionText || questionText.length < 10) {
                                const qTextCandidate = beforeQid.substring(0, Math.max(0, ansPos)).trim();
                                questionText = (qTextCandidate || questionText || '').replace(/[:\s]+$/,'').trim();
                            }
                            // find chosen option index
                            const chosenMatch = section.match(/Chosen Option\s*[:\s]*(\d+)/i) || section.match(/Answer\s*[:\s]*(\d+)/i);
                            if (chosenMatch) {
                                const idx = parseInt(chosenMatch[1]) - 1;
                                correctAnswer = options[idx] || correctAnswer;
                            }
                        }
                    }
                } catch (e) {
                    // ignore fallback errors
                }

                if (options.length >= 2 && questionText.length > 5) {
                    questions.push({ question: questionText, options: options.slice(0,4), correctAnswer: correctAnswer || options[0], type: 'mcq' });
                }
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
        // Handle Ans-only like "Ans 1320"
        const ansOnly = line.match(/^Ans[:\s]+(.+)$/i);
        if (ansOnly) {
            options.push(ansOnly[1].trim());
            continue;
        }

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
