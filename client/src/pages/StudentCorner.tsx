import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
    Plus,
    Target,
    Edit2,
    Trash2,
    CheckCircle2,
    Sparkles,
    Trophy,
    Rocket,
    Clock,
    X,
    Zap,
    Lightbulb,
    ChevronDown,
    Search,
    BookOpen,
    Brain,
    User,
    Flame,
    Quote,
    Award,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

// --- Types ---
interface Milestone {
    id: string;
    text: string;
    completed: boolean;
}

interface Dream {
    id: string;
    userId: string;
    title: string;
    targetYear: string;
    targetDate?: string;
    description: string;
    isAchieved: boolean;
    progress: number;
    createdAt: number;
    emoji?: string;
    milestones?: Milestone[];
}

const POST_OPTIONS = [
    { value: "DM", label: "DM (District Magistrate)", category: "UPSC" },
    { value: "SDM", label: "SDM (Sub-Divisional Magistrate)", category: "PCS" },
    { value: "SSC-CGL", label: "SSC-CGL", category: "SSC" },
    { value: "SSC-CHSL", label: "SSC-CHSL", category: "SSC" },
    { value: "CPO", label: "SSC-CPO (Police)", category: "SSC" },
    { value: "UKPCS-Tehsildar", label: "UKPCS-Tehsildar", category: "UKPCS" },
    { value: "UKSSSC", label: "UKSSSC", category: "UK-State" },
    { value: "UK-RO-ARO", label: "UK-RO-ARO", category: "UK-State" },
    { value: "BANK-PO", label: "Bank PO (IBPS/SBI)", category: "Banking" },
    { value: "BANK-CLERK", label: "Bank Clerk", category: "Banking" },
    { value: "DEFENSE", label: "Defense Services (NDA/CDS/AFCAT)", category: "Defense" }
];

const DEFAULT_MILESTONES: Record<string, string[]> = {
    UPSC: [
        "Syllabus & Standard Reference Books (NCERTs)",
        "Daily Editorial Analysis & Answer Writing",
        "GS Papers Study & Revision Notes",
        "Take 5 Prelims Full length Mocks"
    ],
    PCS: [
        "State History & Geography Syllabus Completion",
        "Targeted General Studies Preparation",
        "Practice Answer Writing & Language Papers",
        "Solve Previous Year Papers & Full Mocks"
    ],
    UKPCS: [
        "Uttarakhand GK & Administrative Syllabus",
        "Standard UPSC Foundation Subject Books",
        "Daily Answer Writing & Essay Practice",
        "Mock Tests & State-Specific Current Affairs"
    ],
    "UK-State": [
        "Uttarakhand State GK & GS syllabus rules",
        "Solve 10 Previous Year Papers",
        "Topic-wise MCQs practice (Hindi & GK)",
        "Take 5 Mock Tests for speed"
    ],
    SSC: [
        "Complete Syllabus of Quant, Reasoning & English",
        "Practice 100 Objective Questions Daily",
        "Previous Year Questions (PYQs) analysis",
        "Take 10 Full Length Mock Tests"
    ],
    Banking: [
        "Concepts of Puzzles & DI (Data Interpretation)",
        "Timer-based quizzes (Quantitative/Reasoning)",
        "Weekly General & Banking Awareness reading",
        "Complete 10 Prelims & 5 Mains Mock Tests"
    ],
    Defense: [
        "CDS/NDA Written Exam Topic Prep",
        "SSB Interview personality/screening practice",
        "Physical Fitness routine & daily training",
        "Mock Tests and Current Affairs analysis"
    ],
    General: [
        "Understand exam syllabus & acquire key materials",
        "Consistent daily topic study (3-4 hours)",
        "Weekly revision & subject wise quizzes",
        "Take full-length simulated mock tests"
    ]
};

const getDreamCategory = (title: string) => {
    const found = POST_OPTIONS.find(opt => opt.value === title);
    return found ? found.category : "General";
};

const getDefaultMilestones = (title: string): Milestone[] => {
    if (!title) return [];
    const category = getDreamCategory(title);
    const texts = DEFAULT_MILESTONES[category] || DEFAULT_MILESTONES["General"];
    return texts.map((text, index) => ({
        id: `m_${Date.now()}_${index}`,
        text,
        completed: false
    }));
};

const SHAYARIS = [
    "Manzil unhi ko milti hai, jinke sapno mein jaan hoti hai. Pankh se kuch nahi hota, hauslon se udaan hoti hai. ✨",
    "Abhi to asli udaan baaki hai, parinde ka imtihan baaki hai. Abhi abhi langha hai samundaron ko, abhi pura aasman baaki hai. 🚀",
    "Mehnat itni khamoshi se karo ki kamyabi shor macha de. 🤫",
    "Koshish karne walon ki kabhi haar nahi hoti, lehron se darr kar nauka paar nahi hoti. 🌊",
    "Sabar rakh bande, musibat ke din bhi guzar jayenge, aaj jo tum par haste hain, kal unke hosh udd jayenge. 🔥",
    "Waqt aane de bataenge tujhe ae aasmaan, hum abhi se kya bataen kya humare dil mein hai. ⚔️",
    "Khudi ko kar buland itna ki har taqdeer se pehle, khuda bande se khud pooche bata teri raza kya hai. 👑"
];

const MOTIVATIONS = [
    "You are your only limit. Break the barrier today. ⚡",
    "Consistency is better than perfection. Keep going. 📈",
    "Your goals don't care how you feel. Show up and dominate. 🥊",
    "Success isn't owned, it's leased. And rent is due every single day. 🏃‍♂️",
    "Don't wish for it. Work for it. 💼",
    "The pain of discipline is nothing compared to the pain of regret. 🧠",
    "Great things take time. Stay patient, stay focus, stay hungry. 🦁"
];

const getAISuggestion = (post: string, progress: number) => {
    let focus = "";
    let action = "";
    if (post.includes("DM") || post.includes("SDM")) { focus = "Focus on Answer Writing and Ethics."; action = "Analyze daily editorials."; }
    else if (post.includes("SSC")) { focus = "Focus on Quant Speed."; action = "Practice 100 MCQs daily."; }
    else if (post.includes("BANK")) { focus = "Focus on Puzzles."; action = "Timer-based practice."; }
    else if (post.includes("DEFENSE")) { focus = "Focus on GK and SSB."; action = "Physical training daily."; }
    else { focus = "Focus on basics."; action = "Read foundational NCERTs."; }

    if (progress === 100) return { title: "Bravo! 🏆", body: "Goal Achieved. Fuel for your next mission." };
    if (progress > 80) return { title: "Peak Performance 📈", body: `${focus} Start full-length mocks.` };
    return { title: "Momentum Phase 🚀", body: `${focus} ${action}` };
};

const WORD_CLOUD_ITEMS = [
    { word: "LOVE", x: 50, y: 36, size: "text-6xl md:text-8xl", weight: "font-black", color: "text-rose-500 dark:text-rose-400", rotateVal: 0 },
    { word: "WORK", x: 48, y: 55, size: "text-5xl md:text-7xl", weight: "font-black", color: "text-indigo-500 dark:text-indigo-400", rotateVal: 0 },
    { word: "Motivation", x: 50, y: 70, size: "text-4xl md:text-5xl", weight: "font-bold", color: "text-amber-500 dark:text-amber-400", rotateVal: 0 },
    { word: "Happiness", x: 50, y: 82, size: "text-3xl md:text-4xl", weight: "font-bold", color: "text-lime-500 dark:text-lime-400", rotateVal: 0 },
    { word: "Idea", x: 30, y: 15, size: "text-4xl md:text-5xl", weight: "font-bold", color: "text-blue-500 dark:text-blue-400", rotateVal: 0 },
    { word: "Do", x: 50, y: 14, size: "text-5xl md:text-7xl", weight: "font-black", color: "text-emerald-500 dark:text-emerald-400", rotateVal: -90 },
    { word: "Mindset", x: 70, y: 15, size: "text-3xl md:text-4xl", weight: "font-black", color: "text-violet-500 dark:text-violet-400", rotateVal: 0 },
    { word: "Positivity", x: 64, y: 26, size: "text-3xl md:text-4xl", weight: "font-bold", color: "text-pink-500 dark:text-pink-400", rotateVal: 0 },
    { word: "Joy", x: 35, y: 26, size: "text-4xl md:text-6xl", weight: "font-black", color: "text-yellow-500 dark:text-yellow-400", rotateVal: 12 },
    { word: "Dream", x: 56, y: 24, size: "text-2xl md:text-3xl", weight: "font-bold", color: "text-purple-500 dark:text-purple-400", rotateVal: 0 },
    { word: "Success", x: 78, y: 22, size: "text-2xl md:text-3xl", weight: "font-bold", color: "text-teal-500 dark:text-teal-400", rotateVal: 45 },
    { word: "Inspirational", x: 18, y: 35, size: "text-2xl md:text-3xl", weight: "font-bold", color: "text-orange-500 dark:text-orange-400", rotateVal: -90 },
    { word: "Job", x: 80, y: 33, size: "text-3xl md:text-5xl", weight: "font-black", color: "text-cyan-500 dark:text-cyan-400", rotateVal: 0 },
    { word: "Attitude", x: 81, y: 55, size: "text-3xl md:text-4xl", weight: "font-black", color: "text-rose-500 dark:text-rose-400", rotateVal: 90 },
    { word: "Personal", x: 15, y: 58, size: "text-2xl md:text-3xl", weight: "font-bold", color: "text-sky-500 dark:text-sky-400", rotateVal: -90 },
    { word: "Creative", x: 28, y: 64, size: "text-2xl md:text-3.5xl", weight: "font-bold", color: "text-orange-600 dark:text-orange-500", rotateVal: -12 },
    { word: "Confidence", x: 70, y: 68, size: "text-2.5xl md:text-3.5xl", weight: "font-semibold", color: "text-fuchsia-500 dark:text-fuchsia-400", rotateVal: 0 },
    { word: "Decision", x: 32, y: 76, size: "text-2xl md:text-3xl", weight: "font-semibold", color: "text-slate-500 dark:text-slate-400", rotateVal: 0 },
    { word: "Focus", x: 32, y: 44, size: "text-3xl md:text-4xl", weight: "font-black", color: "text-indigo-600 dark:text-indigo-500", rotateVal: 0 },
    { word: "Believe", x: 68, y: 44, size: "text-3xl md:text-4xl", weight: "font-black", color: "text-purple-600 dark:text-purple-500", rotateVal: 0 },
    { word: "Encouragement", x: 35, y: 52, size: "text-lg md:text-xl", weight: "font-medium", color: "text-emerald-600 dark:text-emerald-500", rotateVal: 0 },
    { word: "Growth", x: 64, y: 52, size: "text-2xl md:text-3xl", weight: "font-bold", color: "text-amber-600 dark:text-amber-500", rotateVal: 0 }
];

export default function StudentCorner() {
    const { user } = useAuthStore();
    const { width, height } = useWindowSize();
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [activeAISuggestion, setActiveAISuggestion] = useState<{ title: string, body: string } | null>(null);
    const [editingDream, setEditingDream] = useState<Dream | null>(null);

    // Premium UI States
    const [showConfetti, setShowConfetti] = useState(false);
    const [showCelebrationOverlay, setShowCelebrationOverlay] = useState(false);
    const [deletingGoal, setDeletingGoal] = useState<Dream | null>(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

    // Daily Logic
    const dailyIndex = new Date().getDate() % SHAYARIS.length;
    const dailyShayari = SHAYARIS[dailyIndex];
    const dailyMotivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

    // Form states
    const [title, setTitle] = useState("");
    const [targetYear, setTargetYear] = useState("2026");
    const [targetDate, setTargetDate] = useState("");
    const [description, setDescription] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("🎯");
    const [formMilestones, setFormMilestones] = useState<Milestone[]>([]);

    const filterCategories = useMemo(() => {
        return ['ALL', ...Array.from(new Set(POST_OPTIONS.map(opt => opt.category)))];
    }, []);

    const filteredDreams = useMemo(() => {
        if (selectedCategoryFilter === 'ALL') return dreams;
        return dreams.filter(d => {
            const option = POST_OPTIONS.find(opt => opt.value === d.title);
            return option?.category === selectedCategoryFilter;
        });
    }, [dreams, selectedCategoryFilter]);

    useEffect(() => {
        const userId = user?.username || "guest";
        const savedDreams = localStorage.getItem(`dreams_${userId}`);
        if (savedDreams) {
            let parsed = JSON.parse(savedDreams) as Dream[];
            let migrated = false;
            parsed = parsed.map(d => {
                if (!d.targetDate) {
                    migrated = true;
                    // Fallback to end of the targetYear
                    d.targetDate = `${d.targetYear || "2026"}-12-31`;
                }
                if (!d.milestones || d.milestones.length === 0) {
                    migrated = true;
                    const defaultTexts = DEFAULT_MILESTONES[getDreamCategory(d.title)] || DEFAULT_MILESTONES["General"];
                    const milestones = defaultTexts.map((text, idx) => ({
                        id: `m_${d.id}_${idx}`,
                        text,
                        completed: d.isAchieved
                    }));
                    return { ...d, milestones, progress: d.isAchieved ? 100 : d.progress };
                }
                return d;
            });
            if (migrated) {
                localStorage.setItem(`dreams_${userId}`, JSON.stringify(parsed));
            }
            setDreams(parsed);
        }
    }, [user]);

    const saveDreams = (updatedDreams: Dream[]) => {
        const userId = user?.username || "guest";
        localStorage.setItem(`dreams_${userId}`, JSON.stringify(updatedDreams));
        setDreams(updatedDreams);
    };

    const handleOpenModal = (dream?: Dream) => {
        if (dream) {
            setEditingDream(dream);
            setTitle(dream.title);
            setTargetYear(dream.targetYear);
            setTargetDate(dream.targetDate || "");
            setDescription(dream.description);
            setSelectedEmoji(dream.emoji || "🎯");
            setFormMilestones(dream.milestones || []);
        } else {
            setEditingDream(null);
            setTitle("");
            setTargetYear("2026");
            setTargetDate("");
            setDescription("");
            setSelectedEmoji("🎯");
            setFormMilestones([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDream(null);
        setTitle("");
        setTargetYear("2026");
        setTargetDate("");
        setDescription("");
        setSelectedEmoji("🎯");
        setFormMilestones([]);
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (!editingDream || !editingDream.milestones || editingDream.milestones.length === 0) {
            setFormMilestones(getDefaultMilestones(newTitle));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const total = formMilestones.length;
        const completed = formMilestones.filter(m => m.completed).length;
        const calculatedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const dreamData = {
            title,
            targetYear,
            targetDate,
            description,
            emoji: selectedEmoji,
            userId: user?.username || "guest",
            isAchieved: editingDream ? (calculatedProgress === 100 ? true : editingDream.isAchieved) : (calculatedProgress === 100),
            progress: calculatedProgress,
            createdAt: editingDream ? editingDream.createdAt : Date.now(),
            milestones: formMilestones
        };

        let updatedDreams: Dream[];
        if (editingDream) {
            updatedDreams = dreams.map(d => d.id === editingDream.id ? { ...d, ...dreamData } : d);
        } else {
            const newDream: Dream = {
                ...dreamData,
                id: Math.random().toString(36).substr(2, 9),
            };
            updatedDreams = [newDream, ...dreams];
        }

        saveDreams(updatedDreams);

        // Reset and close
        setTitle("");
        setTargetYear("2026");
        setDescription("");
        setSelectedEmoji("🎯");
        setFormMilestones([]);
        setEditingDream(null);
        setIsModalOpen(false);
    };

    const handleToggleMilestone = (dreamId: string, milestoneId: string) => {
        const updated = dreams.map(d => {
            if (d.id === dreamId) {
                const milestones = (d.milestones || []).map(m =>
                    m.id === milestoneId ? { ...m, completed: !m.completed } : m
                );
                const total = milestones.length;
                const completed = milestones.filter(m => m.completed).length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isAchieved = progress === 100;
                return {
                    ...d,
                    milestones,
                    progress,
                    isAchieved
                };
            }
            return d;
        });

        saveDreams(updated);

        const prevDream = dreams.find(d => d.id === dreamId);
        const nextDream = updated.find(d => d.id === dreamId);
        if (prevDream && nextDream && !prevDream.isAchieved && nextDream.isAchieved) {
            handleAchieve(dreamId);
        }
    };

    const handleAchieve = (dreamId: string) => {
        const dream = dreams.find(d => d.id === dreamId);
        if (!dream || dream.isAchieved) return;

        // --- Premium Celebration Effects ---
        // 1. Victory Sound Effect
        const victorySound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        victorySound.volume = 0.5;
        victorySound.play().catch(e => console.log("Audio play blocked by browser", e));

        // 2. High-Energy Voice Announcement
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Congratulations!");
            utterance.rate = 1.1;
            utterance.pitch = 1.3; // Higher pitch for "effect" vibe
            window.speechSynthesis.speak(utterance);
        }

        // Start Celebration
        setShowConfetti(true);
        setShowCelebrationOverlay(true);

        setTimeout(() => {
            setShowConfetti(false);
            setShowCelebrationOverlay(false);
            const updated = dreams.map(d => {
                if (d.id === dreamId) {
                    const completedMilestones = (d.milestones || []).map(m => ({ ...m, completed: true }));
                    return { ...d, isAchieved: true, progress: 100, milestones: completedMilestones };
                }
                return d;
            });
            saveDreams(updated);
        }, 4000);
    };

    const handleDelete = () => {
        if (!deletingGoal) return;
        const updated = dreams.filter(d => d.id !== deletingGoal.id);
        saveDreams(updated);
        setDeletingGoal(null);
    };

    const stats = useMemo(() => ({
        total: dreams.length,
        achieved: dreams.filter(d => d.isAchieved).length,
        avgProgress: dreams.length ? Math.round(dreams.reduce((acc, d) => acc + d.progress, 0) / dreams.length) : 0
    }), [dreams]);

    return (
        <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pb-12 bg-gradient-to-b from-slate-50/40 via-background to-slate-100/30 dark:from-slate-950/40 dark:via-background dark:to-black/40">
            {/* Motivational Grid Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60 dark:opacity-85" />
            
            {/* Ambient Motivational Beams of Light */}
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/15 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none -top-40 -left-40 animate-pulse-glow" style={{ animationDuration: '10s' }} />
            <div className="absolute w-[450px] h-[450px] bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none top-1/2 right-10 animate-pulse-glow" style={{ animationDuration: '14s' }} />
            
            {/* Watermark Quote of Power in the background */}
            <div className="absolute top-24 right-10 tracking-[0.25em] text-[11vw] font-black uppercase text-slate-400/[0.04] dark:text-white/[0.02] pointer-events-none select-none font-sans leading-none z-0">
                FOCUS
            </div>
            
            <div className="absolute bottom-24 left-10 tracking-[0.2em] text-[10vw] font-black uppercase text-slate-400/[0.03] dark:text-white/[0.015] pointer-events-none select-none font-sans leading-none z-0">
                BELIEVE
            </div>

            {/* Aesthetic Word-Cloud Heart Background */}
            <div className="absolute inset-x-0 top-10 bottom-10 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                <div className="relative w-full max-w-[650px] aspect-[4/5] md:aspect-square mx-auto">
                    {WORD_CLOUD_ITEMS.map((item, i) => (
                        <motion.div
                            key={i}
                            className={cn(
                                "absolute font-sans select-none pointer-events-none transition-colors duration-500 hover:scale-110 opacity-[0.06] dark:opacity-[0.035]",
                                item.size,
                                item.weight,
                                item.color
                            )}
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                transformOrigin: 'center center',
                            }}
                            animate={{
                                y: [0, -8 - (i % 3) * 3, 0],
                                rotate: [item.rotateVal, item.rotateVal - 1 + (i % 3), item.rotateVal]
                            }}
                            transition={{
                                duration: 8 + (i % 4) * 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: (i % 7) * 0.4
                            }}
                        >
                            {item.word}
                        </motion.div>
                    ))}
                    
                    {/* Floating sparks / glowing dots inside/around the heart */}
                    {[...Array(16)].map((_, idx) => {
                        const angle = (idx / 16) * Math.PI * 2;
                        const x = 50 + 32 * Math.pow(Math.sin(angle), 3);
                        // Heart equation scaled and adjusted
                        const y = 45 - 28 * (13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle)) / 16;
                        return (
                            <motion.div
                                key={`spark-${idx}`}
                                className={cn(
                                    "absolute rounded-full blur-[1px]",
                                    idx % 3 === 0 ? "w-1.5 h-1.5 bg-amber-400/25" : idx % 3 === 1 ? "w-2 h-2 bg-pink-400/25" : "w-1 h-1 bg-indigo-400/25"
                                )}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                }}
                                animate={{
                                    scale: [0.8, 1.4, 0.8],
                                    opacity: [0.2, 0.7, 0.2],
                                    y: [0, -12, 0]
                                }}
                                transition={{
                                    duration: 4 + (idx % 3) * 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: idx * 0.25
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} gravity={0.15} colors={['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']} />}

            <AnimatePresence>
                {showCelebrationOverlay && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
                    >
                        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-primary/20 text-center space-y-6 max-w-sm mx-4">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
                            >
                                <Trophy className="w-12 h-12 text-white" />
                            </motion.div>
                            <div>
                                <h2 className="text-3xl font-black text-primary">Congratulations! 🎉</h2>
                                <p className="text-lg font-bold text-muted-foreground mt-2">You achieved your goal.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn("max-w-6xl mx-auto space-y-6 pb-12 px-4 transition-all duration-500 relative z-10", showCelebrationOverlay && "blur-sm pointer-events-none")}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-950 p-8 md:p-10 text-white shadow-2xl border border-white/10 ring-1 ring-white/5">
                    {/* Ambient Glow Orbs */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse-glow" style={{ animationDelay: '0s' }} />
                    <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-pulse-glow" style={{ animationDelay: '2s' }} />
                    <div className="absolute -top-10 left-10 w-60 h-60 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse-glow" style={{ animationDelay: '4s' }} />

                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"><User className="w-6 h-6 text-white" /></div>
                                <div>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Aspirant Profile</p>
                                    <h1 className="text-2xl md:text-3xl font-black">{user?.username || 'Future Officer'}'s Arena</h1>
                                </div>
                            </div>
                            
                            {/* Premium Glow Shayari Marquee Card */}
                            <div className="relative overflow-hidden bg-black/30 backdrop-blur-md p-5 rounded-3xl border border-yellow-500/20 space-y-2 mt-2 w-full shadow-[0_0_20px_rgba(234,179,8,0.02)]">
                                <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-purple-900/90 to-transparent pointer-events-none z-10" />
                                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-purple-900/90 to-transparent pointer-events-none z-10" />
                                <div className="flex items-center gap-2 text-yellow-400 relative z-20">
                                    <Quote className="w-4 h-4 fill-current text-yellow-400" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">🔥 Daily Oath & Sankalp</span>
                                </div>
                                <div className="relative z-20 w-full overflow-hidden whitespace-nowrap mt-1 flex">
                                    <div className="animate-marquee-infinite flex gap-12 whitespace-nowrap pr-12">
                                        <span className="text-sm md:text-base font-extrabold italic tracking-wide text-yellow-100">
                                            "{dailyShayari}" &nbsp;&bull;&nbsp; {dailyMotivation}
                                        </span>
                                        <span className="text-sm md:text-base font-extrabold italic tracking-wide text-yellow-100">
                                            "{dailyShayari}" &nbsp;&bull;&nbsp; {dailyMotivation}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Progress', value: `${stats.avgProgress}%`, icon: Flame, color: 'text-orange-400' },
                                { label: 'Achieved', value: stats.achieved, icon: Trophy, color: 'text-yellow-400' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                                    <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
                                    <p className="text-xl font-black">{stat.value}</p>
                                    <p className="text-[10px] font-bold text-white/50 uppercase">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Motivation Bar */}
                <div className="bg-muted/40 border py-3 px-6 rounded-2xl flex flex-col md:flex-row items-center gap-4 justify-between">
                    <p className="text-sm font-bold"><span className="text-primary">Daily Motivation:</span> {dailyMotivation}</p>
                    <button onClick={() => handleOpenModal()} className="btn-primary py-2 px-6 text-sm flex items-center gap-2 transition-transform active:scale-95"><Plus className="w-4 h-4" /> Add Goal</button>
                </div>

                {/* Category Filter Badges */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-border/40">
                    {filterCategories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={cn(
                                "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap hover:scale-105 active:scale-95",
                                selectedCategoryFilter === cat
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105"
                                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground"
                            )}
                        >
                            {cat === 'ALL' ? 'All Goals' : cat}
                        </button>
                    ))}
                </div>

                {/* Dreams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredDreams.map((dream, index) => (
                            <motion.div
                                key={dream.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={cn(
                                    "glass-card p-6 rounded-[2.5rem] border transition-all duration-300 relative group flex flex-col h-full hover:shadow-[0_25px_50px_rgba(99,102,241,0.08)] dark:hover:shadow-[0_25px_50px_rgba(139,92,246,0.12)] hover:border-primary/30",
                                    dream.isAchieved 
                                        ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-none" 
                                        : "border-border/50 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md"
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl">{dream.emoji || "🎯"}</span>
                                            {dream.isAchieved && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Goal Achieved
                                                </span>
                                            )}
                                            <span className="bg-primary/10 text-primary text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-primary/10 shadow-sm">
                                                {getDreamCategory(dream.title)}
                                            </span>
                                        </div>
                                        <h3 className={cn("text-xl font-black mt-2 leading-tight", dream.isAchieved && "text-muted-foreground opacity-50")}>
                                            {POST_OPTIONS.find(o => o.value === dream.title)?.label || dream.title}
                                        </h3>
                                        {dream.targetDate && !dream.isAchieved && (() => {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const target = new Date(dream.targetDate);
                                            target.setHours(0,0,0,0);
                                            const diffTime = target.getTime() - today.getTime();
                                            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return (
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5 px-2.5 py-1 rounded-xl w-fit border border-amber-500/20 shadow-sm">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                                    <span>
                                                        {daysLeft > 0 
                                                            ? `${daysLeft} days left` 
                                                            : daysLeft === 0 
                                                                ? "Exam Day Today! ⚡" 
                                                                : `${Math.abs(daysLeft)} days overdue`}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(dream)} className="p-2 hover:bg-muted rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setDeletingGoal(dream)} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed mb-6 line-clamp-2 italic">
                                    {dream.description || `Strategy for ${dream.title} success curated specifically for you.`}
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            <span>Progress Tracker</span>
                                            <span className="text-primary">{dream.progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${dream.progress}%` }} className={cn("h-full transition-all duration-1000", dream.isAchieved ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500")} />
                                        </div>
                                    </div>

                                    {/* Milestone Checklist */}
                                    <div className="space-y-2 py-3 border-t border-border/40 mt-2">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Sub-Goals Checklist</div>
                                        {(dream.milestones || []).map((milestone) => (
                                            <label 
                                                key={milestone.id}
                                                className="flex items-start gap-2.5 cursor-pointer group/label"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={milestone.completed}
                                                    disabled={dream.isAchieved && dream.progress === 100 && showConfetti}
                                                    onChange={() => handleToggleMilestone(dream.id, milestone.id)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary mt-0.5 cursor-pointer"
                                                />
                                                <span className={cn(
                                                    "text-xs font-bold transition-all select-none leading-relaxed",
                                                    milestone.completed 
                                                        ? "line-through text-muted-foreground/60" 
                                                        : "text-foreground group-hover/label:text-primary"
                                                )}>
                                                    {milestone.text}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                                        {!dream.isAchieved ? (
                                            <button onClick={() => handleAchieve(dream.id)} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95">Mark Achieved</button>
                                        ) : (
                                            <div className="flex-1 py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-black uppercase text-center flex items-center justify-center gap-2">🏆 Milestone Success</div>
                                        )}
                                        <button onClick={() => { setActiveAISuggestion(getAISuggestion(dream.title, dream.progress)); setIsAIModalOpen(true); }} className="w-12 h-12 bg-white/50 dark:bg-white/10 border border-border flex items-center justify-center rounded-2xl hover:bg-white transition-colors group/ai"><Sparkles className="w-5 h-5 text-indigo-500 group-hover/ai:scale-110 transition-transform" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredDreams.length === 0 && (
                        <div className="col-span-full text-center py-16 space-y-4 glass-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm">
                            <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto opacity-50"><Target className="w-8 h-8 text-primary" /></div>
                            <h3 className="text-lg font-black">No Ambitions Under This Filter</h3>
                            <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">You don't have any dreams listed under "{selectedCategoryFilter === 'ALL' ? 'All' : selectedCategoryFilter}". Create one now!</p>
                            <button onClick={() => handleOpenModal()} className="btn-primary py-2 px-6 text-xs font-black uppercase inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Initialize Goal</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingGoal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingGoal(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card border rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black">Remove Goal?</h3>
                                <p className="text-muted-foreground font-medium text-sm px-2">Are you sure you want to remove this goal? Think twice — this was your <span className="text-primary font-bold">dream</span>.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeletingGoal(null)} className="flex-1 py-4 bg-muted font-bold text-sm rounded-2xl hover:bg-muted/80">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white font-bold text-sm rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Input Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card border rounded-[2.5rem] shadow-2xl p-6 overflow-hidden">
                            <h2 className="text-xl font-black mb-1">{editingDream ? 'Update Your Goal' : 'Set Your Goal'}, {user?.username} 🎯</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Ambition Title</label>
                                    <div className="relative">
                                        <select value={title} onChange={(e) => handleTitleChange(e.target.value)} required className="w-full bg-muted text-sm font-bold rounded-xl px-4 py-3 appearance-none border-none focus:ring-2 focus:ring-primary/20">
                                            <option value="" disabled>What is your goal post?</option>
                                            {POST_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Icon</label>
                                        <div className="flex bg-muted p-1.5 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                                            {["🎯", "🚀", "🎓", "🏆", "🌟", "💼", "📚", "⚡"].map(e => (
                                                <button key={e} type="button" onClick={() => setSelectedEmoji(e)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm", selectedEmoji === e ? "bg-primary text-white" : "hover:bg-muted font-medium")}>{e}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Date</label>
                                        <input type="date" value={targetDate} onChange={(e) => {
                                            setTargetDate(e.target.value);
                                            if (e.target.value) {
                                                setTargetYear(new Date(e.target.value).getFullYear().toString());
                                            }
                                        }} className="input-field py-2 text-sm font-bold h-10 px-3" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quick Note</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Write something that motivates you..." className="input-field text-xs font-bold resize-none px-3" />
                                </div>

                                {/* Milestones Edit Sub-form */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Milestones Checklist</label>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {formMilestones.map((m, idx) => (
                                            <div key={m.id} className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/50 select-none">
                                                <input
                                                    type="text"
                                                    value={m.text}
                                                    onChange={(e) => {
                                                        const updated = [...formMilestones];
                                                        updated[idx].text = e.target.value;
                                                        setFormMilestones(updated);
                                                    }}
                                                    placeholder="Milestone text..."
                                                    className="flex-1 bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormMilestones(formMilestones.filter(item => item.id !== m.id));
                                                    }}
                                                    className="text-red-500 hover:text-red-650 p-0.5"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {formMilestones.length === 0 && (
                                            <p className="text-[10px] font-medium text-muted-foreground italic p-1 text-center">No milestones. Add one below!</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="new-milestone-text"
                                            placeholder="Add custom milestone..."
                                            className="flex-1 bg-muted/30 text-[11px] font-semibold border-none rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val) {
                                                        setFormMilestones([
                                                            ...formMilestones,
                                                            { id: `m_${Date.now()}_${formMilestones.length}`, text: val, completed: false }
                                                        ]);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const inputEl = document.getElementById('new-milestone-text') as HTMLInputElement;
                                                const val = inputEl?.value.trim();
                                                if (val) {
                                                    setFormMilestones([
                                                        ...formMilestones,
                                                        { id: `m_${Date.now()}_${formMilestones.length}`, text: val, completed: false }
                                                    ]);
                                                    inputEl.value = '';
                                                }
                                            }}
                                            className="px-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-muted font-bold text-xs rounded-xl">Discard</button>
                                    <button type="submit" className="flex-1 btn-primary py-3 text-xs">{editingDream ? 'Update Goal' : 'Confirm Goal'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Suggestion Modal */}
            <AnimatePresence>
                {isAIModalOpen && activeAISuggestion && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAIModalOpen(false)} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-card border rounded-[2rem] shadow-2xl p-7">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg"><Brain className="w-6 h-6 text-white" /></div>
                                <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{activeAISuggestion.title}</h3>
                            </div>
                            <div className="bg-indigo-500/5 p-5 rounded-3xl border border-indigo-500/10 text-xs md:text-sm font-bold leading-relaxed text-indigo-900 dark:text-indigo-300">{activeAISuggestion.body}</div>
                            <button onClick={() => setIsAIModalOpen(false)} className="w-full mt-6 py-4 btn-primary text-xs tracking-widest uppercase">Understood, Let's go!</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
