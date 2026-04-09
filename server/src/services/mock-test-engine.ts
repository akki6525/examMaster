import { Question, MockTest, TestSection } from '../types/index.js';
import { getOfficialQuestions } from '../routes/official-questions.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExamPattern {
    id: string;
    name: string;
    sections: {
        name: string;
        topics: string[];
        count: number;
    }[];
    duration: number; // in minutes
}

const EXAM_PATTERNS: Record<string, ExamPattern> = {
    'SSC_CGL_PRE': {
        id: 'SSC_CGL_PRE',
        name: 'SSC CGL Tier-I (Pre)',
        sections: [
            { name: 'General Intelligence and Reasoning', topics: ['Reasoning'], count: 25 },
            { name: 'General Awareness', topics: ['General Awareness', 'History & Polity', 'GS', 'General Science', 'Geography', 'Current Affairs', 'History'], count: 25 },
            { name: 'Quantitative Aptitude', topics: ['Quantitative Aptitude', 'Mathematical Abilities'], count: 25 },
            { name: 'English Comprehension', topics: ['English Comprehension', 'English Language and Comprehension'], count: 25 }
        ],
        duration: 60
    },
    'SSC_CGL_MAINS': {
        id: 'SSC_CGL_MAINS',
        name: 'SSC CGL Tier-II (Mains)',
        sections: [
            { name: 'Mathematical Abilities', topics: ['Quantitative Aptitude'], count: 30 },
            { name: 'Reasoning and General Intelligence', topics: ['Reasoning'], count: 30 },
            { name: 'English Language and Comprehension', topics: ['English Comprehension'], count: 45 },
            { name: 'General Awareness', topics: ['General Awareness', 'History & Polity'], count: 25 }
        ],
        duration: 120
    }
};

export function generateSmartMockTest(examId: string, year?: number): MockTest {
    const pattern = EXAM_PATTERNS[examId];
    if (!pattern) {
        throw new Error(`Exam pattern not found for ${examId}`);
    }

    const testId = uuidv4();
    const questions: Question[] = [];
    const testSections: TestSection[] = [];

    let totalMarks = 0;

    for (const sectionPattern of pattern.sections) {
        // Filter questions by exam and year
        let sectionPool = getOfficialQuestions().filter(q => 
            sectionPattern.topics.includes(q.topic) && 
            (q.examName === 'SSC CGL')
        );

        if (year) {
            sectionPool = sectionPool.filter(q => q.year === year);
        }

        // Shuffle and pick
        const shuffled = sectionPool.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, sectionPattern.count);

        if (selected.length < sectionPattern.count) {
            console.warn(`Not enough questions for section ${sectionPattern.name}. Found ${selected.length}/${sectionPattern.count}`);
        }

        const questionIds: string[] = [];
        selected.forEach(q => {
            questions.push(q);
            questionIds.push(q.id);
        });

        testSections.push({
            id: uuidv4(),
            name: sectionPattern.name,
            questionIds
        });

        totalMarks += selected.length * (examId.includes('MAINS') ? 3 : 2); // Standard SSC marking
    }

    const formattedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return {
        id: testId,
        title: `${pattern.name} - ${year ? year : 'Multi-year'} Mock Test`,
        description: `Full-length mock test based on ${pattern.name} pattern.`,
        questions,
        duration: pattern.duration,
        totalMarks,
        sections: testSections,
        createdAt: new Date()
    };
}

export function getAvailableExamPatterns() {
    return Object.values(EXAM_PATTERNS).map(p => ({
        id: p.id,
        name: p.name,
        questionCount: p.sections.reduce((acc, s) => acc + s.count, 0),
        duration: p.duration
    }));
}
