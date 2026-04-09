import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
    Plus,
    Edit2,
    Trash2,
    Sparkles,
    Trophy,
    X,
    ChevronDown,
    Brain,
    Flame,
    Quote,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

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

export default function DreamBoard() {
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
        handleCloseModal();
    };

    const handleAchieve = (dreamId: string) => {
        const dream = dreams.find(d => d.id === dreamId);
        if (!dream || dream.isAchieved) return;

        // --- Premium Celebration Effects ---
        const victorySound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        victorySound.volume = 0.5;
        victorySound.play().catch(e => console.log("Audio play blocked", e));

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Congratulations!");
            utterance.rate = 1.1;
            utterance.pitch = 1.3;
            window.speechSynthesis.speak(utterance);
        }

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
        <div className="space-y-6 relative">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} gravity={0.1} colors={['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']} className="fixed inset-0 z-[2000] pointer-events-none" />}

            <AnimatePresence>
                {showCelebrationOverlay && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-[2001] flex items-center justify-center pointer-events-none p-4">
                        <div className="bg-white/95 dark:bg-black/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-primary/20 text-center space-y-4 max-w-xs ring-1 ring-black/5">
                            <motion.div animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <Trophy className="w-10 h-10 text-white" />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-black text-primary">Congratulations! 🎉</h2>
                                <p className="text-sm font-bold text-muted-foreground mt-1">Goal achieved.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn("space-y-6 transition-all duration-500", showCelebrationOverlay && "blur-md pointer-events-none")}>
                {/* Header Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 p-6 text-white shadow-xl">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-lg"><Flame className="w-4 h-4" /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Aspirant Stats</span>
                            </div>
                            <button onClick={() => handleOpenModal()} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-bold text-white/50 uppercase">Progress</p>
                                <p className="text-xl font-black">{stats.avgProgress}%</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-bold text-white/50 uppercase">Achieved</p>
                                <p className="text-xl font-black">{stats.achieved}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shayari bar */}
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 text-primary mb-1"><Quote className="w-3 h-3 fill-current" /><span className="text-[10px] font-black uppercase tracking-wider">Motivational Pulse</span></div>
                    <p className="text-xs font-bold italic text-muted-foreground leading-relaxed">"{dailyShayari}"</p>
                </div>

                {/* Dreams List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {dreams.map((dream) => (
                            <motion.div key={dream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={cn("p-4 rounded-3xl border-2 transition-all group relative", dream.isAchieved ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border/50 hover:border-primary/30")}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{dream.emoji || "🎯"}</span>
                                        <div className="space-y-0.5">
                                            <h4 className={cn("text-sm font-black text-foreground line-clamp-1", dream.isAchieved && "opacity-50")}>{dream.title}</h4>
                                            {dream.isAchieved && <span className="text-[8px] font-black uppercase text-emerald-500 tracking-tighter">Milestone Reached 🏆</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(dream)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeletingGoal(dream)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${dream.progress}%` }} className={cn("h-full transition-all duration-1000", dream.isAchieved ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500")} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!dream.isAchieved ? (
                                            <button onClick={() => handleAchieve(dream.id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Strike Goal</button>
                                        ) : (
                                            <div className="flex-1 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase text-center">Completed</div>
                                        )}
                                        <button onClick={() => { setActiveAISuggestion(getAISuggestion(dream.title, dream.progress)); setIsAIModalOpen(true); }} className="p-2 bg-muted rounded-xl hover:bg-primary/10 transition-colors"><Sparkles className="w-4 h-4 text-primary" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {dreams.length === 0 && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto opacity-50"><Target className="w-8 h-8" /></div>
                            <p className="text-sm font-medium text-muted-foreground">Your dream board is empty. <br/>Add your first goal to begin.</p>
                            <button onClick={() => handleOpenModal()} className="btn-primary py-2 px-6 text-xs font-black uppercase">Initialize Board</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals - using portals or fixed positioning */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-card border rounded-[2rem] shadow-2xl p-6">
                            <h2 className="text-lg font-black mb-4">{editingDream ? 'Update Goal' : 'New Ambition'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Goal</label>
                                    <select value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field text-sm font-bold bg-muted/30 py-2.5">
                                        <option value="" disabled>Select target</option>
                                        {POST_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Icon</label>
                                        <div className="flex flex-wrap gap-1">
                                            {["🎯", "🚀", "🎓", "🏆", "🌟"].map(e => (
                                                <button key={e} type="button" onClick={() => setSelectedEmoji(e)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm", selectedEmoji === e ? "bg-primary text-white shadow-md" : "bg-muted/30")}>{e}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-24 space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Year</label>
                                        <input type="number" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="input-field py-2 text-sm font-bold bg-muted/30" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={handleCloseModal} className="flex-1 py-3 bg-muted font-bold text-xs rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 btn-primary py-3 text-xs uppercase tracking-widest">Confirm</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {deletingGoal && (
                    <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingGoal(null)} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xs bg-card border rounded-3xl shadow-2xl p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-500"><AlertCircle className="w-8 h-8" /></div>
                            <h3 className="text-lg font-black">Remove Goal?</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setDeletingGoal(null)} className="flex-1 py-3 bg-muted font-bold text-xs rounded-xl">Keep</button>
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isAIModalOpen && activeAISuggestion && (
                    <div className="fixed inset-0 z-[3002] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAIModalOpen(false)} className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-card border rounded-[2rem] shadow-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-indigo-500 shadow-lg text-white"><Brain className="w-5 h-5" /></div>
                                <h3 className="text-base font-black text-primary uppercase tracking-tight">{activeAISuggestion.title}</h3>
                            </div>
                            <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 text-xs font-bold leading-relaxed text-indigo-900 dark:text-indigo-300 mb-6">{activeAISuggestion.body}</div>
                            <button onClick={() => setIsAIModalOpen(false)} className="w-full py-4 btn-primary text-[10px] tracking-widest uppercase">Understood</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const Target = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10} /><circle cx={12} cy={12} r={6} /><circle cx={12} cy={12} r={2} /></svg>;
