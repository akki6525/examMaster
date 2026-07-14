import { useEffect, useState, useCallback, useMemo } from 'react';
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
    Play,
    Menu,
    Info,
    Lock,
    RotateCcw
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
    const [showMobileNav, setShowMobileNav] = useState(false);

    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [sectionTimeLeft, setSectionTimeLeft] = useState(15 * 60 * 1000);

    const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, number[]>>({});

    const handleToggleEliminated = (questionId: string, optIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // If this option is currently selected, clear the selected answer first
        const q = currentTest?.questions.find(item => item.id === questionId);
        if (q && q.options) {
            const optionVal = q.options[optIndex];
            const ans = userAnswers.find(ua => ua.questionId === questionId);
            if (ans && ans.answer === optionVal) {
                setAnswer(questionId, '');
            }
        }

        setEliminatedOptions(prev => {
            const current = prev[questionId] || [];
            const updated = current.includes(optIndex)
                ? current.filter(idx => idx !== optIndex)
                : [...current, optIndex];
            return { ...prev, [questionId]: updated };
        });
    };

    const handleResetEliminated = (questionId: string) => {
        setEliminatedOptions(prev => {
            const { [questionId]: _, ...rest } = prev;
            return rest;
        });
    };

    const activeSectionQuestions = useMemo(() => {
        if (!currentTest || !currentTest.sections || currentTest.sections.length === 0) return [];
        const sec = currentTest.sections[activeSectionIdx];
        if (!sec) return [];
        return currentTest.questions.filter(q => sec.questionIds.includes(q.id));
    }, [currentTest, activeSectionIdx]);

    const activeSectionAnsweredCount = useMemo(() => {
        return activeSectionQuestions.filter(q => {
            const ans = userAnswers.find(a => a.questionId === q.id);
            return ans && ans.answer !== '';
        }).length;
    }, [activeSectionQuestions, userAnswers]);

    const activeSectionProgressPercent = useMemo(() => {
        if (activeSectionQuestions.length === 0) return 0;
        return Math.round((activeSectionAnsweredCount / activeSectionQuestions.length) * 100);
    }, [activeSectionQuestions.length, activeSectionAnsweredCount]);

    // Start test on mount
    useEffect(() => {
        if (testId) {
            startTest(testId);
        }
    }, [testId, startTest]);

    // Check if SSC mock test
    const isSSCTest = useMemo(() => {
        return !!(currentTest && (
            currentTest.title.toUpperCase().includes('SSC') ||
            currentTest.sections?.some(s => 
                s.name.toUpperCase().includes('QUANT') || 
                s.name.toUpperCase().includes('REASONING') || 
                s.name.toUpperCase().includes('AWARENESS') || 
                s.name.toUpperCase().includes('ENGLISH')
            )
        ));
    }, [currentTest]);

    const isQuestionInActiveSection = useCallback((qIndex: number) => {
        if (!currentTest || !currentTest.sections || currentTest.sections.length === 0) return true;
        const q = currentTest.questions[qIndex];
        if (!q) return false;
        
        if (isSSCTest) {
            const qSectionIdx = currentTest.sections.findIndex((sec: any) =>
                sec.questionIds.includes(q.id)
            );
            return qSectionIdx === activeSectionIdx;
        }
        return true;
    }, [currentTest, isSSCTest, activeSectionIdx]);

    const handleGoToQuestion = useCallback((index: number) => {
        if (isSSCTest) {
            if (isQuestionInActiveSection(index)) {
                goToQuestion(index);
            }
        } else {
            goToQuestion(index);
        }
    }, [isSSCTest, isQuestionInActiveSection, goToQuestion]);

    const handleNextQuestion = useCallback(() => {
        if (!currentTest) return;
        const nextIdx = currentQuestionIndex + 1;
        if (nextIdx < currentTest.questions.length) {
            if (isSSCTest) {
                if (isQuestionInActiveSection(nextIdx)) {
                    goToQuestion(nextIdx);
                }
            } else {
                goToQuestion(nextIdx);
            }
        }
    }, [currentTest, currentQuestionIndex, isSSCTest, isQuestionInActiveSection, goToQuestion]);

    const handlePrevQuestion = useCallback(() => {
        if (!currentTest) return;
        const prevIdx = currentQuestionIndex - 1;
        if (prevIdx >= 0) {
            if (isSSCTest) {
                if (isQuestionInActiveSection(prevIdx)) {
                    goToQuestion(prevIdx);
                }
            } else {
                goToQuestion(prevIdx);
            }
        }
    }, [currentTest, currentQuestionIndex, isSSCTest, isQuestionInActiveSection, goToQuestion]);

    const hasPrev = useMemo(() => {
        if (!currentTest) return false;
        return isSSCTest 
            ? currentQuestionIndex > 0 && isQuestionInActiveSection(currentQuestionIndex - 1)
            : currentQuestionIndex > 0;
    }, [currentTest, currentQuestionIndex, isSSCTest, isQuestionInActiveSection]);

    const hasNext = useMemo(() => {
        if (!currentTest) return false;
        return isSSCTest 
            ? currentQuestionIndex < currentTest.questions.length - 1 && isQuestionInActiveSection(currentQuestionIndex + 1)
            : currentQuestionIndex < currentTest.questions.length - 1;
    }, [currentTest, currentQuestionIndex, isSSCTest, isQuestionInActiveSection]);

    const handleSubmit = useCallback(async () => {
        try {
            const result = await submitTest(eliminatedOptions);
            navigate(`/results/${result.resultId}`);
        } catch (err) {
            console.error('Submit error:', err);
        }
    }, [submitTest, navigate, eliminatedOptions]);

    // Set initial time
    useEffect(() => {
        if (currentTest) {
            if (isSSCTest && currentTest.sections && currentTest.sections.length > 0) {
                setSectionTimeLeft(15 * 60 * 1000);
                setActiveSectionIdx(0);
                setTimeLeft(currentTest.sections.length * 15 * 60 * 1000);
                
                const firstQuestionId = currentTest.sections[0].questionIds[0];
                const index = currentTest.questions.findIndex(q => q.id === firstQuestionId);
                if (index !== -1) {
                    goToQuestion(index);
                }
            } else if (currentTest.duration > 0) {
                setTimeLeft(currentTest.duration * 60 * 1000);
            }
        }
    }, [currentTest, isSSCTest, goToQuestion]);

    // Timer countdown
    useEffect(() => {
        if (!currentTest || isPaused) return;

        const sections = currentTest.sections;
        const questions = currentTest.questions;

        const interval = setInterval(() => {
            if (isSSCTest && sections && sections.length > 0) {
                setSectionTimeLeft((prevSectionTime) => {
                    if (prevSectionTime <= 1000) {
                        const nextIdx = activeSectionIdx + 1;
                        if (nextIdx < sections.length) {
                            setActiveSectionIdx(nextIdx);
                            const nextSection = sections[nextIdx];
                            const firstQuestionId = nextSection.questionIds[0];
                            const index = questions.findIndex(q => q.id === firstQuestionId);
                            if (index !== -1) {
                                goToQuestion(index);
                            }
                            
                            if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance("Time is up for this section. Moving to next section.");
                                window.speechSynthesis.speak(utterance);
                            }
                            
                            return 15 * 60 * 1000;
                        } else {
                            clearInterval(interval);
                            handleSubmit();
                            return 0;
                        }
                    }
                    return prevSectionTime - 1000;
                });
                
                setTimeLeft((prevGlobal) => prevGlobal > 1000 ? prevGlobal - 1000 : 0);
            } else if (currentTest.duration > 0) {
                setTimeLeft((prev) => {
                    if (prev <= 1000) {
                        clearInterval(interval);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1000;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentTest, isPaused, isSSCTest, activeSectionIdx, goToQuestion, handleSubmit]);



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
            <header className="h-16 border-b bg-card flex items-center justify-between px-4 flex-shrink-0 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold flex items-center gap-2">
                            <span>{currentTest.title}</span>
                            {isSSCTest && currentTest.sections && currentTest.sections[activeSectionIdx] && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold whitespace-nowrap">
                                    {currentTest.sections[activeSectionIdx].name}
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>Question {currentQuestionIndex + 1} of {currentTest.questions.length}</span>
                            {isSSCTest && currentTest.sections && (
                                <>
                                    <span className="text-border">•</span>
                                    <span className="font-bold text-emerald-500">
                                        Section: {activeSectionAnsweredCount}/{activeSectionQuestions.length} Answered ({activeSectionProgressPercent}%)
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    {isSSCTest ? (
                        <div className="flex flex-col items-end gap-0.5 justify-center">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-base font-black border border-primary/20",
                                sectionTimeLeft < 180000 ? "bg-red-500/10 text-red-500 timer-warning animate-pulse" : "bg-primary/5 text-primary"
                            )}>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded text-primary">Section</span>
                                <Clock className="w-4 h-4" />
                                {formatTime(sectionTimeLeft)}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground mr-1">
                                Total: {formatTime(timeLeft)}
                            </span>
                        </div>
                    ) : (
                        currentTest.duration > 0 && (
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
                        )
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

                    {/* Navigator Toggles */}
                    <button
                        onClick={() => setShowNavPanel(!showNavPanel)}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors border"
                        title={showNavPanel ? "Collapse Question Navigator" : "Expand Question Navigator"}
                    >
                        {showNavPanel ? "Collapse Grid" : "Expand Grid"}
                    </button>



                    <button
                        onClick={() => setShowMobileNav(true)}
                        className="lg:hidden p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors border"
                        title="Question Navigator"
                    >
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </button>

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
                    {currentTest.sections.map((section: any, idx: number) => {
                        const isCurrentSection = section.questionIds.includes(currentQuestion.id);
                        const isSectionLocked = isSSCTest && idx !== activeSectionIdx;
                        return (
                            <button
                                key={section.id}
                                disabled={isSectionLocked}
                                onClick={() => {
                                    if (isSectionLocked) return;
                                    const firstQuestionId = section.questionIds[0];
                                    const index = currentTest.questions.findIndex(q => q.id === firstQuestionId);
                                    if (index !== -1) goToQuestion(index);
                                }}
                                className={cn(
                                    "px-4 h-full border-b-2 font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2",
                                    isCurrentSection
                                        ? "border-primary text-primary bg-primary/5 font-bold"
                                        : isSectionLocked
                                            ? "border-transparent text-muted-foreground/35 cursor-not-allowed opacity-50"
                                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {isSectionLocked && (
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                )}
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
                                    const isEliminated = (eliminatedOptions[currentQuestion.id] || []).includes(index);

                                    return (
                                        <div key={option} className="relative group">
                                            <motion.button
                                                whileHover={!isEliminated ? { scale: 1.01 } : undefined}
                                                whileTap={!isEliminated ? { scale: 0.99 } : undefined}
                                                onClick={() => {
                                                    if (isEliminated) return;
                                                    setAnswer(currentQuestion.id, option);
                                                }}
                                                disabled={isEliminated}
                                                className={cn(
                                                    "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4 pr-12",
                                                    isEliminated
                                                        ? "border-border/30 bg-muted/10 opacity-30 line-through cursor-not-allowed text-muted-foreground/60"
                                                        : isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-semibold flex-shrink-0 transition-colors",
                                                    isEliminated
                                                        ? "bg-muted/50 text-muted-foreground/45"
                                                        : isSelected
                                                            ? "bg-primary text-white"
                                                            : "bg-muted"
                                                )}>
                                                    {optionLabel}
                                                </span>
                                                <span className="pt-1">{option}</span>
                                            </motion.button>

                                            <button
                                                onClick={(e) => handleToggleEliminated(currentQuestion.id, index, e)}
                                                className={cn(
                                                    "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg border transition-all duration-200 z-10",
                                                    isEliminated
                                                        ? "bg-red-500/10 border-red-500/30 text-red-500 opacity-100 hover:bg-red-500/20"
                                                        : "bg-muted border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/10 hover:text-foreground"
                                                )}
                                                type="button"
                                                title={isEliminated ? "Restore Option" : "Eliminate Option"}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
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

                        {/* Question Action Bar */}
                        <div className="flex flex-wrap gap-3 mt-6 justify-end items-center">
                            {((eliminatedOptions[currentQuestion.id] || []).length > 0) && (
                                <button
                                    onClick={() => handleResetEliminated(currentQuestion.id)}
                                    className="px-4 py-2 bg-muted/40 hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5"
                                    type="button"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset Options
                                </button>
                            )}
                            {(currentAnswer?.answer && currentAnswer.answer !== '') && (
                                <button
                                    onClick={() => setAnswer(currentQuestion.id, '')}
                                    className="px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5"
                                    type="button"
                                >
                                    <X className="w-4 h-4" />
                                    Clear Choice
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (!currentAnswer?.flagged) {
                                        toggleFlag(currentQuestion.id);
                                    }
                                    handleNextQuestion();
                                }}
                                disabled={isSSCTest && !hasNext}
                                className={cn(
                                    "px-4 py-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/25 border border-amber-500/20 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                    isSSCTest && !hasNext && "opacity-50 cursor-not-allowed"
                                )}
                                type="button"
                            >
                                <Flag className="w-4 h-4 animate-bounce-subtle" />
                                Mark for Review & Next
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t">
                            <button
                                onClick={handlePrevQuestion}
                                disabled={!hasPrev}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                    !hasPrev
                                        ? "text-muted-foreground cursor-not-allowed opacity-50"
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
                                onClick={handleNextQuestion}
                                disabled={!hasNext}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                    !hasNext
                                        ? "text-muted-foreground cursor-not-allowed opacity-50"
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

                                    const isQuestionLocked = isSSCTest && !isQuestionInActiveSection(index);
                                    return (
                                        <button
                                            key={q.id}
                                            disabled={isQuestionLocked}
                                            onClick={() => {
                                                if (isQuestionLocked) return;
                                                goToQuestion(index);
                                            }}
                                            className={cn(
                                                "relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200",
                                                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                                isQuestionLocked
                                                    ? "bg-muted/30 text-muted-foreground/35 cursor-not-allowed border border-dashed flex items-center justify-center"
                                                    : isAnswered
                                                        ? "bg-green-500 text-white"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            )}
                                        >
                                            {isQuestionLocked ? (
                                                <svg className="w-3.5 h-3.5 mx-auto opacity-35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            ) : (
                                                index + 1
                                            )}
                                            {!isQuestionLocked && isFlagged && (
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

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {showMobileNav && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileNav(false)}
                            className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-[2.5rem] border-t border-border z-[70] p-6 lg:hidden shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Menu className="w-5 h-5 text-primary" />
                                    <h3 className="font-extrabold text-lg">Question Navigator</h3>
                                </div>
                                <button
                                    onClick={() => setShowMobileNav(false)}
                                    className="p-2 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                                <div className="grid grid-cols-5 gap-3 mb-6">
                                    {currentTest.questions.map((q, index) => {
                                        const answer = userAnswers.find(a => a.questionId === q.id);
                                        const isAnswered = answer?.answer && answer.answer !== '';
                                        const isFlagged = answer?.flagged;
                                        const isCurrent = index === currentQuestionIndex;
                                        const isQuestionLocked = isSSCTest && !isQuestionInActiveSection(index);

                                        return (
                                            <button
                                                key={q.id}
                                                disabled={isQuestionLocked}
                                                onClick={() => {
                                                    if (isQuestionLocked) return;
                                                    goToQuestion(index);
                                                    setShowMobileNav(false);
                                                }}
                                                className={cn(
                                                    "relative w-full aspect-square rounded-xl font-black text-sm flex items-center justify-center transition-all duration-200 border-2",
                                                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary",
                                                    isQuestionLocked
                                                        ? "bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed"
                                                        : isAnswered
                                                            ? "bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20"
                                                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                                )}
                                            >
                                                {isQuestionLocked ? (
                                                    <svg className="w-4 h-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                ) : (
                                                    index + 1
                                                )}
                                                {!isQuestionLocked && isFlagged && (
                                                    <Flag className="absolute top-1 right-1 w-3 h-3 text-amber-500 fill-current" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-[10px] font-black uppercase text-center pt-4 border-t border-border/50 bg-card">
                                <div className="flex flex-col items-center gap-1.5 p-3 bg-green-500/10 text-green-600 rounded-2xl border border-green-500/20">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    <span>Answered</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5 p-3 bg-muted text-muted-foreground rounded-2xl border border-border/50">
                                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                                    <span>Not Answered</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5 p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                                    <Flag className="w-4 h-4 text-amber-500" />
                                    <span>Flagged</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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

            {/* 3-Minute Section Timer Warning Toast */}
            {isSSCTest && sectionTimeLeft < 180000 && sectionTimeLeft > 0 && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[40]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-black shadow-lg shadow-amber-500/25 border border-amber-600 animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Hurry Up! Less than 3 minutes remaining in this section. Section auto-commits next.</span>
                    </div>
                </div>
            )}


        </div>
    );
}
