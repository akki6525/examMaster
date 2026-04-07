export interface ExtractedContent {
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;  // Path to the uploaded file for viewer
    rawText: string;
    topics: Topic[];
    definitions: Definition[];
    keyTerms: string[];
    formulas: string[];
    questionableContent: QuestionableContent[];
    extractedQuestions: ExtractedQuestion[];  // Pre-formatted questions found in document
    createdAt: Date;
}

// Question extracted directly from document (already formatted)
export interface ExtractedQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    type: 'mcq' | 'true-false';
}

export interface Topic {
    id: string;
    title: string;
    content: string;
    subtopics: string[];
    importance: 'high' | 'medium' | 'low';
}

export interface Definition {
    term: string;
    definition: string;
    source: string;
}

export interface QuestionableContent {
    content: string;
    type: 'definition' | 'fact' | 'list' | 'formula' | 'example';
    suggestedQuestionType: QuestionType[];
}

export type QuestionType = 'mcq' | 'true-false' | 'short-answer' | 'fill-blank' | 'match';

export interface Question {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    subtopic?: string;
    source: string;
    sourceType: 'uploaded' | 'official';
    examName?: string;
    year?: number;
}

export interface MockTest {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    duration: number; // in minutes
    totalMarks: number;
    sections?: TestSection[];
    createdAt: Date;
}

export interface TestSection {
    id: string;
    name: string;
    questionIds: string[];
    duration?: number;
}

export interface TestResult {
    id: string;
    testId: string;
    answers: UserAnswer[];
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    topicWiseScore: TopicScore[];
    completedAt: Date;
}

export interface UserAnswer {
    questionId: string;
    userAnswer: string | string[];
    isCorrect: boolean;
    timeTaken: number;
    flagged: boolean;
}

export interface TopicScore {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    documentId: string;
}

export interface OfficialExam {
    id: string;
    name: string;
    year: number;
    category: string;
    questions: Question[];
    source: string;
}
