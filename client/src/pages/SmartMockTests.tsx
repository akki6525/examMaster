import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Clock,
    Target,
    Zap,
    History,
    ChevronRight,
    Star,
    Sparkles,
    CheckCircle2,
    Calendar,
    ArrowLeft,
    RotateCcw,
    Trophy,
    TrendingUp,
    Play
} from 'lucide-react';
import { useTestStore } from '../stores/testStore';
import axios from 'axios';
import { cn } from '../lib/utils';

interface Pattern {
    id: string;
    name: string;
    questionCount: number;
    duration: number;
}

export default function SmartMockTests() {
    const navigate = useNavigate();
    const { generateSmartTest, isLoading } = useTestStore();
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        axios.get('http://localhost:3001/api/smart-tests/patterns')
            .then(res => setPatterns(res.data))
            .catch(console.error);

        axios.get('http://localhost:3001/api/official-questions/stats')
            .then(res => {
                const sscStats = res.data.examStats.find((s: any) => s.examType === 'SSC CGL');
                setStats(sscStats);
            })
            .catch(console.error);
    }, []);

    const handleGenerate = async () => {
        if (!selectedPattern) return;
        try {
            const testId = await generateSmartTest(selectedPattern, selectedYear || undefined);
            navigate(`/test/${testId}`);
        } catch (error) {
            console.error('Failed to generate test:', error);
        }
    };

    const availableYears = stats?.yearWise ? Object.keys(stats.yearWise).map(Number).sort((a, b) => b - a) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="text-primary font-bold text-sm uppercase tracking-wider">Simulation Mode</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">Smart Mock Tests</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        AI-powered full-length simulations designed for real exam patterns.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <div className="text-right">
                        <p className="text-xs font-bold text-primary uppercase">Current Goal</p>
                        <p className="text-sm font-bold">Crack SSC CGL 2026</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Select Exam Type */}
                    <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            1. Select Exam Pattern
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {patterns.map((p) => (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ y: -4 }}
                                    onClick={() => setSelectedPattern(p.id)}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                                        selectedPattern === p.id
                                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/5"
                                            : "border-border bg-card hover:border-primary/30"
                                    )}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                                selectedPattern === p.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            {selectedPattern === p.id && (
                                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">{p.name}</h4>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1">
                                                <Target className="w-4 h-4" />
                                                {p.questionCount} Questions
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {p.duration} Mins
                                            </span>
                                        </div>
                                    </div>
                                    {/* Decoration */}
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Zap className="w-24 h-24" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Select Year */}
                    <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            2. Specific Year Questions (Optional)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setSelectedYear(null)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl font-bold transition-all border-2",
                                    selectedYear === null
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-card border-border hover:border-primary/30"
                                )}
                            >
                                All Mixed
                            </button>
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl font-bold transition-all border-2",
                                        selectedYear === year
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                            : "bg-card border-border hover:border-primary/30"
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2 italic">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Selecting a year will prioritize PYQs from that specific year.
                        </p>
                    </section>

                    {/* Start Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedPattern || isLoading}
                            className={cn(
                                "w-full py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all duration-500",
                                selectedPattern
                                    ? "bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] hover:-translate-y-1 active:scale-100"
                                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    Generating Simulation...
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6" />
                                    START MOCK TEST NOW
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Sidebar Info */}
                <div className="space-y-6">
                    {/* Insights Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-32 h-32" />
                        </div>
                        
                        <div className="relative z-10">
                            <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                                <Star className="w-6 h-6 text-yellow-300" />
                                Exam Master Tips
                            </h4>
                            <ul className="space-y-4 text-purple-100 font-medium">
                                <li className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                                    <p>The timer will start immediately after you begin.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                                    <p>Section balance is maintained automatically per pattern.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                                    <p>Negative marking (-0.5 per wrong) is active for SSC Pre.</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-card rounded-[2rem] border border-border p-8 shadow-sm">
                        <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Available Question Pool
                        </h4>
                        <div className="space-y-6">
                            {stats?.difficultyBreakdown && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold uppercase tracking-tight">
                                        <span className="text-emerald-500">Easy</span>
                                        <span>{stats.difficultyBreakdown.easy}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
                                    </div>
                                </div>
                            )}
                            {stats?.difficultyBreakdown && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold uppercase tracking-tight">
                                        <span className="text-amber-500">Medium</span>
                                        <span>{stats.difficultyBreakdown.medium}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: '70%' }} />
                                    </div>
                                </div>
                            )}
                            {stats?.difficultyBreakdown && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold uppercase tracking-tight">
                                        <span className="text-red-500">Hard</span>
                                        <span>{stats.difficultyBreakdown.hard}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: '25%' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-border/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{stats?.totalQuestions || 0}</p>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Questions Loaded</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
