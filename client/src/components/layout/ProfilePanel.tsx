import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Lock, Save, LogOut, Settings, Sparkles, ChevronRight, Rocket } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
    const { user, updateProfile, logout } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dreamProgress, setDreamProgress] = useState({ total: 0, achieved: 0, avg: 0 });

    React.useEffect(() => {
        if (!isOpen) return;

        // Fetch dreams from localStorage
        const userId = user?.username || "guest";
        const savedDreams = localStorage.getItem(`dreams_${userId}`);
        if (savedDreams) {
            const dreams = JSON.parse(savedDreams);
            setDreamProgress({
                total: dreams.length,
                achieved: dreams.filter((d: any) => d.isAchieved).length,
                avg: dreams.length ? Math.round(dreams.reduce((acc: number, d: any) => acc + d.progress, 0) / dreams.length) : 0
            });
        }
    }, [isOpen, user]);

    const handleSave = () => {
        setIsSaving(true);
        setSaved(false);
        setTimeout(() => {
            updateProfile({ email, phone });
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 800);
    };

    const handleNavigateToCorner = () => {
        navigate('/student-corner');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/60 backdrop-blur-md z-[2000]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 bg-card border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[2001] w-full max-w-md"
                    >
                        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">Profile Hub</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Manage your identity</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Profile Hero */}
                            <div className="flex flex-col items-center text-center p-6 border border-border/50 rounded-[2.5rem] bg-gradient-to-br from-muted/50 via-background to-background mb-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                    <Rocket className="w-20 h-20 text-primary" />
                                </div>
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-[2rem] gradient-primary flex items-center justify-center shadow-xl ring-4 ring-background border-4 border-transparent group-hover:scale-105 transition-transform duration-300">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-2 border-background flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg">Pro</div>
                                </div>
                                <h3 className="text-2xl font-black text-foreground">{user?.username}</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Official Aspirant</p>
                            </div>

                            {/* Key Actions Section */}
                            <div className="space-y-4 mb-8">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Personal Arena</p>
                                <button
                                    onClick={handleNavigateToCorner}
                                    className="w-full flex items-center justify-between p-5 rounded-3xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all hover:border-primary/40 group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-foreground">Your Dream Corner</h4>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                                {dreamProgress.achieved} / {dreamProgress.total} Goals Achieved
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* Settings Form */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Account Settings</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Username</label>
                                        <div className="relative">
                                            <input type="text" value={user?.username} disabled className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border rounded-2xl cursor-not-allowed opacity-60 font-bold text-sm" />
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Email Address</label>
                                        <div className="relative">
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Phone Number</label>
                                        <div className="relative">
                                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50">
                                        <Save className="w-4 h-4" />
                                        {isSaving ? 'Updating...' : saved ? 'Success!' : 'Save Details'}
                                    </button>
                                    <button onClick={() => { logout(); onClose(); }} className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-[0.98]">
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
