import axios from 'axios';
import * as cheerio from 'cheerio';
import { Question } from '../types/index.js';

// Web scraper for official exam questions
// Note: This scrapes from publicly available educational resources

interface ScrapedQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    topic?: string;
    year?: number;
}

// Scrape questions from public educational sites
export async function scrapeQuestions(examType: string, year?: number): Promise<Question[]> {
    const questions: Question[] = [];

    try {
        switch (examType.toUpperCase()) {
            case 'SSC CGL':
            case 'SSC-CGL':
                return await scrapeSSCQuestions(year);
            case 'UPSC':
                return await scrapeUPSCQuestions(year);
            default:
                console.log(`Scraping not yet implemented for ${examType}`);
                return [];
        }
    } catch (error) {
        console.error(`Error scraping questions for ${examType}:`, error);
        return [];
    }
}

// Scrape SSC CGL questions from public sources
async function scrapeSSCQuestions(year?: number): Promise<Question[]> {
    const questions: Question[] = [];

    try {
        // Example: Scraping from a mock educational endpoint
        // In production, you would scrape from real sources like:
        // - ssc.nic.in (official)
        // - testbook.com
        // - gradeup.co
        // - oliveboard.in

        // For now, we'll generate realistic questions based on actual SSC patterns
        const sscTopics = [
            { topic: 'General Awareness - Polity', difficulty: 'medium' },
            { topic: 'Quantitative Aptitude - Arithmetic', difficulty: 'easy' },
            { topic: 'Reasoning - Coding Decoding', difficulty: 'medium' },
            { topic: 'English - Vocabulary', difficulty: 'easy' }
        ];

        console.log(`Fetching SSC CGL questions for year: ${year || 'all'}`);

        // Return empty - actual implementation would scrape real sites
        return questions;

    } catch (error) {
        console.error('Error scraping SSC questions:', error);
        return [];
    }
}

// Scrape UPSC questions from public sources
async function scrapeUPSCQuestions(year?: number): Promise<Question[]> {
    const questions: Question[] = [];

    try {
        // Example scraping logic (would need actual implementation for real sites)
        // Sources: upsc.gov.in, visionias.in, insightsonindia.com

        console.log(`Fetching UPSC questions for year: ${year || 'all'}`);

        return questions;

    } catch (error) {
        console.error('Error scraping UPSC questions:', error);
        return [];
    }
}

// Parse HTML to extract questions
export function parseQuestionsFromHTML(html: string, examType: string): ScrapedQuestion[] {
    const $ = cheerio.load(html);
    const questions: ScrapedQuestion[] = [];

    // Generic parser - would need to be customized for each source
    $('.question-container, .question-item, .q-item').each((index, element) => {
        try {
            const questionText = $(element).find('.question-text, .q-text, p').first().text().trim();
            const options: string[] = [];

            $(element).find('.option, .choice, li').each((i, opt) => {
                const optText = $(opt).text().trim();
                if (optText && optText.length > 0) {
                    options.push(optText);
                }
            });

            const correctAnswer = $(element).find('.correct-answer, .answer').text().trim();
            const explanation = $(element).find('.explanation, .solution').text().trim();

            if (questionText && options.length >= 2) {
                questions.push({
                    question: questionText,
                    options: options.slice(0, 4),
                    correctAnswer: correctAnswer || options[0],
                    explanation: explanation || undefined
                });
            }
        } catch (err) {
            console.error('Error parsing question element:', err);
        }
    });

    return questions;
}

// Fetch questions from external API (if available)
export async function fetchFromExternalAPI(examType: string, apiKey?: string): Promise<Question[]> {
    // This would integrate with third-party question bank APIs
    // Examples: Testbook API, Quiz API, OpenTDB (trivia), etc.

    try {
        // Example with OpenTDB (free trivia API) for demonstration
        if (examType === 'GENERAL') {
            const response = await axios.get('https://opentdb.com/api.php', {
                params: {
                    amount: 20,
                    category: 9, // General Knowledge
                    type: 'multiple'
                }
            });

            return response.data.results.map((q: any, index: number) => ({
                id: `external-${Date.now()}-${index}`,
                type: 'mcq',
                question: decodeHTMLEntities(q.question),
                options: shuffleArray([
                    decodeHTMLEntities(q.correct_answer),
                    ...q.incorrect_answers.map(decodeHTMLEntities)
                ]),
                correctAnswer: decodeHTMLEntities(q.correct_answer),
                explanation: '',
                difficulty: q.difficulty,
                topic: q.category,
                source: 'External API',
                sourceType: 'external' as const,
                examName: 'General',
                year: new Date().getFullYear()
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching from external API:', error);
        return [];
    }
}

// Helper: Decode HTML entities
function decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&lsquo;': "'",
        '&rsquo;': "'"
    };

    return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// Helper: Shuffle array
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default {
    scrapeQuestions,
    parseQuestionsFromHTML,
    fetchFromExternalAPI
};
