import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Calendar,
    FileText,
    Play,
    ChevronDown,
    Loader2,
    Trophy,
    Target,
    Clock,
    MapPin,
    ChevronRight,
    X,
    Sparkles,
    Mountain
} from 'lucide-react';
import axios from 'axios';
import { useTestStore } from '../stores/testStore';
import { cn } from '../lib/utils';

interface ExamType {
    id: string;
    name: string;
    years: number[];
}

const API_URL = 'http://localhost:3001/api';

// UK exam IDs
const UK_EXAM_IDS = ['UKPSC', 'UKPSC-PCS', 'UKPSC-ROARO', 'UKSSSC', 'UKSSSC-VDO', 'UKSSSC-Patwari', 'UKSSSC-Forest'];

// Sub-category metadata
const UK_EXAM_META: Record<string, { color: string; gradient: string; badge: string }> = {
    'UKPSC':           { color: 'from-violet-500 to-purple-600',  gradient: 'from-violet-500/10 to-purple-600/10',  badge: 'PCS' },
    'UKPSC-PCS':       { color: 'from-purple-500 to-indigo-600',  gradient: 'from-purple-500/10 to-indigo-600/10',  badge: 'PCS' },
    'UKPSC-ROARO':     { color: 'from-indigo-500 to-blue-600',    gradient: 'from-indigo-500/10 to-blue-600/10',    badge: 'RO/ARO' },
    'UKSSSC':          { color: 'from-cyan-500 to-teal-600',      gradient: 'from-cyan-500/10 to-teal-600/10',      badge: 'SSC' },
    'UKSSSC-VDO':      { color: 'from-teal-500 to-emerald-600',   gradient: 'from-teal-500/10 to-emerald-600/10',   badge: 'VDO' },
    'UKSSSC-Patwari':  { color: 'from-emerald-500 to-green-600',  gradient: 'from-emerald-500/10 to-green-600/10',  badge: 'Patwari' },
    'UKSSSC-Forest':   { color: 'from-green-500 to-lime-600',     gradient: 'from-green-500/10 to-lime-600/10',     badge: 'Forest' },
};

export default function OfficialExams() {
    const [examTypes, setExamTypes] = useState<ExamType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [questionCount, setQuestionCount] = useState(20);
    const [duration, setDuration] = useState(30);
    const [generating, setGenerating] = useState(false);
    const [showUKPanel, setShowUKPanel] = useState(false);

    useTestStore();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchExamTypes() {
            try {
                const response = await axios.get(`${API_URL}/official-questions/exams`);
                setExamTypes(response.data);
            } catch (error) {
                console.error('Failed to fetch exam types:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchExamTypes();
    }, []);

    const handleStartTest = async () => {
        if (!selectedExam) return;
        setGenerating(true);
        try {
            const response = await axios.post(`${API_URL}/tests/generate`, {
                documentIds: [],
                includeOfficial: true,
                examTypes: [selectedExam],
                questionCount,
                duration
            });
            navigate(`/test/${response.data.testId}`);
        } catch (error) {
            console.error('Failed to generate test:', error);
        } finally {
            setGenerating(false);
        }
    };

    const selectExam = (exam: ExamType) => {
        setSelectedExam(exam.id);
        setSelectedYear(exam.years[0]);
    };

    const selectedExamData = examTypes.find(e => e.id === selectedExam);

    const nonUKExams = examTypes.filter(e => !UK_EXAM_IDS.includes(e.id));
    const ukExams = examTypes.filter(e => UK_EXAM_IDS.includes(e.id));
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading exams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-primary" />
                    Official Exams
                </h1>
                <p className="text-muted-foreground">
                    Practice with real questions from previous year official examinations
                </p>
            </div>

            {/* Exam Selection Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {/* Non-UK Exam Cards */}
                {nonUKExams.map((exam, index) => (
                    <motion.button
                        key={exam.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => selectExam(exam)}
                        className={cn(
                            "p-6 rounded-2xl border-2 text-left transition-all duration-200 card-hover",
                            selectedExam === exam.id
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:border-primary/50"
                        )}
                    >
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{exam.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {exam.years.length} years of questions available
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {exam.years.slice(0, 4).map(year => (
                                <span key={year} className="px-2 py-0.5 rounded bg-muted text-xs">
                                    {year}
                                </span>
                            ))}
                            {exam.years.length > 4 && (
                                <span className="px-2 py-0.5 rounded bg-muted text-xs">
                                    +{exam.years.length - 4}
                                </span>
                            )}
                        </div>
                    </motion.button>
                ))}

                {/* UK Exams Parent Card */}
                {ukExams.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: nonUKExams.length * 0.1 }}
                        onClick={() => setShowUKPanel(true)}
                        className={cn(
                            "p-6 rounded-2xl border-2 text-left transition-all duration-200 card-hover relative overflow-hidden group",
                            UK_EXAM_IDS.includes(selectedExam)
                                ? "border-emerald-500 bg-emerald-500/5"
                                : "border-border bg-card hover:border-emerald-500/60"
                        )}
                    >
                        {/* Animated background shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-teal-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Mountain className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Sparkles className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs font-semibold text-emerald-400">{ukExams.length} Exams</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-1">
                                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                    UK Exams
                                </span>
                            </h3>
                            <p className="text-xs font-medium text-emerald-500/80 mb-2">Uttarakhand State Exams</p>
                            <p className="text-sm text-muted-foreground mb-3">
                                UKPSC · UKSSSC &amp; sub-exams
                            </p>

                            <div className="flex flex-wrap gap-1 mb-3">
                                {['UKPSC', 'UKSSSC', 'RO/ARO', 'VDO', 'Forest'].map(tag => (
                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                                <MapPin className="w-3 h-3" />
                                <span>Click to explore all UK exams</span>
                                <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </motion.button>
                )}
            </motion.div>

            {/* UK Exams Popup Panel */}
            <AnimatePresence>
                {showUKPanel && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowUKPanel(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div
                                className="pointer-events-auto w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl shadow-emerald-500/10"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Panel Header */}
                                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md px-6 pt-6 pb-4 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                                <Mountain className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                                    UK Exams
                                                </h2>
                                                <p className="text-sm text-muted-foreground">Uttarakhand State Competitive Examinations</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowUKPanel(false)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Category Tabs */}
                                    <div className="flex gap-3 mt-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                            <div className="w-2 h-2 rounded-full bg-violet-400" />
                                            <span className="text-xs font-semibold text-violet-400">UKPSC Group</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                                            <span className="text-xs font-semibold text-teal-400">UKSSSC Group</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Body */}
                                <div className="p-6 space-y-6">
                                    {/* UKPSC Group */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                                            <h3 className="font-semibold text-sm tracking-wider uppercase text-violet-400">UKPSC Group</h3>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {ukExams.filter(e => e.id.startsWith('UKPSC')).map((exam, index) => {
                                                const meta = UK_EXAM_META[exam.id] || { color: 'from-violet-500 to-purple-600', gradient: 'from-violet-500/10 to-purple-600/10', badge: 'UK' };
                                                const isSelected = selectedExam === exam.id;
                                                return (
                                                    <motion.button
                                                        key={exam.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.06 }}
                                                        onClick={() => {
                                                            selectExam(exam);
                                                            setShowUKPanel(false);
                                                        }}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group",
                                                            isSelected
                                                                ? "border-violet-500 bg-gradient-to-br " + meta.gradient
                                                                : "border-border bg-muted/30 hover:border-violet-500/50"
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0 shadow-md", meta.color)}>
                                                                <GraduationCap className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <h4 className="font-bold text-sm leading-tight">{exam.name}</h4>
                                                                    {isSelected && (
                                                                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500 text-white">Selected</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-2">
                                                                    {exam.years.length} years of questions
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {exam.years.slice(0, 4).map(year => (
                                                                        <span key={year} className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                                                                            {year}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="px-3 bg-card text-xs text-muted-foreground">UKSSSC</span>
                                        </div>
                                    </div>

                                    {/* UKSSSC Group */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600" />
                                            <h3 className="font-semibold text-sm tracking-wider uppercase text-teal-400">UKSSSC Group</h3>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {ukExams.filter(e => e.id.startsWith('UKSSSC')).map((exam, index) => {
                                                const meta = UK_EXAM_META[exam.id] || { color: 'from-teal-500 to-emerald-600', gradient: 'from-teal-500/10 to-emerald-600/10', badge: 'UK' };
                                                const isSelected = selectedExam === exam.id;
                                                return (
                                                    <motion.button
                                                        key={exam.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.06 }}
                                                        onClick={() => {
                                                            selectExam(exam);
                                                            setShowUKPanel(false);
                                                        }}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group",
                                                            isSelected
                                                                ? "border-teal-500 bg-gradient-to-br " + meta.gradient
                                                                : "border-border bg-muted/30 hover:border-teal-500/50"
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0 shadow-md", meta.color)}>
                                                                <GraduationCap className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <h4 className="font-bold text-sm leading-tight">{exam.name}</h4>
                                                                    {isSelected && (
                                                                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-500 text-white">Selected</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-2">
                                                                    {exam.years.length} years of questions
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {exam.years.slice(0, 4).map(year => (
                                                                        <span key={year} className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                                                                            {year}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Configuration Panel */}
            {selectedExam && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-card border border-border space-y-6"
                >
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary" />
                        Configure Your Test
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Year Selection */}
                        {selectedExamData && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Select Year
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedYear || ''}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none cursor-pointer"
                                    >
                                        <option value="">All Years</option>
                                        {selectedExamData.years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Question Count */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <FileText className="w-4 h-4 inline mr-2" />
                                Number of Questions
                            </label>
                            <div className="relative">
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none cursor-pointer"
                                >
                                    <option value={10}>10 Questions</option>
                                    <option value={20}>20 Questions</option>
                                    <option value={30}>30 Questions</option>
                                    <option value={50}>50 Questions</option>
                                    <option value={100}>100 Questions (Full Test)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Test Duration
                            </label>
                            <div className="relative">
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none cursor-pointer"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                    <option value={180}>3 hours</option>
                                    <option value={0}>No time limit</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <span className="text-sm">
                                <strong>{selectedExamData?.name}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">{questionCount} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-green-500" />
                            <span className="text-sm">
                                {duration > 0 ? `${duration} minutes` : 'No time limit'}
                            </span>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStartTest}
                        disabled={generating}
                        className="w-full btn-primary flex items-center justify-center gap-3 text-lg py-4"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Generating Test...
                            </>
                        ) : (
                            <>
                                <Play className="w-6 h-6" />
                                Start Test
                            </>
                        )}
                    </button>
                </motion.div>
            )}

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
            >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    About Official Exam Questions
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        Questions are sourced from actual previous year papers
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        Each question includes detailed explanations and correct answers
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        Practice under exam-like conditions with timed tests
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        Track your performance across different exam types
                    </li>
                </ul>
            </motion.div>
        </div>
    );
}
