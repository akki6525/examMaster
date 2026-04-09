import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
    Plus,
    Target,
    Calendar,
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
interface Dream {
    id: string;
    userId: string;
    title: string;
    targetYear: string;
    description: string;
    isAchieved: boolean;
    progress: number;
    createdAt: number;
    emoji?: string;
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

const SHAYARIS = [
    "Manzil unhi ko milti hai, jinke sapno mein jaan hoti hai. Pankh se kuch nahi hota, hauslon se udaan hoti hai. ✨",
    "Abhi to asli udaan baaki hai, parinde ka imtihan baaki hai. Abhi abhi langha hai samundaron ko, abhi pura aasman baaki hai. 🚀",
];

const MOTIVATIONS = [
    "You are your only limit. Break the barrier today.",
    "Consistency is better than perfection. Keep going.",
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

    // Daily Logic
    const dailyIndex = new Date().getDate() % SHAYARIS.length;
    const dailyShayari = SHAYARIS[dailyIndex];
    const dailyMotivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

    // Form states
    const [title, setTitle] = useState("");
    const [targetYear, setTargetYear] = useState("2026");
    const [description, setDescription] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("🎯");

    useEffect(() => {
        const userId = user?.username || "guest";
        const savedDreams = localStorage.getItem(`dreams_${userId}`);
        if (savedDreams) setDreams(JSON.parse(savedDreams));
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
            setDescription(dream.description);
            setSelectedEmoji(dream.emoji || "🎯");
        } else {
            setEditingDream(null);
            setTitle("");
            setTargetYear("2026");
            setDescription("");
            setSelectedEmoji("🎯");
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDream(null);
        setTitle("");
        setTargetYear("2026");
        setDescription("");
        setSelectedEmoji("🎯");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const dreamData = {
            title,
            targetYear,
            description,
            emoji: selectedEmoji,
            userId: user?.username || "guest",
            isAchieved: editingDream ? editingDream.isAchieved : false,
            progress: editingDream ? editingDream.progress : 0,
            createdAt: editingDream ? editingDream.createdAt : Date.now(),
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
        setEditingDream(null);
        setIsModalOpen(false);
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
            const updated = dreams.map(d => d.id === dreamId ? { ...d, isAchieved: true, progress: 100 } : d);
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
        <>
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

            <div className={cn("max-w-6xl mx-auto space-y-6 pb-12 px-4 transition-all duration-500", showCelebrationOverlay && "blur-sm pointer-events-none")}>

                {/* Header */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 p-8 md:p-10 text-white shadow-2xl">
                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"><User className="w-6 h-6 text-white" /></div>
                                <div>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Aspirant Profile</p>
                                    <h1 className="text-2xl md:text-3xl font-black">{user?.username || 'Future Officer'}'s Arena</h1>
                                </div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md p-5 rounded-3xl border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-yellow-400"><Quote className="w-4 h-4 fill-current" /><span className="text-[10px] font-black uppercase tracking-wider">Aaj ki Shayari</span></div>
                                <p className="text-sm md:text-base font-bold italic leading-relaxed">"{dailyShayari}"</p>
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

                {/* Dreams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {dreams.map((dream, index) => (
                            <motion.div
                                key={dream.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={cn(
                                    "glass-card p-6 rounded-[2.5rem] border-2 transition-all duration-300 relative group flex flex-col h-full hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)] hover:border-primary/40",
                                    dream.isAchieved ? "border-emerald-500/30 bg-emerald-500/5 shadow-none" : "border-border/50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl">{dream.emoji || "🎯"}</span>
                                            {dream.isAchieved && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Goal Achieved
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={cn("text-xl font-black mt-2 leading-tight", dream.isAchieved && "text-muted-foreground opacity-50")}>{dream.title}</h3>
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
                                        <input type="range" min="0" max="100" value={dream.progress} onChange={(e) => saveDreams(dreams.map(d => d.id === dream.id ? { ...d, progress: parseInt(e.target.value) } : d))} className="w-full h-1.5 accent-primary cursor-pointer mt-2" />
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
                                            <select value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-muted text-sm font-bold rounded-xl px-4 py-3 appearance-none border-none focus:ring-2 focus:ring-primary/20">
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
                                        <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Year</label>
                                            <input type="number" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="input-field py-2 text-sm font-bold h-10 px-3" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quick Note</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Write something that motivates you..." className="input-field text-xs font-bold resize-none px-3" />
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
        </>
    );
}
