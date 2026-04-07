import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileQuestion,
    Search,
    Filter,
    ChevronDown,
    CheckCircle,
    XCircle,
    BookOpen,
    Tag,
    GraduationCap,
    RotateCcw,
    Eye,
    X,
    Brain
} from 'lucide-react';
import axios from 'axios';
import { cn, getDifficultyColor } from '../lib/utils';
import { Question } from '../stores/testStore';

const API_URL = 'http://localhost:3001/api';

interface ExamType {
    id: string;
    name: string;
    questionCount: number;
}

// Persistence key for UI state only (not used for stats)
const STORAGE_KEY = 'exammaster_questionbank_progress';

interface SavedProgress {
    userAnswers: Record<string, string>;
    showAnswer: Record<string, boolean>;
    attemptedQuestions: string[];
}

export default function QuestionBank() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examTypes, setExamTypes] = useState<ExamType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExam, setSelectedExam] = useState<string>('all');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
    const [attemptedQuestions, setAttemptedQuestions] = useState<Set<string>>(new Set());
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Load saved progress on mount (from localStorage for UI state)
    // AND from server for answered questions
    useEffect(() => {
        // Restore UI state from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data: SavedProgress = JSON.parse(saved);
                setUserAnswers(data.userAnswers || {});
                setShowAnswer(data.showAnswer || {});
            } catch (e) {
                console.error('Failed to load progress:', e);
            }
        }
    }, []);

    // Save UI progress to localStorage only (stats go to server via checkAnswer)
    useEffect(() => {
        const data = { userAnswers, showAnswer };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [userAnswers, showAnswer]);

    useEffect(() => {
        async function fetchData() {
            try {
                const examsRes = await axios.get(`${API_URL}/official-questions/exams`);
                setExamTypes(examsRes.data || []);

                const questionsRes = await axios.get(`${API_URL}/official-questions/random?count=100`);
                setQuestions(questionsRes.data.questions || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchFilteredQuestions() {
            if (selectedExam === 'all') return;
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/official-questions/by-exam/${selectedExam}?limit=1000`);
                setQuestions(response.data.questions || []);
            } catch (error) {
                console.error('Failed to fetch filtered questions:', error);
            } finally {
                setLoading(false);
            }
        }
        if (selectedExam !== 'all') {
            fetchFilteredQuestions();
        }
    }, [selectedExam]);

    const years = [...new Set(questions.map(q => q.year).filter((y): y is number => typeof y === 'number'))].sort((a, b) => b - a);

    // Pre-filter questions by everything EXCEPT topic — used for accurate per-topic counts
    const questionsForTopicCount = questions.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.subtopic?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
        const matchesExam = selectedExam === 'all' || q.examName === selectedExam;
        const matchesYear = selectedYear === 'all' || q.year?.toString() === selectedYear;
        return matchesSearch && matchesDifficulty && matchesExam && matchesYear;
    });

    const topicCounts = questionsForTopicCount.reduce((acc, q) => {
        const topicKey = q.subtopic ? `${q.topic} - ${q.subtopic}` : q.topic;
        acc[topicKey] = (acc[topicKey] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topics = [...new Set(questionsForTopicCount.map(q => q.subtopic ? `${q.topic} - ${q.subtopic}` : q.topic))].sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0));

    const filteredQuestions = questionsForTopicCount.filter(q => {
        if (selectedTopic === 'all') return true;
        const topicKey = q.subtopic ? `${q.topic} - ${q.subtopic}` : q.topic;
        return topicKey === selectedTopic;
    });

    const handleSelectOption = (questionId: string, option: string) => {
        if (showAnswer[questionId]) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const checkAnswer = (questionId: string) => {
        const q = questions.find(q => q.id === questionId);
        if (!q) return;
        setShowAnswer(prev => ({ ...prev, [questionId]: true }));

        // Persist this answer to the server DB
        const topic = (q as any).subtopic ? `${q.topic} - ${(q as any).subtopic}` : q.topic;
        const isCorrect = userAnswers[questionId] === q.correctAnswer;
        axios.post(`${API_URL}/practice-stats/answer`, {
            questionId,
            topic,
            userAnswer: userAnswers[questionId],
            correctAnswer: q.correctAnswer,
            isCorrect
        }).catch(err => console.error('Failed to save answer to server:', err));
    };

    const resetQuestion = (questionId: string) => {
        setUserAnswers(prev => { const { [questionId]: _, ...rest } = prev; return rest; });
        setShowAnswer(prev => { const { [questionId]: _, ...rest } = prev; return rest; });
    };

    const resetAllProgress = () => {
        setUserAnswers({});
        setShowAnswer({});
        localStorage.removeItem(STORAGE_KEY);
    };

    // Get correct and incorrect questions
    const correctQuestions = questions.filter(q => showAnswer[q.id] && userAnswers[q.id] === q.correctAnswer);
    const incorrectQuestions = questions.filter(q => showAnswer[q.id] && userAnswers[q.id] && userAnswers[q.id] !== q.correctAnswer);
    const correctCount = correctQuestions.length;
    const incorrectCount = incorrectQuestions.length;
    const attemptedCount = Object.keys(showAnswer).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <FileQuestion className="w-8 h-8 text-primary" />
                    Question Bank
                </h1>
                <p className="text-muted-foreground">
                    Practice official exam questions - your progress is saved automatically
                </p>
            </div>

            {/* Stats Bar - Simplified */}
            {attemptedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 shadow-sm sticky top-20 z-40 transition-all duration-300"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">{correctCount} Correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="font-medium">{incorrectCount} Incorrect</span>
                    </div>
                    <div className="text-muted-foreground">
                        {attemptedCount} Attempted
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Accuracy: {attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0}%
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {(correctCount > 0 || incorrectCount > 0) && (
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Review Answers
                            </button>
                        )}
                        <button
                            onClick={resetAllProgress}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset All
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowReviewModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                    Review Your Answers
                                </h2>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-8">
                                {/* Correct Questions Section */}
                                {correctQuestions.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-green-600 flex items-center gap-2 mb-4">
                                            <CheckCircle className="w-6 h-6" />
                                            Correct Answers ({correctQuestions.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {correctQuestions.map((q, idx) => (
                                                <div key={q.id} className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                                    <div className="flex items-start gap-3">
                                                        <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
                                                                    {q.examName} {q.year}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{q.topic}</span>
                                                            </div>
                                                            <p className="font-medium mb-2">{q.question}</p>
                                                            <p className="text-sm text-green-600">
                                                                <strong>Your Answer:</strong> {userAnswers[q.id]} ✓
                                                            </p>
                                                            {q.explanation && (
                                                                <p className="text-sm text-muted-foreground mt-2">
                                                                    <strong>Explanation:</strong> {q.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Incorrect Questions Section */}
                                {incorrectQuestions.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
                                            <XCircle className="w-6 h-6" />
                                            Incorrect Answers ({incorrectQuestions.length}) - Review These!
                                        </h3>
                                        <div className="space-y-4">
                                            {incorrectQuestions.map((q, idx) => (
                                                <div key={q.id} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                                    <div className="flex items-start gap-3">
                                                        <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-xs font-medium">
                                                                    {q.examName} {q.year}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{q.topic}</span>
                                                            </div>
                                                            <p className="font-medium mb-2">{q.question}</p>
                                                            <p className="text-sm text-red-600">
                                                                <strong>Your Answer:</strong> {userAnswers[q.id]} ✗
                                                            </p>
                                                            <p className="text-sm text-green-600">
                                                                <strong>Correct Answer:</strong> {q.correctAnswer}
                                                            </p>
                                                            {q.explanation && (
                                                                <p className="text-sm text-muted-foreground mt-2">
                                                                    <strong>Explanation:</strong> {q.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {correctQuestions.length === 0 && incorrectQuestions.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No answered questions to review yet.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/50 backdrop-blur-sm">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card/60 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                    <div className="relative">
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:outline-none cursor-pointer font-medium"
                        >
                            <option value="all">All Exams</option>
                            {examTypes.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name} ({exam.questionCount})</option>
                            ))}
                        </select>
                        <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Topics</option>
                            {topics.map(topic => (
                                <option key={topic} value={topic}>{topic} ({topicCounts[topic] || 0})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Years</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2 text-sm text-muted-foreground mt-4">
                    <Filter className="w-4 h-4" />
                    {filteredQuestions.length} questions found
                </div>

                {/* AI Topic Mastery Prediction */}
                {selectedTopic !== 'all' && attemptedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground flex items-center gap-2">
                                    Topic Mastery Analysis
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500 text-white uppercase tracking-tighter">AI Predictor</span>
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Based on your current {correctCount}/{attemptedCount} trend in this bank
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Success Probability</p>
                            <p className="text-3xl font-black text-blue-500">
                                {Math.round((correctCount / Math.max(1, attemptedCount)) * 100)}%
                            </p>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Questions List */}
            <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No questions found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredQuestions.map((question, index) => {
                        const userAnswer = userAnswers[question.id];
                        const isAnswered = showAnswer[question.id];
                        const isCorrect = isAnswered && userAnswer === question.correctAnswer;
                        const isIncorrect = isAnswered && userAnswer && userAnswer !== question.correctAnswer;

                        return (
                            <motion.div
                                key={question.id}
                                id={`question-${question.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                whileHover={!isAnswered ? { scale: 1.01, y: -2 } : { scale: 1.005 }}
                                className={cn(
                                    "p-6 rounded-3xl border-2 transition-all duration-300 shadow-sm",
                                    isCorrect && "border-green-500 bg-green-500/5 hover:shadow-md hover:shadow-green-500/5",
                                    isIncorrect && "border-red-500 bg-red-500/5 hover:shadow-md hover:shadow-red-500/5",
                                    !isAnswered && "bg-card border-border/50 hover:border-primary/40 hover:shadow-lg"
                                )}
                            >
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className="font-semibold text-primary">Q{index + 1}</span>
                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getDifficultyColor(question.difficulty))}>
                                        {question.difficulty}
                                    </span>
                                        <span className="mb-1 sm:mb-0 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {question.topic}
                                            {question.subtopic && ` • ${question.subtopic}`}
                                        </span>
                                    {question.examName && (
                                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                                            {question.examName} {question.year}
                                        </span>
                                    )}
                                    {isCorrect && (
                                        <span className="ml-auto px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />Correct!
                                        </span>
                                    )}
                                    {isIncorrect && (
                                        <span className="ml-auto px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium flex items-center gap-1">
                                            <XCircle className="w-3 h-3" />Incorrect
                                        </span>
                                    )}
                                </div>

                                <p className="text-lg mb-4 whitespace-pre-wrap">{question.question}</p>

                                {question.type === 'mcq' && question.options && (
                                    <div className="space-y-2 mb-4">
                                        {question.options.map((option, optIndex) => {
                                            const isSelected = userAnswer === option;
                                            const isCorrectOption = option === question.correctAnswer;
                                            const showCorrect = isAnswered && isCorrectOption;
                                            const showWrong = isAnswered && isSelected && !isCorrectOption;

                                            return (
                                                <button
                                                    key={optIndex}
                                                    onClick={() => handleSelectOption(question.id, option)}
                                                    disabled={isAnswered}
                                                    className={cn(
                                                        "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                                                        !isAnswered && isSelected && "border-primary bg-primary/10",
                                                        !isAnswered && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                                                        showCorrect && "border-green-500 bg-green-500/10",
                                                        showWrong && "border-red-500 bg-red-500/10",
                                                        isAnswered && !showCorrect && !showWrong && "border-border opacity-60",
                                                        isAnswered && "cursor-default"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                                                        !isAnswered && isSelected && "bg-primary text-white",
                                                        !isAnswered && !isSelected && "bg-muted",
                                                        showCorrect && "bg-green-500 text-white",
                                                        showWrong && "bg-red-500 text-white"
                                                    )}>
                                                        {String.fromCharCode(65 + optIndex)}
                                                    </span>
                                                    <span className="pt-1 flex-1">{option}</span>
                                                    {showCorrect && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />}
                                                    {showWrong && <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    {!isAnswered && userAnswer && (
                                        <button
                                            onClick={() => checkAnswer(question.id)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />Check Answer
                                        </button>
                                    )}
                                    {isAnswered && (
                                        <button
                                            onClick={() => resetQuestion(question.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />Try Again
                                        </button>
                                    )}
                                    {!userAnswer && !isAnswered && (
                                        <p className="text-sm text-muted-foreground">👆 Click an option to select your answer</p>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {isAnswered && question.explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 p-4 rounded-xl bg-muted/50 border border-border"
                                        >
                                            <p className="text-sm">
                                                <span className="font-semibold text-primary">Explanation: </span>
                                                {question.explanation}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
