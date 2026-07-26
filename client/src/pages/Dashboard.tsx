import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Upload,
    Play,
    FileText,
    BarChart3,
    Clock,
    Target,
    TrendingUp,
    Layers,
    BookOpen,
    ArrowRight,
    Sparkles,
    GraduationCap,
    Zap,
    ChevronRight
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { useDocumentStore } from '../stores/documentStore';
import { useTestStore } from '../stores/testStore';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';


interface PracticeStats {
    totalAttempted: number;
    correct: number;
    incorrect: number;
    lastUpdated?: string;
}

export default function Dashboard() {
    const { documents, fetchDocuments } = useDocumentStore();
    const { tests, fetchTests } = useTestStore();
    const { user } = useAuthStore();
    const [practiceStats, setPracticeStats] = useState<PracticeStats>({
        totalAttempted: 0,
        correct: 0,
        incorrect: 0
    });
    const [recentResults, setRecentResults] = useState<any[]>([]);

    useEffect(() => {
        fetchDocuments();
        fetchTests();

        axios.get(`http://localhost:3001/api/tests/results`)
            .then(res => setRecentResults(res.data || []))
            .catch(console.error);

        axios.get(`http://localhost:3001/api/practice-stats`)
            .then(res => {
                if (res.data && res.data.totalAttempted !== undefined) {
                    setPracticeStats(res.data);
                }
            })
            .catch(console.error);
    }, [fetchDocuments, fetchTests]);

    const [visibleTestsCount, setVisibleTestsCount] = useState<number>(10);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    const accuracy = practiceStats.totalAttempted > 0
        ? Math.round((practiceStats.correct / practiceStats.totalAttempted) * 100)
        : 0;

    // Process recent results to calculate accuracy by topic over time
    const uniqueTopics = Array.from(
        new Set(
            recentResults.flatMap((r: any) =>
                (r.topicWiseScore || []).map((ts: any) => ts.topic)
            )
        )
    );

    const topicCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        recentResults.forEach((r: any) => {
            (r.topicWiseScore || []).forEach((ts: any) => {
                counts[ts.topic] = (counts[ts.topic] || 0) + 1;
            });
        });
        return counts;
    }, [recentResults]);

    const sortedTopics = useMemo(() => {
        return [...uniqueTopics].sort((a, b) => (topicCounts[b] || 0) - (topicCounts[a] || 0));
    }, [uniqueTopics, topicCounts]);

    // Initialize selectedTopics to top 5 sortedTopics once loaded
    useEffect(() => {
        if (sortedTopics.length > 0 && selectedTopics.length === 0) {
            setSelectedTopics(sortedTopics.slice(0, 5));
        }
    }, [sortedTopics, selectedTopics.length]);

    const processedChartData: any[] = [];
    const lastAccuracyMap: Record<string, number> = {};

    uniqueTopics.forEach(topic => {
        lastAccuracyMap[topic] = 0;
    });

    const reversedResults = [...recentResults].reverse();

    reversedResults.forEach((result: any, index: number) => {
        const date = new Date(result.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        const dataPoint: any = {
            name: `Test ${index + 1}`,
            date: date,
        };

        if (result.topicWiseScore && Array.isArray(result.topicWiseScore)) {
            result.topicWiseScore.forEach((ts: any) => {
                lastAccuracyMap[ts.topic] = ts.percentage ?? 0;
            });
        }

        uniqueTopics.forEach(topic => {
            dataPoint[topic] = lastAccuracyMap[topic];
        });

        processedChartData.push(dataPoint);
    });

    const slicedChartData = useMemo(() => {
        if (visibleTestsCount === 0) return processedChartData;
        return processedChartData.slice(-visibleTestsCount);
    }, [processedChartData, visibleTestsCount]);

    const quickActions = [
        {
            title: 'Upload Documents',
            description: 'Upload PDFs, DOCX, or images',
            icon: Upload,
            link: '/upload',
            gradient: 'from-violet-500 to-purple-500'
        },
        {
            title: 'Official Exams',
            description: 'Practice with real exam questions',
            icon: GraduationCap,
            link: '/official-exams',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Question Bank',
            description: 'Browse all questions by topic',
            icon: FileText,
            link: '/question-bank',
            gradient: 'from-emerald-500 to-teal-500'
        },
        {
            title: 'Smart Mock Tests',
            description: 'AI-generated full-length exam simulations',
            icon: Zap,
            link: '/smart-mock-tests',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            title: 'Flashcards',
            description: 'Quick revision with flashcards',
            icon: Layers,
            link: '/flashcards',
            gradient: 'from-amber-500 to-orange-500'
        }
    ];

    const statCards = [
        { label: 'Documents', value: documents.length, icon: FileText, color: 'text-violet-500' },
        { label: 'Questions Solved', value: practiceStats.totalAttempted, icon: Target, color: 'text-blue-500' },
        { label: 'Accuracy', value: `${accuracy}%`, icon: TrendingUp, color: 'text-emerald-500' },
        { label: 'Tests Taken', value: recentResults.length, icon: Clock, color: 'text-amber-500' }
    ];

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-800 p-8 md:p-12 shadow-[0_20px_50px_rgba(99,102,241,0.2)] border border-white/20"
            >
                {/* Glowing decorative backdrop orbs */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 animate-pulse-glow" style={{ animationDuration: '6s' }} />
                <div className="absolute -left-10 -bottom-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl transform -translate-x-10 translate-y-10 animate-pulse-glow" style={{ animationDuration: '8s' }} />
                <div className="absolute right-1/4 bottom-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: '5s' }} />

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 animate-pulse">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span className="text-white/90 text-[10px] font-black uppercase tracking-wider">Your Practice Dashboard</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        {user ? (
                            <>Welcome back, <span className="underline decoration-yellow-400 decoration-wavy underline-offset-4">{user.username.charAt(0).toUpperCase() + user.username.slice(1)}</span>!</>
                        ) : 'Welcome to ExamMaster'}
                    </h1>
                    <p className="text-white/80 text-base md:text-lg font-medium leading-relaxed mb-8">
                        Upload your study materials, generate intelligent mock tests, and master any concept in minutes. Track your strengths and target your improvement areas.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-purple-600 font-extrabold px-6 py-3.5 rounded-2xl hover:bg-white/95 transition-all duration-300 shadow-xl shadow-indigo-950/20 hover:scale-103 active:scale-98">
                            <Upload className="w-5 h-5" />
                            Upload Documents
                        </Link>
                        <Link to="/question-bank" className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 backdrop-blur-sm font-extrabold px-6 py-3.5 rounded-2xl hover:bg-white/25 transition-all duration-300 hover:scale-103 active:scale-98">
                            <Play className="w-5 h-5 fill-current text-white" />
                            Quick Practice
                        </Link>
                    </div>
                </div>

                <div className="absolute right-8 bottom-8 hidden lg:block opacity-10 hover:opacity-20 transition-opacity duration-300">
                    <BookOpen className="w-56 h-56 text-white" />
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="relative overflow-hidden p-6 rounded-[2rem] bg-card/45 backdrop-blur-md border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-default"
                    >
                        {/* Soft ambient background tint */}
                        <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-transform duration-500 pointer-events-none">
                            <stat.icon className={`w-36 h-36 ${stat.color}`} />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                            <div className="w-8 h-8 rounded-xl bg-muted/80 backdrop-blur-md flex items-center justify-center border border-border/50 shadow-sm">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-baseline gap-1.5 mt-2">
                            <span className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-foreground">{stat.value}</span>
                        </div>
                    </motion.div>
                ))}
            </div>



            {/* Topic Accuracy Over Time Chart */}
            {recentResults.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-6 md:p-8 rounded-[2rem] border border-border bg-card/45 backdrop-blur-md shadow-lg space-y-6"
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                <h3 className="font-extrabold text-xl">Topic Accuracy Over Time</h3>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Track your mock test performance trend across different subjects
                            </p>
                        </div>
                        {uniqueTopics.length > 0 && (
                            <div className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-xl border border-indigo-500/10 flex items-center gap-1.5 self-start sm:self-center">
                                <Layers className="w-3.5 h-3.5" />
                                {uniqueTopics.length} Topics Active
                            </div>
                        )}
                    </div>

                    {/* Filter & Range Selector controls */}
                    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                        {/* Range Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Range:</span>
                                {[5, 10, 20, 0].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setVisibleTestsCount(num)}
                                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${visibleTestsCount === num
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-background/50 text-muted-foreground border-transparent hover:bg-background"
                                            }`}
                                    >
                                        {num === 0 ? "All Tests" : `Last ${num}`}
                                    </button>
                                ))}
                            </div>

                            {/* Fast Select shortcuts */}
                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTopics(sortedTopics.slice(0, 5))}
                                    className="hover:underline"
                                >
                                    Reset to Top 5
                                </button>
                                <span className="opacity-40">•</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTopics([])}
                                    className="hover:underline"
                                >
                                    Clear All
                                </button>
                                <span className="opacity-40">•</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTopics(uniqueTopics)}
                                    className="hover:underline"
                                >
                                    Select All
                                </button>
                            </div>
                        </div>

                        {/* Topics Pill checkbox picker */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                Plotting Topics (Select to toggle lines):
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                                {sortedTopics.map((topic, i) => {
                                    const isSelected = selectedTopics.includes(topic);
                                    const topicColors = [
                                        '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1'
                                    ];
                                    const color = topicColors[i % topicColors.length];
                                    return (
                                        <button
                                            key={topic}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedTopics(selectedTopics.filter(t => t !== topic));
                                                } else {
                                                    setSelectedTopics([...selectedTopics, topic]);
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-xl transition-all border ${isSelected
                                                    ? "text-white border-transparent"
                                                    : "bg-background/40 text-muted-foreground border-transparent hover:bg-background/80"
                                                }`}
                                            style={isSelected ? { backgroundColor: color } : {}}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : ""}`} style={!isSelected ? { backgroundColor: color } : {}} />
                                            {topic}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Chart area */}
                    <div className="w-full h-80 min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={slicedChartData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.15)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={11}
                                    fontWeight={600}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    interval={Math.max(0, Math.ceil(slicedChartData.length / 10) - 1)}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={11}
                                    fontWeight={600}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border) / 0.8)',
                                        borderRadius: '1.25rem',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(8px)',
                                        color: 'hsl(var(--foreground))',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                    cursor={{ stroke: 'hsl(var(--primary) / 0.15)', strokeWidth: 2 }}
                                    formatter={(value) => [`${value}% Accuracy`]}
                                />
                                {selectedTopics.length > 0 && (
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            paddingTop: '20px'
                                        }}
                                    />
                                )}
                                {sortedTopics.map((topic, i) => {
                                    if (!selectedTopics.includes(topic)) return null;
                                    const topicColors = [
                                        '#8b5cf6', // Violet
                                        '#3b82f6', // Blue
                                        '#10b981', // Emerald
                                        '#f59e0b', // Amber
                                        '#ef4444', // Red
                                        '#ec4899', // Pink
                                        '#06b6d4', // Cyan
                                        '#6366f1', // Indigo
                                    ];
                                    const color = topicColors[i % topicColors.length];
                                    return (
                                        <Line
                                            key={topic}
                                            type="monotone"
                                            dataKey={topic}
                                            name={topic}
                                            stroke={color}
                                            strokeWidth={3}
                                            dot={slicedChartData.length < 25 ? { r: 3.5, strokeWidth: 1.5 } : false}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -4 }}
                            className="h-full"
                        >
                            <Link
                                to={action.link}
                                className="block p-6 rounded-3xl border border-border bg-card/45 backdrop-blur-md hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl group relative overflow-hidden h-full flex flex-col justify-between"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                                <div>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300 shadow-md`}>
                                        <action.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors leading-tight">{action.title}</h3>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed mb-6 font-medium line-clamp-2">{action.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-wider mt-auto pt-2">
                                    Get Started
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Recent Documents & Tests Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Documents */}
                {documents.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" />
                                Recent Documents
                            </h2>
                            <Link to="/upload" className="text-primary text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {documents.slice(0, 3).map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    whileHover={{ x: 4 }}
                                    className="p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-card/90 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="w-6 h-6 text-primary group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-sm text-foreground truncate mb-0.5 group-hover:text-primary transition-colors">{doc.fileName}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                                    <span>{doc.topicsCount} Topics</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span>{doc.definitionsCount} Definitions</span>
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-1 group-hover:text-primary transition-all flex-shrink-0" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Tests */}
                {recentResults.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                Recent Tests
                            </h2>
                            <Link to="/ai-report?tab=mock" className="text-primary text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentResults.slice(0, 3).map((result, index) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    whileHover={{ x: -4 }}
                                    className="p-5 rounded-2xl border border-border/60 bg-card hover:border-blue-500/30 hover:bg-card/90 transition-all duration-300 group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                                <BarChart3 className="w-6 h-6 text-blue-500 group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-sm text-foreground truncate mb-0.5 group-hover:text-blue-500 transition-colors">{result.testTitle}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                                    <span className="text-blue-500 font-extrabold">{result.percentage}% Score</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span>{Math.round(result.timeTaken / 60000)} Min</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/ai-report?tab=mock`}
                                            className="px-3 py-1.5 bg-muted/65 hover:bg-blue-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider text-blue-500 transition-all flex items-center gap-1 group/btn"
                                        >
                                            View
                                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {documents.length === 0 && tests.length === 0 && practiceStats.totalAttempted === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Get Started with ExamMaster</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Upload your study materials to generate smart mock tests, or practice with official exam questions.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Upload Documents
                        </Link>
                        <Link to="/official-exams" className="btn-secondary inline-flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            Official Exams
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
