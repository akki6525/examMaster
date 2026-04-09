import { useEffect, useState } from 'react';
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
    CheckCircle,
    XCircle,
    Brain,
    Zap
} from 'lucide-react';
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

interface AIInsights {
    predictedScore: number;
    priorityTopic: string;
    studyGoal: string;
    learningStreak: number;
    lastTestDate: string | null;
    totalQuestionsAnswered: number;
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
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

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

        axios.get(`http://localhost:3001/api/ai-insights/dashboard`)
            .then(res => setAiInsights(res.data))
            .catch(console.error);
    }, [fetchDocuments, fetchTests]);

    const accuracy = practiceStats.totalAttempted > 0
        ? Math.round((practiceStats.correct / practiceStats.totalAttempted) * 100)
        : 0;

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
                className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm font-medium">Your Personal Preparation Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        {user ? `Welcome back, ${user.username.charAt(0).toUpperCase() + user.username.slice(1)}!` : 'Welcome to ExamMaster'}
                    </h1>
                    <p className="text-white/80 text-lg max-w-2xl mb-8">
                        Upload your study materials, generate intelligent mock tests, and track your progress.
                        The ultimate tool for serious exam preparation.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg">
                            <Upload className="w-5 h-5" />
                            Upload Documents
                        </Link>
                        <Link to="/question-bank" className="inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300">
                            <Play className="w-5 h-5" />
                            Quick Practice
                        </Link>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl" />
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-20">
                    <BookOpen className="w-64 h-64 text-white" />
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="glass-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group cursor-default"
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-transform duration-500 pointer-events-none">
                            <stat.icon className={`w-32 h-32 ${stat.color}`} />
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-muted/80 backdrop-blur-md flex items-center justify-center mb-5 border border-border/50 shadow-sm relative z-10`}>
                            <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                        <p className="text-4xl font-bold mb-1 relative z-10">{stat.value}</p>
                        <p className="text-muted-foreground font-medium text-sm relative z-10">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* AI Insights Section */}
            {aiInsights && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border border-indigo-500/20 shadow-xl overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Brain className="w-32 h-32 text-indigo-500" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                                {user ? `${user.username.charAt(0).toUpperCase() + user.username.slice(1)}'s AI Insights` : 'AI Smart Recommendations'}
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-background/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                                <Target className="w-6 h-6 text-indigo-500 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground mb-1">Predicted Next Score</p>
                                <p className="text-3xl font-black text-indigo-500">{aiInsights.predictedScore}%</p>
                                <p className="text-[10px] text-muted-foreground mt-2">Based on your last 5 test trends</p>
                            </div>

                            <div className="bg-background/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                                <TrendingUp className="w-6 h-6 text-purple-500 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground mb-1">Priority Focus</p>
                                <p className="text-xl font-bold text-foreground truncate w-full">{aiInsights.priorityTopic}</p>
                                <p className="text-[10px] text-muted-foreground mt-2">Your current weakest section</p>
                            </div>

                            <div className="bg-background/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col items-center text-center">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground mb-1">AI Study Goal</p>
                                <p className="text-base font-bold text-foreground leading-tight">{aiInsights.studyGoal}</p>
                                <div className="mt-auto pt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                    <Clock className="w-3 h-3" /> Recommended Today
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(5, aiInsights.learningStreak))].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-background flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{aiInsights.learningStreak} Day Active Streak!</p>
                                    <p className="text-xs text-muted-foreground">Keep the momentum going to unlock new mock tiers.</p>
                                </div>
                            </div>
                            <Link to="/upload" className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all hover:scale-105">
                                Start Goal
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}



            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -4 }}
                        >
                            <Link
                                to={action.link}
                                className="block p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-md hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl group relative overflow-hidden h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-md`}>
                                    <action.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{action.title}</h3>
                                <p className="text-muted-foreground text-sm mb-6 line-clamp-2">{action.description}</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-sm mt-auto absolute bottom-6">
                                    Get Started
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Recent Documents */}
            {documents.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Recent Documents</h2>
                        <Link to="/upload" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.slice(0, 3).map((doc, index) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.02, x: 4 }}
                                className="p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <FileText className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg truncate mb-1 group-hover:text-primary transition-colors">{doc.fileName}</h4>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                            <span>{doc.topicsCount} topics</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                            <span>{doc.definitionsCount} definitions</span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Tests */}
            {recentResults.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Recent Tests</h2>
                        <Link to="/ai-report?tab=mock" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentResults.slice(0, 3).map((result, index) => (
                            <motion.div
                                key={result.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                whileHover={{ scale: 1.02, x: 4 }}
                                className="p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                        <BarChart3 className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg truncate mb-1 group-hover:text-blue-500 transition-colors">{result.testTitle}</h4>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center justify-between mb-3">
                                            <span>{result.percentage}% Score</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                            <span>{Math.round(result.timeTaken / 60000)} min</span>
                                        </p>
                                        <Link
                                            to={`/ai-report?tab=mock`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl hover:bg-blue-500 hover:text-white text-blue-500 font-bold text-sm transition-all duration-300 w-full justify-center group"
                                        >
                                            View <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

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
