import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Flag,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Circle,
    AlertTriangle,
    X,
    Send,
    Pause,
    Play
} from 'lucide-react';
import { useTestStore, Question } from '../stores/testStore';
import { cn, formatTime, getDifficultyColor } from '../lib/utils';

export default function TestInterface() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const {
        currentTest,
        currentQuestionIndex,
        userAnswers,
        startTest,
        setAnswer,
        toggleFlag,
        goToQuestion,
        nextQuestion,
        prevQuestion,
        submitTest,
        isLoading
    } = useTestStore();

    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showNavPanel, setShowNavPanel] = useState(true);

    // Start test on mount
    useEffect(() => {
        if (testId) {
            startTest(testId);
        }
    }, [testId, startTest]);

    // Set initial time
    useEffect(() => {
        if (currentTest && currentTest.duration > 0) {
            setTimeLeft(currentTest.duration * 60 * 1000);
        }
    }, [currentTest]);

    // Timer countdown
    useEffect(() => {
        if (!currentTest || currentTest.duration === 0 || isPaused) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentTest, isPaused]);

    const handleSubmit = useCallback(async () => {
        try {
            const result = await submitTest();
            navigate(`/results/${result.resultId}`);
        } catch (err) {
            console.error('Submit error:', err);
        }
    }, [submitTest, navigate]);

    if (isLoading || !currentTest) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading test...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = currentTest.questions[currentQuestionIndex];
    const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion.id);
    const answeredCount = userAnswers.filter(a => a.answer && a.answer !== '').length;
    const flaggedCount = userAnswers.filter(a => a.flagged).length;

    return (
        <div className="fixed inset-0 bg-background flex flex-col">
            {/* Header */}
            <header className="h-16 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold">{currentTest.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            Question {currentQuestionIndex + 1} of {currentTest.questions.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    {currentTest.duration > 0 && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-semibold",
                            timeLeft < 300000 ? "bg-red-500/10 text-red-500 timer-warning" : "bg-muted"
                        )}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeLeft)}
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-1 rounded hover:bg-muted-foreground/20 transition-colors"
                            >
                                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            {answeredCount} Answered
                        </div>
                        <div className="flex items-center gap-2 text-amber-500">
                            <Flag className="w-4 h-4" />
                            {flaggedCount} Flagged
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit
                    </button>
                </div>
            </header>

            {/* Section Tabs */}
            {currentTest.sections && currentTest.sections.length > 0 && (
                <div className="h-12 border-b bg-card flex items-center px-4 gap-2 overflow-x-auto no-scrollbar">
                    {currentTest.sections.map((section: any) => {
                        const isCurrentSection = section.questionIds.includes(currentQuestion.id);
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    const firstQuestionId = section.questionIds[0];
                                    const index = currentTest.questions.findIndex(q => q.id === firstQuestionId);
                                    if (index !== -1) goToQuestion(index);
                                }}
                                className={cn(
                                    "px-4 h-full border-b-2 font-medium text-sm transition-all whitespace-nowrap",
                                    isCurrentSection
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {section.name}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Question Panel */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Question Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-primary">
                                    Q{currentQuestionIndex + 1}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                    getDifficultyColor(currentQuestion.difficulty)
                                )}>
                                    {currentQuestion.difficulty}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                                    {currentQuestion.topic}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleFlag(currentQuestion.id)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    currentAnswer?.flagged
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <Flag className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Question Text */}
                        <div className="text-xl leading-relaxed mb-8 whitespace-pre-wrap">
                            {currentQuestion.question}
                        </div>

                        {/* Options */}
                        {(currentQuestion.type === 'mcq' || (!currentQuestion.type && currentQuestion.options)) && currentQuestion.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = currentAnswer?.answer === option;
                                    const optionLabel = String.fromCharCode(65 + index);

                                    return (
                                        <motion.button
                                            key={option}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setAnswer(currentQuestion.id, option)}
                                            className={cn(
                                                "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4",
                                                isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <span className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-semibold flex-shrink-0",
                                                isSelected ? "bg-primary text-white" : "bg-muted"
                                            )}>
                                                {optionLabel}
                                            </span>
                                            <span className="pt-1">{option}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {/* True/False Options */}
                        {currentQuestion.type === 'true-false' && (
                            <div className="flex gap-4">
                                {['True', 'False'].map((option) => {
                                    const isSelected = currentAnswer?.answer === option;

                                    return (
                                        <motion.button
                                            key={option}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setAnswer(currentQuestion.id, option)}
                                            className={cn(
                                                "flex-1 p-6 rounded-xl border-2 font-semibold text-lg transition-all duration-200",
                                                isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            {option}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Short Answer / Fill Blank */}
                        {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'fill-blank') && (
                            <textarea
                                value={(currentAnswer?.answer as string) || ''}
                                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full h-40 p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none resize-none transition-colors"
                            />
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t">
                            <button
                                onClick={prevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                    currentQuestionIndex === 0
                                        ? "text-muted-foreground cursor-not-allowed"
                                        : "hover:bg-muted"
                                )}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            <div className="text-sm text-muted-foreground">
                                {currentQuestionIndex + 1} / {currentTest.questions.length}
                            </div>

                            <button
                                onClick={nextQuestion}
                                disabled={currentQuestionIndex === currentTest.questions.length - 1}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                    currentQuestionIndex === currentTest.questions.length - 1
                                        ? "text-muted-foreground cursor-not-allowed"
                                        : "btn-primary"
                                )}
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Panel */}
                <AnimatePresence>
                    {showNavPanel && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-72 border-l bg-card p-4 overflow-y-auto hidden lg:block"
                        >
                            <h3 className="font-semibold mb-4">Question Navigator</h3>

                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {currentTest.questions.map((q, index) => {
                                    const answer = userAnswers.find(a => a.questionId === q.id);
                                    const isAnswered = answer?.answer && answer.answer !== '';
                                    const isFlagged = answer?.flagged;
                                    const isCurrent = index === currentQuestionIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => goToQuestion(index)}
                                            className={cn(
                                                "relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200",
                                                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                                isAnswered
                                                    ? "bg-green-500 text-white"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            )}
                                        >
                                            {index + 1}
                                            {isFlagged && (
                                                <Flag className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-500" />
                                    <span>Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-muted" />
                                    <span>Not Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-amber-500" />
                                    <span>Flagged for Review</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-card rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Submit Test?</h3>
                                <p className="text-muted-foreground">
                                    Are you sure you want to submit your test?
                                </p>
                            </div>

                            <div className="bg-muted rounded-xl p-4 mb-6 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Answered</span>
                                    <span className="font-medium text-green-500">{answeredCount} / {currentTest.questions.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Unanswered</span>
                                    <span className="font-medium text-red-500">{currentTest.questions.length - answeredCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Flagged</span>
                                    <span className="font-medium text-amber-500">{flaggedCount}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
                                >
                                    Continue Test
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 btn-primary"
                                >
                                    Submit Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
