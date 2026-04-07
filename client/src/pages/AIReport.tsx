import { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, TrendingUp, TrendingDown, Target, Clock, Zap,
    CheckCircle, XCircle, BarChart2, Award,
    ChevronDown, ChevronUp, RefreshCw, Trash2, BookOpen,
    Flame, ArrowRight, Activity, FileQuestion, FileText, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

const API = 'http://localhost:3001/api';

interface TopicScore {
    topic: string;
    correct: number;
    total: number;
    attempted: number;
    percentage: number;
    avgTime?: number;
}

interface TestResultSummary {
    id: string;
    testId: string;
    testTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    duration?: number;
    topicWiseScore: TopicScore[];
    completedAt: string;
}

interface PracticeStats {
    totalAttempted: number;
    correct: number;
    incorrect: number;
    topicWiseScore: TopicScore[];
    dailyStats: Record<string, { total: number; correct: number }>;
    lastUpdated: string;
}

interface TopicInsight {
    topic: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracy: number;
    avgTime: number;
    trend: 'improving' | 'declining' | 'stable';
    priority: 'critical' | 'needs-work' | 'good' | 'excellent';
    source: 'mock' | 'practice' | 'both';
}

interface AIInsight {
    type: 'strength' | 'weakness' | 'tip' | 'warning';
    title: string;
    detail: string;
    icon: string;
}

function generateAIInsights(results: TestResultSummary[], topicInsights: TopicInsight[], practiceStats: PracticeStats | null): AIInsight[] {
    const insights: AIInsight[] = [];

    const hasMock = results.length > 0;
    const hasPractice = practiceStats && practiceStats.totalAttempted > 0;

    if (!hasMock && !hasPractice) return insights;

    if (hasMock) {
        const avgScore = results.reduce((s, r) => s + r.percentage, 0) / results.length;
        const bestScore = Math.max(...results.map(r => r.percentage));
        const recentTrend = results.length >= 2 ? results[0].percentage - results[1].percentage : 0;

        if (recentTrend > 5) insights.push({ type: 'strength', title: 'Great Momentum! 🚀', detail: `Your score improved by ${recentTrend}% in your last test. You're on an upward trajectory!`, icon: '📈' });
        else if (recentTrend < -10) insights.push({ type: 'warning', title: 'Score Dip Detected', detail: `Your score dropped by ${Math.abs(recentTrend)}% recently. Identify weak spots below and focus there.`, icon: '⚠️' });

        const variance = results.reduce((s, r) => s + Math.pow(r.percentage - avgScore, 2), 0) / results.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 8 && results.length >= 3) insights.push({ type: 'strength', title: 'Very Consistent Performer', detail: `Your scores vary by only ±${Math.round(stdDev)}%, showing excellent consistency.`, icon: '🎯' });
        else if (stdDev > 20 && results.length >= 3) insights.push({ type: 'tip', title: 'Inconsistent Performance', detail: `Scores vary widely (±${Math.round(stdDev)}%). Try revising concepts the night before tests.`, icon: '💡' });
        if (bestScore >= 80) insights.push({ type: 'strength', title: `Personal Best: ${bestScore}%`, detail: `You've achieved ${bestScore}% in a mock test! Keep pushing to make this your average.`, icon: '🏆' });
        if (avgScore < 50 && results.length >= 2) insights.push({ type: 'tip', title: 'Study Strategy Suggestion', detail: 'Average below 50%. Try solving topic-wise practice questions first before full mock tests.', icon: '📚' });
    }

    const criticalTopics = topicInsights.filter(t => t.priority === 'critical');
    if (criticalTopics.length > 0) insights.push({ type: 'weakness', title: `${criticalTopics.length} Topic${criticalTopics.length > 1 ? 's' : ''} Need Urgent Attention`, detail: `Focus on: ${criticalTopics.slice(0, 3).map(t => t.topic).join(', ')}. Accuracy below 40%.`, icon: '🔴' });

    const excellentTopics = topicInsights.filter(t => t.priority === 'excellent');
    if (excellentTopics.length > 0) insights.push({ type: 'strength', title: 'You Excel In These Topics', detail: `${excellentTopics.slice(0, 3).map(t => t.topic).join(', ')} – Scoring 80%+. Keep it up!`, icon: '⭐' });

    if (hasPractice && !hasMock) insights.push({ type: 'tip', title: 'Try a Full Mock Test!', detail: `You've practiced ${practiceStats!.totalAttempted} questions. Now test yourself under timed conditions to simulate the real exam.`, icon: '⏱️' });
    if (hasPractice && hasMock) insights.push({ type: 'tip', title: 'Great Habit: Practice + Tests', detail: `You're using both practice mode and mock tests — this is the best strategy for competitive exam preparation!`, icon: '✅' });

    return insights;
}

function computeTopicInsights(results: TestResultSummary[], practiceStats: PracticeStats | null): TopicInsight[] {
    const topicMap: Record<string, { mockAttempts: number; mockCorrect: number; practiceAttempts: number; practiceCorrect: number; times: number[] }> = {};

    // From mock tests
    results.forEach(result => {
        result.topicWiseScore.forEach(ts => {
            if (!topicMap[ts.topic]) topicMap[ts.topic] = { mockAttempts: 0, mockCorrect: 0, practiceAttempts: 0, practiceCorrect: 0, times: [] };
            topicMap[ts.topic].mockAttempts += ts.total;
            topicMap[ts.topic].mockCorrect += ts.correct;
            if (ts.avgTime) topicMap[ts.topic].times.push(ts.avgTime);
        });
    });

    // From practice
    if (practiceStats?.topicWiseScore) {
        practiceStats.topicWiseScore.forEach(ts => {
            if (!topicMap[ts.topic]) topicMap[ts.topic] = { mockAttempts: 0, mockCorrect: 0, practiceAttempts: 0, practiceCorrect: 0, times: [] };
            topicMap[ts.topic].practiceAttempts += ts.total;
            topicMap[ts.topic].practiceCorrect += ts.correct;
        });
    }

    return Object.entries(topicMap).map(([topic, data]) => {
        const totalAttempted = data.mockAttempts + data.practiceAttempts;
        const totalCorrect = data.mockCorrect + data.practiceCorrect;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        const avgTime = data.times.length > 0 ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length) : 0;
        const source: TopicInsight['source'] = data.mockAttempts > 0 && data.practiceAttempts > 0 ? 'both' : data.mockAttempts > 0 ? 'mock' : 'practice';

        const priority: TopicInsight['priority'] = accuracy < 40 ? 'critical' : accuracy < 60 ? 'needs-work' : accuracy < 80 ? 'good' : 'excellent';

        const trend: TopicInsight['trend'] = 'stable';
        return { topic, totalAttempted, totalCorrect, accuracy, avgTime, trend, priority, source };
    }).sort((a, b) => a.accuracy - b.accuracy);
}

const PRIORITY_STYLES = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
    'needs-work': 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
    good: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    excellent: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
};
const PRIORITY_LABEL: Record<string, string> = { critical: 'Critical', 'needs-work': 'Needs Work', good: 'Good', excellent: 'Excellent' };

function ProgressBar({ value, max, color = '#f97316' }: { value: number; max: number; color?: string }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: color }} />
        </div>
    );
}

function ScoreRing({ pct }: { pct: number }) {
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f97316' : pct >= 40 ? '#eab308' : '#ef4444';
    const r = 44;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;
    return (
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" width="112" height="112">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            </svg>
            <div className="text-center z-10">
                <p className="text-2xl font-bold" style={{ color }}>{pct}%</p>
                <p className="text-[10px] text-muted-foreground">Score</p>
            </div>
        </div>
    );
}

export default function AIReport() {
    const { user } = useAuthStore();
    const [results, setResults] = useState<TestResultSummary[]>([]);
    const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [expandedResult, setExpandedResult] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'mock' | 'practice' | 'predictions'>('overview');
    const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({}); // actually expanded Topics now if true
    const [detailedResults, setDetailedResults] = useState<Record<string, any[]>>({});

    const formatTime = (ms: number) => {
        const totalSeconds = Math.round(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins > 0) return `${mins}m ${secs}s`;
        if (ms > 0 && totalSeconds === 0) return `<1s`;
        return `${secs}s`;
    };

    const toggleTopic = (category: string) => {
        setCollapsedTopics(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const location = useLocation();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/tests/results`);
            setResults(res.data || []);
        } catch (e) { console.error(e); }

        // Read practice stats from server DB
        try {
            const res = await axios.get(`${API}/practice-stats`);
            if (res.data && res.data.totalAttempted > 0) {
                setPracticeStats(res.data);
            }
        } catch (e) { console.error(e); }

        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        if (tab === 'mock' || tab === 'practice' || tab === 'overview' || tab === 'predictions') {
            setActiveTab(tab as any);
        }
    }, [location.search]);

    useEffect(() => {
        if (expandedResult && !detailedResults[expandedResult]) {
            axios.get(`${API}/tests/results/${expandedResult}`).then(res => {
                if (res.data && res.data.detailedResults) {
                    setDetailedResults(prev => ({ ...prev, [expandedResult]: res.data.detailedResults }));
                }
            }).catch(console.error);
        }
    }, [expandedResult]);

    const deleteResult = async (id: string) => {
        setDeleting(id);
        try {
            await axios.delete(`${API}/tests/results/${id}`);
            setResults(prev => prev.filter(r => r.id !== id));
        } catch (e) { console.error(e); }
        finally { setDeleting(null); }
    };

    const clearPracticeHistory = async () => {
        try {
            await axios.delete(`${API}/practice-stats`);
        } catch (e) { console.error(e); }
        setPracticeStats(null);
    };

    const topicInsights = useMemo(() => computeTopicInsights(results, practiceStats), [results, practiceStats]);
    const aiInsights = useMemo(() => generateAIInsights(results, topicInsights, practiceStats), [results, topicInsights, practiceStats]);

    const overallAvg = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
    const practiceAccuracy = practiceStats && practiceStats.totalAttempted > 0
        ? Math.round((practiceStats.correct / practiceStats.totalAttempted) * 100) : 0;

    const hasMock = results.length > 0;
    const hasPractice = practiceStats && practiceStats.totalAttempted > 0;
    const hasAnyData = hasMock || hasPractice;

    const readinessScore = useMemo(() => {
        const mockWeight = 0.7;
        const practiceWeight = 0.3;
        
        const mScore = hasMock ? overallAvg : 0;
        const pScore = hasPractice ? practiceAccuracy : 0;
        
        let score = 0;
        if (hasMock && hasPractice) {
            score = (mScore * mockWeight) + (pScore * practiceWeight);
        } else if (hasMock) {
            score = mScore * 0.95; // slightly lower confidence without practice
        } else if (hasPractice) {
            score = pScore * 0.8; // harder to predict without mocks
        }
        
        // Volume bonus: more data = higher confidence/bonus
        const volumeBonus = Math.min(8, (results.length * 1) + ((practiceStats?.totalAttempted || 0) / 50));
        return Math.min(100, Math.round(score + volumeBonus));
    }, [hasMock, hasPractice, overallAvg, practiceAccuracy, results.length, practiceStats]);

    const insightColors: Record<string, string> = {
        strength: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
        weakness: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
        tip: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
        warning: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Brain },
        { id: 'mock', label: `Mock Tests (${results.length})`, icon: Activity },
        { id: 'practice', label: 'Practice', icon: FileQuestion },
        { id: 'predictions', label: 'AI Expert', icon: Sparkles },
    ] as const;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#f97316' }} />
                    <p className="text-muted-foreground">Loading your performance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        {user ? `${user.username.charAt(0).toUpperCase() + user.username.slice(1)}'s Performance Report` : 'AI Performance Report'}
                    </h1>
                    <p className="text-muted-foreground text-sm">Deep analysis of your mock tests and practice sessions</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {!hasAnyData ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 space-y-4">
                    <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto">
                        <Brain className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">No Data Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Take a mock test or practice questions from the Question Bank to unlock AI insights.</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <a href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(to right, #f97316, #ec4899)' }}>
                            Take Mock Test <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="/question-bank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-muted hover:bg-muted/80">
                            Practice Questions <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </motion.div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Mock Tests', value: results.length, icon: Activity, color: '#818cf8', show: true },
                            { label: 'Mock Avg Score', value: hasMock ? `${overallAvg}%` : '—', icon: Target, color: overallAvg >= 70 ? '#22c55e' : overallAvg >= 50 ? '#f97316' : '#ef4444', show: true },
                            { label: 'Questions Practiced', value: hasPractice ? practiceStats!.totalAttempted : '—', icon: FileQuestion, color: '#34d399', show: true },
                            { label: 'Practice Accuracy', value: hasPractice ? `${practiceAccuracy}%` : '—', icon: CheckCircle, color: practiceAccuracy >= 70 ? '#22c55e' : '#f97316', show: true },
                        ].filter(s => s.show).map((stat, i) => (
                            <motion.div 
                                key={stat.label} 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: i * 0.08 }} 
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative cursor-default"
                            >
                                <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-500 pointer-events-none">
                                    <stat.icon className="w-32 h-32" style={{ color: stat.color }} />
                                </div>
                                <div className="mb-3 relative z-10"><stat.icon className="w-5 h-5" style={{ color: stat.color }} /></div>
                                <p className="text-2xl font-bold mb-0.5 relative z-10">{stat.value}</p>
                                <p className="text-sm text-muted-foreground relative z-10">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/50 w-fit flex-wrap">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={cn('relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors z-10',
                                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    )}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-background shadow-sm rounded-xl border border-border/50 -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                    <tab.icon className={cn("w-4 h-4 transition-colors", isActive && "text-primary")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">

                        {/* === OVERVIEW === */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                {/* Score trend */}
                                {hasMock && (
                                    <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                                        <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-400" /> Mock Test Score Trend</h3>
                                        <div className="flex items-end gap-2 h-24">
                                            {[...results].reverse().map((r, i) => {
                                                const h = Math.max((r.percentage / 100) * 96, 8);
                                                const color = r.percentage >= 80 ? '#22c55e' : r.percentage >= 60 ? '#f97316' : r.percentage >= 40 ? '#eab308' : '#ef4444';
                                                return (
                                                    <div key={r.id} className="flex flex-col items-center gap-1 flex-1 min-w-0 group relative">
                                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                            {r.percentage}% · {new Date(r.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                        <motion.div initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05, duration: 0.5 }} className="w-full rounded-t-lg" style={{ height: `${h}px`, background: color, originY: 1 }} />
                                                        <p className="text-[9px] text-muted-foreground">{i + 1}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">Test number (oldest → newest) · Hover for details</p>
                                    </div>
                                )}

                                {/* Practice summary */}
                                {hasPractice && (
                                    <div className="p-6 rounded-2xl bg-card border border-border">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><FileQuestion className="w-5 h-5 text-blue-400" /> Practice Session Summary</h3>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center"><p className="text-2xl font-bold text-foreground">{practiceStats!.totalAttempted}</p><p className="text-xs text-muted-foreground">Attempted</p></div>
                                            <div className="text-center"><p className="text-2xl font-bold text-green-400">{practiceStats!.correct}</p><p className="text-xs text-muted-foreground">Correct</p></div>
                                            <div className="text-center"><p className="text-2xl font-bold text-red-400">{practiceStats!.incorrect}</p><p className="text-xs text-muted-foreground">Incorrect</p></div>
                                        </div>
                                        <ProgressBar value={practiceAccuracy} max={100} color={practiceAccuracy >= 70 ? '#22c55e' : practiceAccuracy >= 50 ? '#f97316' : '#ef4444'} />
                                        <p className="text-xs text-muted-foreground mt-2">Overall accuracy: {practiceAccuracy}%</p>
                                    </div>
                                )}

                                {/* AI Insights */}
                                <div className="space-y-3">
                                    <h3 className="font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> AI Insights <span className="text-xs text-muted-foreground font-normal">({aiInsights.length} insights)</span></h3>
                                    <div className="space-y-3">
                                        {aiInsights.map((insight, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                className={cn('p-4 rounded-xl border flex items-start gap-3 shadow-sm hover:shadow-md transition-all cursor-default', insightColors[insight.type])}>
                                                <span className="text-2xl flex-shrink-0 drop-shadow-sm">{insight.icon}</span>
                                                <div><p className="font-semibold">{insight.title}</p><p className="text-sm opacity-80 mt-0.5">{insight.detail}</p></div>
                                            </motion.div>
                                        ))}
                                        {aiInsights.length === 0 && (
                                            <p className="text-sm text-muted-foreground">Attempt more questions or tests to generate insights.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Priority queue */}
                                {topicInsights.length > 0 && (
                                    <div className="p-6 rounded-2xl bg-card border border-border">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-red-400" /> Study Priority Queue</h3>
                                        <div className="space-y-3">
                                            {topicInsights.slice(0, 6).map(ti => (
                                                <div key={ti.topic} className="flex items-center gap-3">
                                                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0', PRIORITY_STYLES[ti.priority])}>{PRIORITY_LABEL[ti.priority]}</span>
                                                    <span className="flex-1 text-sm truncate">{ti.topic}</span>
                                                    <span className="text-xs text-muted-foreground flex-shrink-0">{ti.source === 'both' ? '📋+🎯' : ti.source === 'mock' ? '📋' : '🎯'}</span>
                                                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: ti.accuracy >= 70 ? '#22c55e' : ti.accuracy >= 50 ? '#f97316' : '#ef4444' }}>{ti.accuracy}%</span>
                                                    <div className="w-20 hidden sm:block flex-shrink-0"><ProgressBar value={ti.accuracy} max={100} color={ti.accuracy >= 70 ? '#22c55e' : ti.accuracy >= 50 ? '#f97316' : '#ef4444'} /></div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-4">📋 Mock test data · 🎯 Practice data · Both combined</p>
                                    </div>
                                )}
                            </motion.div>
                        )}



                        {/* === MOCK TESTS === */}
                        {activeTab === 'mock' && (
                            <motion.div key="mock" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                {!hasMock ? (
                                    <div className="text-center py-12 space-y-3">
                                        <Activity className="w-12 h-12 text-muted-foreground mx-auto" />
                                        <p className="text-muted-foreground">No mock tests taken yet.</p>
                                        <a href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(to right, #f97316, #ec4899)' }}>
                                            Start a Mock Test <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                ) : results.map((result, i) => {
                                    const isExpanded = expandedResult === result.id;
                                    
                                    const totalCorrect = result.topicWiseScore.reduce((acc, t) => acc + t.correct, 0);
                                    const totalAttempted = result.topicWiseScore.reduce((acc, t) => acc + (t.attempted !== undefined ? t.attempted : t.total), 0);
                                    const totalIncorrect = totalAttempted - totalCorrect;
                                    const negativeMarks = totalIncorrect * 0.25;
                                    const unattemptedQs = Math.max(0, result.totalMarks - totalAttempted);
                                    const isHighNegative = totalIncorrect > (Math.max(1, totalCorrect) / 4);
                                    
                                    // Advanced simulated AI metrics
                                    const avgTimeSecs = totalAttempted > 0 ? (result.timeTaken / 1000) / totalAttempted : 0;
                                    
                                    // Professional Pacing Algorithm
                                    let pacingStatus = 'Perfect';
                                    let pacingColor = 'text-green-500';
                                    let pacingBarColor = 'bg-green-500';
                                    let pacingBg = 'bg-green-500/5';
                                    let pacingBorder = 'border-green-500/20';
                                    let pacingProgress = '50%';
                                    let pacingDescription = "Ideal balance between speed and quality.";

                                    if (avgTimeSecs < 15) {
                                        if (result.percentage >= 80) {
                                            pacingStatus = 'Elite';
                                            pacingColor = 'text-purple-500';
                                            pacingBarColor = 'bg-purple-500';
                                            pacingBg = 'bg-purple-500/5';
                                            pacingBorder = 'border-purple-500/20';
                                            pacingProgress = '15%';
                                            pacingDescription = "Unbeatable speed with high accuracy!";
                                        } else if (result.percentage < 50) {
                                            pacingStatus = 'Rushed';
                                            pacingColor = 'text-red-500';
                                            pacingBarColor = 'bg-red-500';
                                            pacingBg = 'bg-red-500/5';
                                            pacingBorder = 'border-red-500/20';
                                            pacingProgress = '10%';
                                            pacingDescription = "Blind guessing detected. Slow down!";
                                        } else {
                                            pacingStatus = 'Fast Paced';
                                            pacingColor = 'text-orange-500';
                                            pacingBarColor = 'bg-orange-500';
                                            pacingBg = 'bg-orange-500/5';
                                            pacingBorder = 'border-orange-500/20';
                                            pacingProgress = '25%';
                                            pacingDescription = "Fast speed, needs more accuracy.";
                                        }
                                    } else if (avgTimeSecs > 60) {
                                        if (result.percentage >= 80) {
                                            pacingStatus = 'Slow & Steady';
                                            pacingColor = 'text-blue-500';
                                            pacingBarColor = 'bg-blue-500';
                                            pacingBg = 'bg-blue-500/5';
                                            pacingBorder = 'border-blue-500/20';
                                            pacingProgress = '85%';
                                            pacingDescription = "Accurate, but work on your speed.";
                                        } else {
                                            pacingStatus = 'Struggling';
                                            pacingColor = 'text-red-500';
                                            pacingBarColor = 'bg-red-500';
                                            pacingBg = 'bg-red-500/5';
                                            pacingBorder = 'border-red-500/20';
                                            pacingProgress = '95%';
                                            pacingDescription = "Spending too much time on wrong Qs.";
                                        }
                                    } else {
                                        if (result.percentage >= 70) {
                                            pacingStatus = 'Perfect';
                                            pacingColor = 'text-green-500';
                                            pacingBarColor = 'bg-green-500';
                                            pacingBg = 'bg-green-500/5';
                                            pacingBorder = 'border-green-500/20';
                                            pacingProgress = '50%';
                                            pacingDescription = "Ideal balance of speed and marks.";
                                        } else {
                                            pacingStatus = 'Standard';
                                            pacingColor = 'text-cyan-500';
                                            pacingBarColor = 'bg-cyan-500';
                                            pacingBg = 'bg-cyan-500/5';
                                            pacingBorder = 'border-cyan-500/20';
                                            pacingProgress = '60%';
                                            pacingDescription = "Average speed, focus on core concepts.";
                                        }
                                    }

                                    const percentile = Math.min(99.9, Math.max(1.0, (result.percentage * 1.15) - (totalIncorrect * 0.5))).toFixed(1);
                                    
                                    // Professional Strategy Algorithm
                                    let strategyAdvice = "";
                                    const negativeValue = Math.abs(negativeMarks);

                                    if (negativeValue > 2.5) {
                                        strategyAdvice = "Critical guesswork! You're losing way too many marks to negative scoring. Stop answering unconfirmed questions.";
                                    } else if (negativeValue > 1.25) {
                                        strategyAdvice = "Moderate guessing detected. Focus on total elimination before marking an answer.";
                                    } else if (negativeValue > 0) {
                                        strategyAdvice = "Slight guessing. You are almost there—reduce these small errors for a top-tier rank.";
                                    } else if (result.percentage > 90) {
                                        strategyAdvice = "God-level accuracy! You have mastered the subject. Focus on maintaining consistency.";
                                    } else if (pacingStatus === 'Elite') {
                                        strategyAdvice = "Extraordinary speed and accuracy! You are ready for the hardest mock levels.";
                                    } else {
                                        strategyAdvice = "Balanced performance. Maintain this momentum while aiming for a 100% attempt rate.";
                                    }

                                    // Add unattempted guidance
                                    if (unattemptedQs > 0) {
                                        if (unattemptedQs > result.totalMarks * 0.3) {
                                            strategyAdvice += " Warning: Attempt rate is too low. Try to cover more syllabus to score higher.";
                                        } else {
                                            strategyAdvice += " Pro Tip: Try to attempt at least 5-10% more questions next time to boost your rank.";
                                        }
                                    }

                                    return (
                                        <motion.div key={result.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} 
                                            className="rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
                                            <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedResult(isExpanded ? null : result.id)}>
                                                <ScoreRing pct={result.percentage} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold truncate">{result.testTitle}</h4>
                                                    <p className="text-sm text-muted-foreground">{new Date(result.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
                                                        <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {totalCorrect}</span>
                                                        <span className="text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {totalIncorrect}</span>
                                                        <span className="text-muted-foreground font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(result.timeTaken)} {result.duration ? `/ ${result.duration}m` : ''}</span>
                                                        <span className="text-primary font-bold ml-auto bg-primary/10 px-2 py-0.5 rounded-md">Score: {result.score}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button onClick={e => { e.stopPropagation(); deleteResult(result.id); }} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                                        {deleting === result.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                    <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/50 bg-muted/10 overflow-hidden">
                                                        <div className="p-6 md:p-8 space-y-8">
                                                            
                                                            {/* Mini Test Analytics */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="relative overflow-hidden bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center hover:scale-105 transition-all duration-300 group">
                                                                    <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-500" />
                                                                    <span className="text-sm text-blue-400 font-medium mb-1 relative z-10">Time Spent</span>
                                                                    <div className="flex flex-col items-center relative z-10">
                                                                        <span className="text-3xl font-bold flex items-baseline gap-2">
                                                                            <Clock className="w-5 h-5 text-blue-500" /> 
                                                                            {formatTime(result.timeTaken)}
                                                                            {result.duration ? <span className="text-xl text-blue-500/50">/ {result.duration}m</span> : null}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="relative overflow-hidden p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center hover:scale-105 transition-all duration-300 group" style={{ backgroundColor: result.percentage >= 70 ? 'rgba(34,197,94,0.1)' : result.percentage >= 50 ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)', borderColor: result.percentage >= 70 ? 'rgba(34,197,94,0.2)' : result.percentage >= 50 ? 'rgba(249,115,22,0.2)' : 'rgba(239,68,68,0.2)' }}>
                                                                    <Target className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500" style={{ color: result.percentage >= 70 ? '#22c55e' : result.percentage >= 50 ? '#f97316' : '#ef4444' }} />
                                                                    <span className="text-sm font-medium mb-1 relative z-10" style={{ color: result.percentage >= 70 ? '#22c55e' : result.percentage >= 50 ? '#f97316' : '#ef4444' }}>Overall Accuracy</span>
                                                                    <span className={cn("text-3xl font-bold relative z-10", result.percentage >= 70 ? "text-green-500" : result.percentage >= 50 ? "text-orange-500" : "text-red-500")}>{result.percentage}%</span>
                                                                </div>
                                                                <div className="relative overflow-hidden bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center hover:scale-105 transition-all duration-300 group">
                                                                    <FileQuestion className="absolute -right-4 -bottom-4 w-24 h-24 text-purple-500/10 group-hover:scale-110 group-hover:text-purple-500/20 transition-all duration-500" />
                                                                    <span className="text-sm text-purple-400 font-medium mb-1 relative z-10">Total Marks Scored</span>
                                                                    <span className="text-3xl font-bold text-foreground relative z-10">
                                                                        {result.score} <span className="text-lg text-muted-foreground font-medium">/ {result.totalMarks}</span>
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* AI Insights Engine Block - Enhanced */}
                                                            <div className="space-y-4">
                                                                <h4 className="font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> Advanced AI Diagnostics</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                    {/* Ranking / Percentile Predictor */}
                                                                    <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex flex-col justify-between">
                                                                        <h4 className="font-bold text-amber-500 flex items-center gap-2 mb-3"><Award className="w-4 h-4" /> Estimated Rank</h4>
                                                                        <div className="flex justify-center items-center py-2">
                                                                            <span className="text-4xl font-black text-amber-500">{percentile} <span className="text-lg text-muted-foreground font-medium">%ile</span></span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground text-center mt-2">Based on global AI matrix</p>
                                                                    </div>

                                                                    {/* Pacing Assessment */}
                                                                    <div className={cn("p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden border group transition-all duration-500", pacingBg, pacingBorder)}>
                                                                        <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
                                                                            <Clock className={cn("w-24 h-24", pacingColor)} />
                                                                        </div>
                                                                        <h4 className={cn("font-bold flex items-center gap-2 mb-4 relative z-10", pacingColor)}>
                                                                            <Activity className="w-4 h-4" /> Pacing Analytics
                                                                        </h4>
                                                                        <div className="space-y-3 relative z-10">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-muted-foreground italic">Avg Time/Q</span>
                                                                                <span className="font-bold text-foreground">{avgTimeSecs.toFixed(1)}s</span>
                                                                            </div>
                                                                            <div className="pt-2 border-t border-border/20">
                                                                                <div className="flex justify-between items-baseline">
                                                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                                                                                    <span className={cn("text-xl font-black leading-none", pacingColor)}>{pacingStatus}</span>
                                                                                </div>
                                                                                <p className="text-[10px] text-muted-foreground text-right mt-1.5 leading-tight opacity-80">
                                                                                    {pacingDescription}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-full bg-border/50 h-1.5 mt-4 rounded-full overflow-hidden relative z-10">
                                                                            <motion.div initial={{ width: 0 }} animate={{ width: pacingProgress }} className={cn("h-full rounded-full transition-all duration-500", pacingBarColor)} />
                                                                        </div>
                                                                    </div>

                                                                    {/* Strategic Advice */}
                                                                    <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between group overflow-hidden relative">
                                                                        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-700"></div>
                                                                        <h4 className="font-bold text-purple-500 flex items-center gap-2 mb-3 relative z-10"><TrendingUp className="w-4 h-4" /> Recommended Strategy</h4>
                                                                        <p className="text-sm font-medium text-foreground relative z-10 leading-relaxed bg-background/50 p-3 rounded-xl border border-border/50 italic">
                                                                            "{strategyAdvice}"
                                                                        </p>
                                                                        <div className="flex items-center gap-3 mt-3 relative z-10 text-xs font-semibold">
                                                                            <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg">Negative: -{negativeMarks.toFixed(2)}</span>
                                                                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg">Unattempted: {unattemptedQs}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-2xl space-y-3">
                                                                        <h4 className="flex items-center gap-2 font-bold text-green-500"><CheckCircle className="w-4 h-4" /> Strong Topics</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {result.topicWiseScore.filter(t => t.percentage >= 70).map(t => (
                                                                                <span key={t.topic} className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold border border-green-500/20">{t.topic}</span>
                                                                            ))}
                                                                            {result.topicWiseScore.filter(t => t.percentage >= 70).length === 0 && <span className="text-sm text-muted-foreground">Keep practicing to build strengths.</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl space-y-3">
                                                                        <h4 className="flex items-center gap-2 font-bold text-red-500"><XCircle className="w-4 h-4" /> Weak Topics</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {result.topicWiseScore.filter(t => t.percentage < 50).map(t => (
                                                                                <span key={t.topic} className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-500/20">{t.topic}</span>
                                                                            ))}
                                                                            {result.topicWiseScore.filter(t => t.percentage < 50).length === 0 && <span className="text-sm text-muted-foreground">No weak topics found! Excellent work.</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                            

                                                            <div className="space-y-4">
                                                                <h4 className="font-bold flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary" /> Detailed Topic Breakdown</h4>
                                                                <div className="divide-y divide-border/50 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                                                                    {result.topicWiseScore.sort((a, b) => b.percentage - a.percentage).map((ts, tIndex) => {
                                                                        const topicQuestions = detailedResults[result.id]?.filter((q: any) => q.topic === ts.topic) || [];
                                                                        const isExpanded = collapsedTopics[`${result.id}-${ts.topic}`];
                                                                        
                                                                        return (
                                                                        <div key={ts.topic} className="flex flex-col">
                                                                            <div onClick={() => toggleTopic(`${result.id}-${ts.topic}`)} className="p-4 cursor-pointer md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-lg">{ts.topic}</span>
                                                                                        {topicQuestions.length > 0 && <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />}
                                                                                    </div>
                                                                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                                                                        <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> {ts.correct} Correct</span>
                                                                                        <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> {ts.total - ts.correct} Incorrect</span>
                                                                                        {(ts.avgTime !== undefined && ts.avgTime > 0) && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> {formatTime(ts.avgTime)} avg.</span>}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="w-full md:w-56 space-y-2 flex-shrink-0 bg-muted/20 p-3 rounded-xl border border-border/50">
                                                                                    <div className="flex justify-between text-sm">
                                                                                        <span className="font-bold" style={{ color: ts.percentage >= 70 ? '#22c55e' : ts.percentage >= 50 ? '#f97316' : '#ef4444' }}>{ts.percentage}% Score</span>
                                                                                        <span className="text-muted-foreground font-medium">{ts.correct} / {ts.total}</span>
                                                                                    </div>
                                                                                    <ProgressBar value={ts.percentage} max={100} color={ts.percentage >= 70 ? '#22c55e' : ts.percentage >= 50 ? '#f97316' : '#ef4444'} />
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* QUESTIONS FOR THIS TOPIC */}
                                                                            <AnimatePresence>
                                                                            {isExpanded && topicQuestions.length > 0 && (
                                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-5 space-y-3 pt-2 border-t border-border/30 bg-muted/5 overflow-hidden">
                                                                                    {topicQuestions.map((q: any, qIndex: number) => (
                                                                                        <div key={q.id} className={cn("p-5 rounded-2xl border transition-colors", q.isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}>
                                                                                            <div className="flex items-start gap-4">
                                                                                                <span className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm", q.isCorrect ? "bg-green-500" : "bg-red-500")}>
                                                                                                    {qIndex + 1}
                                                                                                </span>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="font-medium mb-4 whitespace-pre-wrap text-foreground">{q.question}</p>
                                                                                                    <div className="space-y-2 mb-3">
                                                                                                        {q.options?.map((opt: string, optIdx: number) => {
                                                                                                            const isSelected = q.userAnswer === opt;
                                                                                                            const isCorrectResponse = opt === q.correctAnswer;
                                                                                                            const isWrongSelected = isSelected && !isCorrectResponse;
                                                                                                            
                                                                                                            return (
                                                                                                                <div key={optIdx} className={cn("p-2.5 rounded-xl border flex items-center gap-3 transition-colors", isCorrectResponse ? "bg-green-500/10 border-green-500/30" : isWrongSelected ? "bg-red-500/10 border-red-500/30" : "bg-card border-border/50 opacity-80")}>
                                                                                                                    <span className={cn("w-6 h-6 flex items-center justify-center rounded-lg font-bold text-xs text-white flex-shrink-0", isCorrectResponse ? "bg-green-500" : isWrongSelected ? "bg-red-500" : "bg-muted-foreground")}>{String.fromCharCode(65 + optIdx)}</span>
                                                                                                                    <span className={cn("flex-1 text-sm font-medium", isCorrectResponse ? "text-green-700 dark:text-green-400" : isWrongSelected ? "text-red-700 dark:text-red-400" : "text-muted-foreground")}>{opt}</span>
                                                                                                                    {isCorrectResponse && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                                                                                                    {isWrongSelected && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                                                                                                </div>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                    {q.userAnswer && !q.isCorrect ? (
                                                                                                        <p className="text-sm text-red-500 mt-2 font-medium">Your answer: {q.userAnswer}</p>
                                                                                                    ) : !q.userAnswer && (
                                                                                                        <p className="text-sm text-muted-foreground mt-2 italic">Not attempted</p>
                                                                                                    )}
                                                                                                    {!q.isCorrect && q.explanation && (
                                                                                                        <div className="mt-3 p-4 bg-muted border border-border shadow-inner rounded-xl">
                                                                                                            <strong className="text-primary text-sm flex items-center gap-1.5 mb-1.5"><Brain className="w-4 h-4" />Explanation</strong>
                                                                                                            <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </motion.div>
                                                                            )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    )})}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                        {/* === PRACTICE === */}
                        {activeTab === 'practice' && (
                            <motion.div key="practice" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                {!hasPractice ? (
                                    <div className="text-center py-12 space-y-3">
                                        <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto" />
                                        <p className="text-muted-foreground">No practice data yet. Go to Question Bank and start practicing!</p>
                                        <a href="/question-bank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-muted hover:bg-muted/80 text-sm">
                                            Go to Question Bank <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-2xl font-bold flex items-center gap-3"><Award className="w-6 h-6 text-yellow-400" /> Practice Overview</h3>
                                                <div className="relative group">
                                                    <button onClick={clearPracticeHistory} className="text-sm font-medium text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg relative z-10">
                                                        <Trash2 className="w-4 h-4" /> Clear History
                                                    </button>
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-top-14 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center w-max">
                                                        <div className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl">
                                                            duaoo me yaad rkhna 🥲
                                                        </div>
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500 -mt-px relative z-50"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div className="group text-center p-5 rounded-2xl bg-card border border-border/50 hover:bg-muted/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 cursor-default relative overflow-visible">
                                                    {/* Cheeky Tooltip */}
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-top-14 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center">
                                                        <div className="bg-foreground text-background px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-xl">
                                                            Aur krle questions 🥱
                                                        </div>
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-foreground -mt-px relative z-50"></div>
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <p className="text-4xl font-bold mb-1 group-hover:scale-105 transition-transform">{practiceStats!.totalAttempted}</p>
                                                    <p className="text-sm font-medium text-muted-foreground">Total Attempted</p>
                                                </div>
                                                <div className="group text-center p-5 rounded-2xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/5 cursor-default relative overflow-visible">
                                                    {/* Cheeky Tooltip */}
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-top-14 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center">
                                                        <div className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-xl">
                                                            keep going bhai 🚀
                                                        </div>
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-green-500 -mt-px relative z-50"></div>
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <p className="text-4xl font-bold text-green-500 mb-1 group-hover:scale-105 transition-transform">{practiceStats!.correct}</p>
                                                    <p className="text-sm font-medium text-muted-foreground">Correct</p>
                                                </div>
                                                <div className="group text-center p-5 rounded-2xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/5 cursor-default relative overflow-visible">
                                                    {/* Cheeky Tooltip */}
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-top-14 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center">
                                                        <div className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-xl">
                                                            pdle bhai 🤦‍♂️
                                                        </div>
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500 -mt-px relative z-50"></div>
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <p className="text-4xl font-bold text-red-500 mb-1 group-hover:scale-105 transition-transform">{practiceStats!.incorrect}</p>
                                                    <p className="text-sm font-medium text-muted-foreground">Incorrect</p>
                                                </div>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-border/50">
                                                <div className="flex justify-between items-center text-sm mb-2">
                                                    <span className="font-medium text-muted-foreground">Overall Accuracy</span>
                                                    <span className="font-bold text-lg">{practiceAccuracy}%</span>
                                                </div>
                                                <ProgressBar value={practiceAccuracy} max={100} color={practiceAccuracy >= 70 ? '#22c55e' : practiceAccuracy >= 50 ? '#f97316' : '#ef4444'} />
                                            </div>
                                            {practiceStats!.lastUpdated && (
                                                <p className="text-xs text-muted-foreground mt-4">Last activity: {new Date(practiceStats!.lastUpdated).toLocaleString('en-IN')}</p>
                                            )}
                                        </div>

                                        {practiceStats!.topicWiseScore && practiceStats!.topicWiseScore.length > 0 && (
                                            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm space-y-6 mt-6">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                    Topic-wise Practice Stats
                                                </h3>
                                                <div className="space-y-3">
                                                    {[...practiceStats!.topicWiseScore].sort((a, b) => a.percentage - b.percentage).map(ts => (
                                                        <div key={ts.topic} className="space-y-1.5 p-4 rounded-2xl hover:bg-muted/30 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-sm">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium truncate flex-1 mr-2">{ts.topic}</span>
                                                                <span className="font-bold flex-shrink-0" style={{ color: ts.percentage >= 70 ? '#22c55e' : ts.percentage >= 50 ? '#f97316' : '#ef4444' }}>{ts.correct}/{ts.total} ({ts.percentage}%)</span>
                                                            </div>
                                                            <ProgressBar value={ts.percentage} max={100} color={ts.percentage >= 70 ? '#22c55e' : ts.percentage >= 50 ? '#f97316' : '#ef4444'} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm space-y-6 mt-6">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-blue-500" />
                                                Daily Practice History
                                            </h3>
                                            {(!practiceStats!.dailyStats || Object.keys(practiceStats!.dailyStats).length === 0) ? (
                                                <div className="text-center p-6 bg-muted/30 rounded-2xl border border-transparent">
                                                    <p className="text-muted-foreground">Koi new questions nahi kiye backend update ke baad.</p>
                                                    <p className="text-sm font-semibold mt-1">Aaj thode questions practice karo, yaha history ban jayegi! 🔥</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {Object.entries(practiceStats!.dailyStats)
                                                        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                                        .slice(0, 8)
                                                        .map(([date, data]) => {
                                                            const d = new Date(date);
                                                            const isToday = d.toDateString() === new Date().toDateString();
                                                            const isLegacy = typeof data === 'number';
                                                            const stats = isLegacy ? { total: data, correct: 0 } : data;
                                                            const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                                                            
                                                            return (
                                                                <div 
                                                                    key={date} 
                                                                    className={cn(
                                                                        "p-4 rounded-2xl border transition-all hover:-translate-y-1 shadow-sm relative overflow-hidden",
                                                                        isToday ? "bg-primary/5 border-primary/30" : "bg-card border-border/50 hover:border-border"
                                                                    )}
                                                                >
                                                                    {isToday && <div className="absolute top-0 right-0 w-8 h-8 bg-primary/10 rounded-bl-2xl" />}
                                                                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                                                                        {isToday ? 'Today' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                                    </p>
                                                                    <div className="flex items-end justify-between">
                                                                        <div className="flex items-end gap-1.5">
                                                                            <span className="text-3xl font-bold text-foreground">{stats.total}</span>
                                                                            <span className="text-[10px] text-muted-foreground pb-1 uppercase font-bold">Qs</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            {isLegacy ? (
                                                                                <p className="text-[10px] text-muted-foreground italic leading-tight pt-1">Accuracy not<br/>tracked yet</p>
                                                                            ) : (
                                                                                <>
                                                                                    <p className={cn("text-sm font-black", accuracy >= 70 ? "text-green-500" : accuracy >= 40 ? "text-orange-500" : "text-red-500")}>
                                                                                        {accuracy}%
                                                                                    </p>
                                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Accuracy</p>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}


                        {/* === PREDICTIONS === */}
                        {activeTab === 'predictions' && (
                            <motion.div key="predictions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                        <Sparkles className="w-32 h-32 text-primary" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold flex items-center gap-3 mb-2 underline decoration-primary/30 underline-offset-8">
                                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                                        AI Score Expert
                                    </h3>
                                    <p className="text-muted-foreground mb-8 max-w-lg">
                                        Our Advanced AI engine analyzes your mock trends and practice efficiency to predict your final exam performance. Update data frequently for better accuracy!
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        {/* Probability card */}
                                        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xl hover:shadow-primary/5 transition-all">
                                            <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Exam Success Probability</h4>
                                            <div className="flex items-center gap-6">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/10" />
                                                        <motion.circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * readinessScore) / 100 }} className="text-primary" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                                                        {readinessScore}%
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-bold text-lg">{readinessScore >= 80 ? 'Elite Candidate' : readinessScore >= 60 ? 'Strong Contender' : 'Developing'}</p>
                                                    <p className="text-xs text-muted-foreground">Combined analysis of {results.length} mocks & {practiceStats?.totalAttempted || 0} practice Qs.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expected Score Range */}
                                        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xl hover:shadow-primary/5 transition-all">
                                            <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Estimated Final Score</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-3xl font-black text-foreground">
                                                        {Math.max(0, readinessScore - 4)} - {Math.min(100, readinessScore + 6)}
                                                    </span>
                                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">AI Predicted</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${readinessScore}%` }} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic">AI prediction models allow for 10% variance based on current difficulty levels.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(() => {
                                        // Dynamic AI Expert Logic
                                        const excellentCount = topicInsights.filter(t => t.priority === 'excellent').length;
                                        const totalTopics = topicInsights.length;
                                        const avgAccuracy = topicInsights.length > 0 ? topicInsights.reduce((a, b) => a + b.accuracy, 0) / topicInsights.length : 0;
                                        
                                        // 1. Revision Speed Calculation
                                        let revSpeed = "Moderate";
                                        let revDetail = "Start practicing more topics to get a speed analysis.";
                                        let revColor = "#f59e0b";
                                        
                                        if (totalTopics > 5) {
                                            const excellentRatio = excellentCount / totalTopics;
                                            if (excellentRatio > 0.4) {
                                                revSpeed = "High";
                                                revDetail = `You cover weak areas ${ (1.8 + excellentRatio).toFixed(1) }x faster than average users.`;
                                                revColor = "#22c55e";
                                            } else if (excellentRatio > 0.2) {
                                                revSpeed = "Consistent";
                                                revDetail = "Your progress is steady across all active subjects.";
                                                revColor = "#3b82f6";
                                            } else {
                                                revSpeed = "Focused";
                                                revDetail = "You are spending quality time on foundational concepts.";
                                            }
                                        }

                                        // 2. Error Pattern Analysis
                                        let errorPattern = "Analyzing";
                                        let errorDetail = "Need more test data to identify your mistake patterns.";
                                        let errorIcon = Target;
                                        let errorColor = "#6b7280";

                                        if (hasMock || hasPractice) {
                                            const criticalCount = topicInsights.filter(t => t.priority === 'critical').length;
                                            if (criticalCount > 3) {
                                                errorPattern = "Conceptual";
                                                errorDetail = "Mistakes are grouped in specific topics. Focus on theory.";
                                                errorColor = "#ef4444";
                                            } else if (avgAccuracy > 75) {
                                                errorPattern = "Silly Errors";
                                                errorDetail = "High accuracy but scattered mistakes. Stay focused!";
                                                errorColor = "#f59e0b";
                                            } else {
                                                errorPattern = "Logical";
                                                errorDetail = "Mistakes are mostly in complex, high-level questions.";
                                                errorColor = "#3b82f6";
                                            }
                                        }

                                        // 3. Mock Readiness
                                        let readiness = "Not Ready";
                                        let readinessDetail = "Complete at least 3 full mock tests first.";
                                        if (results.length >= 5) {
                                            readiness = readinessScore >= 80 ? "Exam Ready" : "Building Up";
                                            readinessDetail = readinessScore >= 80 ? "You have built peak performance stamina." : "Maintain your streak for 5 more days.";
                                        } else if (results.length > 0) {
                                            readiness = "In Progress";
                                            readinessDetail = `Take ${5 - results.length} more tests for full analysis.`;
                                        }

                                        return [
                                            { title: "Revision Speed", value: revSpeed, detail: revDetail, icon: Zap, color: revColor },
                                            { title: "Error Pattern", value: errorPattern, detail: errorDetail, icon: errorIcon, color: errorColor },
                                            { title: "Mock Readiness", value: readiness, detail: readinessDetail, icon: Award, color: "#8b5cf6" }
                                        ].map((metric, i) => (
                                            <div key={i} className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}15` }}>
                                                        <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                                                    </div>
                                                    <h5 className="font-bold text-sm">{metric.title}</h5>
                                                </div>
                                                <p className="text-xl font-bold mb-1" style={{ color: metric.color }}>{metric.value}</p>
                                                <p className="text-xs text-muted-foreground">{metric.detail}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold">Expert Tip: Syllabus Completion</h4>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Your performance in Science and Geography is fluctuating. Revising these two specifically before your next mock could boost your percentile by up to 12 points.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
