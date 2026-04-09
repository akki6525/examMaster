import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    Clock,
    Target,
    CheckCircle,
    XCircle,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Home,
    RotateCcw,
    BookOpen,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import axios from 'axios';
import { cn, formatTime, getScoreColor, getScoreBgColor, getDifficultyColor } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

interface DetailedResult {
    id: string;
    type: string;
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    difficulty: string;
    topic: string;
    userAnswer: string | string[];
    isCorrect: boolean;
    timeTaken: number;
}

interface TestResultData {
    resultId: string;
    testTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    topicWiseScore: {
        topic: string;
        correct: number;
        total: number;
        percentage: number;
    }[];
    detailedResults: DetailedResult[];
}

const API_URL = 'http://localhost:3001/api';

export default function Results() {
    const { resultId } = useParams();
    const { user } = useAuthStore();
    const [result, setResult] = useState<TestResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        async function fetchResult() {
            try {
                const response = await axios.get(`${API_URL}/tests/results/${resultId}`);
                setResult(response.data);
            } catch (error) {
                console.error('Failed to fetch result:', error);
            } finally {
                setLoading(false);
            }
        }

        if (resultId) {
            fetchResult();
        }
    }, [resultId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Result not found</h2>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Go Home
                </Link>
            </div>
        );
    }

    const pieData = [
        { name: 'Correct', value: result.score, color: '#22c55e' },
        { name: 'Incorrect', value: result.totalMarks - result.score, color: '#ef4444' }
    ];

    const topicData = result.topicWiseScore.map(t => ({
        topic: t.topic.length > 15 ? t.topic.substring(0, 15) + '...' : t.topic,
        correct: t.correct,
        incorrect: t.total - t.correct,
        percentage: t.percentage
    }));

    const weakTopics = result.topicWiseScore
        .filter(t => t.percentage < 60)
        .sort((a, b) => a.percentage - b.percentage);

    const strongTopics = result.topicWiseScore
        .filter(t => t.percentage >= 60)
        .sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                    result.percentage >= 60 ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                    <Trophy className={cn(
                        "w-12 h-12",
                        result.percentage >= 60 ? "text-green-500" : "text-red-500"
                    )} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {result.percentage >= 60 ? `Excellent work, ${user?.username}!` : `Keep going, ${user?.username}!`}
                </h1>
                <p className="text-muted-foreground text-lg">
                    {result.testTitle || 'Mock Test'} Analysis
                </p>
            </motion.div>

            {/* Score Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                    "p-8 rounded-3xl border-2 text-center",
                    getScoreBgColor(result.percentage)
                )}
            >
                <div className={cn("text-7xl font-bold mb-2", getScoreColor(result.percentage))}>
                    {result.percentage}%
                </div>
                <p className="text-xl text-muted-foreground mb-6">
                    {result.score} out of {result.totalMarks} correct
                </p>

                <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>{result.score} Correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span>{result.totalMarks - result.score} Incorrect</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span>{formatTime(result.timeTaken)}</span>
                    </div>
                </div>
            </motion.div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-card border border-border"
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Score Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Bar Chart - Topic Wise */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-card border border-border"
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Topic-wise Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topicData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="topic" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Insights */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Weak Areas */}
                {weakTopics.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20"
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-500">
                            <TrendingDown className="w-5 h-5" />
                            Needs Improvement
                        </h3>
                        <div className="space-y-3">
                            {weakTopics.slice(0, 5).map((topic) => (
                                <div key={topic.topic} className="flex items-center justify-between">
                                    <span className="text-sm truncate flex-1 mr-4">{topic.topic}</span>
                                    <span className="text-sm font-semibold text-red-500">
                                        {topic.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Strong Areas */}
                {strongTopics.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20"
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-500">
                            <TrendingUp className="w-5 h-5" />
                            Strong Areas
                        </h3>
                        <div className="space-y-3">
                            {strongTopics.slice(0, 5).map((topic) => (
                                <div key={topic.topic} className="flex items-center justify-between">
                                    <span className="text-sm truncate flex-1 mr-4">{topic.topic}</span>
                                    <span className="text-sm font-semibold text-green-500">
                                        {topic.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Detailed Results */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-card border border-border overflow-hidden"
            >
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Detailed Question Review
                    </h3>
                    {showDetails ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                {showDetails && (
                    <div className="border-t divide-y">
                        {result.detailedResults.map((q, index) => (
                            <div
                                key={q.id}
                                className={cn(
                                    "p-6",
                                    q.isCorrect ? "bg-green-500/5" : "bg-red-500/5"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                        q.isCorrect ? "bg-green-500" : "bg-red-500"
                                    )}>
                                        {q.isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-semibold">Q{index + 1}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium border",
                                                getDifficultyColor(q.difficulty)
                                            )}>
                                                {q.difficulty}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                                                {q.topic}
                                            </span>
                                        </div>

                                        <p className="mb-4">{q.question}</p>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-2">
                                                <span className="text-muted-foreground">Your answer:</span>
                                                <span className={cn(
                                                    "font-medium",
                                                    q.isCorrect ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {q.userAnswer || '(Not answered)'}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.round(q.timeTaken / 1000)}s
                                                </span>
                                            </div>

                                            {!q.isCorrect && (
                                                <div className="flex gap-2">
                                                    <span className="text-muted-foreground">Correct answer:</span>
                                                    <span className="font-medium text-green-500">
                                                        {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                                                    </span>
                                                </div>
                                            )}

                                            {q.explanation && (
                                                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                                    <span className="text-muted-foreground font-medium">Explanation: </span>
                                                    {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4"
            >
                <Link
                    to="/"
                    className="btn-secondary inline-flex items-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    Go to Dashboard
                </Link>
                <Link
                    to="/upload"
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    Take Another Test
                </Link>
            </motion.div>
        </div>
    );
}
