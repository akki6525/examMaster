import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Lock, Save, LogOut, Settings, Sparkles, ChevronRight, Rocket, Check, Camera, Eye, ChevronDown, HelpCircle, Clock, Coffee } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { useThemeStore } from '../../stores/themeStore';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
    const { user, updateProfile, logout } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const navigate = useNavigate();

    const themes = [
        { id: 'system', name: 'System Default (OS)', color: '#334155', accent: '#94a3b8' },
        { id: 'light', name: 'Alabaster Light (Light)', color: '#f8fafc', accent: '#7c3aed' },
        { id: 'dark', name: 'Slate Dark Code (Dark)', color: '#0f172a', accent: '#8b5cf6' },
        { id: 'cyberpunk', name: 'Cyberpunk Neon (Dark)', color: '#0a000d', accent: '#f43f5e' },
        { id: 'dracula', name: 'Dracula Vampire (Dark)', color: '#282a36', accent: '#ff79c6' },
        { id: 'peach', name: 'Peach Warmth (Light)', color: '#fffaf6', accent: '#f97316' },
        { id: 'mint', name: 'Forest Mint (Light)', color: '#f5faf7', accent: '#059669' },
        { id: 'solarizedlight', name: 'Solarized Light (Light)', color: '#fdf6e3', accent: '#2aa198' },
        { id: 'onedark', name: 'One Dark Pro (Dark)', color: '#1e1e24', accent: '#61afef' },
        { id: 'solarized', name: 'Solarized Ocean (Dark)', color: '#001e26', accent: '#2aa198' },
        { id: 'tokyonight', name: 'Tokyo Night (Dark)', color: '#1a1b26', accent: '#7aa2f7' },
        { id: 'rose', name: 'Sweet Aura Rose (Dark)', color: '#190a10', accent: '#f43f5e' },
    ];

    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [dreamProgress, setDreamProgress] = useState({ total: 0, achieved: 0, avg: 0 });
    const [showLightbox, setShowLightbox] = useState(false);
    const [relaxSeconds, setRelaxSeconds] = useState(0);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [sessionStart, setSessionStart] = useState<number>(() => user?.individual_user_logged_in_time || Date.now());

    const validateEmail = (val: string): string => {
        if (!val || !val.trim()) {
            return "Email address is required";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val.trim())) {
            return "Invalid email format (e.g. name@example.com)";
        }
        return "";
    };

    const validatePhone = (val: string): string => {
        if (!val || !val.trim()) {
            return "Phone number is required";
        }
        const cleanPhone = val.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return "Enter a valid 10-digit mobile number (e.g. 9876543210)";
        }
        return "";
    };

    React.useEffect(() => {
        if (user?.individual_user_logged_in_time) {
            setSessionStart(user.individual_user_logged_in_time);
        }
    }, [user?.individual_user_logged_in_time]);

    React.useEffect(() => {
        const updateSecs = () => {
            setSessionSeconds(Math.max(0, Math.floor((Date.now() - sessionStart) / 1000)));
        };
        updateSecs();
        const interval = setInterval(updateSecs, 1000);
        return () => clearInterval(interval);
    }, [sessionStart, isOpen]);

    const formatSessionDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    React.useEffect(() => {
        if (!isOpen) return;

        // Sync local states with store
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
        setEmailError('');
        setPhoneError('');
        setAvatar(user?.avatar);

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

        // Fetch relax time from localStorage
        const relaxKey = `relax_time_${userId}`;
        setRelaxSeconds(parseInt(localStorage.getItem(relaxKey) || '0', 10));

        // Setup a live updates timer while the profile hub remains open
        const interval = setInterval(() => {
            setRelaxSeconds(parseInt(localStorage.getItem(relaxKey) || '0', 10));
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, user]);

    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (emailError) {
            setEmailError(validateEmail(val));
        }
    };

    const handlePhoneChange = (val: string) => {
        setPhone(val);
        if (phoneError) {
            setPhoneError(validatePhone(val));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 180;
                    const MAX_HEIGHT = 180;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        // Get compressed JPEG at 0.7 quality to keep size minuscule
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        setAvatar(compressedBase64);
                        updateProfile({ avatar: compressedBase64 });
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const eErr = validateEmail(email);
        const pErr = validatePhone(phone);

        setEmailError(eErr);
        setPhoneError(pErr);

        if (eErr || pErr) {
            useToastStore.getState().show(eErr || pErr, 'error');
            return;
        }

        setIsSaving(true);
        setSaved(false);
        setTimeout(() => {
            updateProfile({ email: email.trim(), phone: phone.trim(), avatar });
            setIsSaving(false);
            setSaved(true);
            setShowToast(true);
            setTimeout(() => {
                setSaved(false);
                setShowToast(false);
            }, 3000);
        }, 600);
    };

    const handleNavigateToCorner = () => {
        navigate('/student-corner');
        onClose();
    };

    const handleNavigateToGuide = () => {
        navigate('/guide');
        onClose();
    };

    const handleNavigateToRelaxMode = () => {
        navigate('/relax-mode');
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
                        className="fixed right-0 top-0 bottom-0 bg-white/90 dark:bg-card/75 backdrop-blur-2xl border-l border-slate-200/80 dark:border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.30)] z-[2001] w-full max-w-md"
                    >
                        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
                            {/* Header */}
                            <div className="flex-shrink-0 flex items-center justify-between mb-8">
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

                            {/* Toast Notification */}
                            <AnimatePresence>
                                {showToast && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -45, scale: 0.9, x: '-50%' }}
                                        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
                                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                                        className="fixed top-8 left-1/2 z-[3000] flex items-center gap-4 px-6 py-4 bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-emerald-500/30 shadow-[0_25px_60px_rgba(16,185,129,0.25)] w-[90%] max-w-sm pointer-events-none overflow-hidden"
                                    >
                                        <div className="relative flex-shrink-0 animate-bounce" style={{ animationDuration: '1.2s' }}>
                                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-sm" />
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md relative z-10">
                                                <Check className="w-4 h-4 stroke-[3]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-black tracking-tight leading-tight">Profile Updated</p>
                                            <p className="text-emerald-400/90 text-[9px] font-black uppercase mt-0.5 tracking-wider">Changes Saved Successfully</p>
                                        </div>
                                        
                                        {/* Auto-disappearing indicator bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-950/40 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: "100%" }}
                                                animate={{ width: "0%" }}
                                                transition={{ duration: 3, ease: "linear" }}
                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Profile Hero */}
                            <div className="flex-shrink-0 flex flex-col items-center text-center p-4 border border-slate-200/80 dark:border-white/10 rounded-3xl bg-gradient-to-br from-indigo-50/60 via-slate-100/70 to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-purple-950/30 mb-5 relative overflow-hidden group shadow-md shadow-indigo-950/5 dark:shadow-indigo-950/20">
                                {/* Ambient glow light inside card */}
                                <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-fuchsia-500/20 dark:bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="absolute top-0 right-0 p-3 opacity-10 dark:opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                    <Rocket className="w-12 h-12 text-primary animate-pulse" />
                                </div>
                                <div 
                                    className="relative mb-2.5 group/avatar cursor-pointer" 
                                    onClick={() => {
                                        if (avatar) {
                                            setShowLightbox(true);
                                        } else {
                                            document.getElementById('avatar-upload')?.click();
                                        }
                                    }}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-indigo-100 dark:ring-indigo-950/40 border border-white/30 dark:border-white/20 group-hover/avatar:scale-105 transition-all duration-300 overflow-hidden relative">
                                        {avatar ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-white" />
                                        )}
                                        {/* Hover Upload Overlay */}
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 text-center">
                                            {avatar ? (
                                                <>
                                                    <Eye className="w-4 h-4 text-white mb-0.5" />
                                                    <span className="text-[7px] font-black uppercase text-white/90 tracking-wider">View Photo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="w-4 h-4 text-white mb-0.5" />
                                                    <span className="text-[7px] font-black uppercase text-white/90 tracking-wider">Add Photo</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[7px] font-black uppercase shadow-[0_4px_12px_rgba(245,158,11,0.3)] tracking-wider border border-white/15 pointer-events-none">Pro</div>
                                </div>
                                <h3 className="text-[1.2rem] font-black text-foreground tracking-tight">{user?.username}</h3>
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                     Official Aspirant
                                 </p>
                                 {/* Session tracking field implicit */}
                                
                                {avatar ? (
                                    <div className="flex items-center gap-1.5 mt-2.5 relative z-10">
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                document.getElementById('avatar-upload')?.click();
                                            }} 
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 rounded-full border border-slate-200/80 dark:border-white/10 text-[8px] font-extrabold uppercase text-primary tracking-wider transition-all hover:scale-103 active:scale-97"
                                        >
                                            <Camera className="w-3 h-3" /> Edit Photo
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAvatar(undefined);
                                                updateProfile({ avatar: undefined });
                                            }} 
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 hover:bg-red-500/15 rounded-full border border-red-200/30 dark:border-red-500/20 text-[8px] font-extrabold uppercase text-red-500 dark:text-red-400 tracking-wider transition-all hover:scale-103 active:scale-97"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            document.getElementById('avatar-upload')?.click();
                                        }} 
                                        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 rounded-full border border-slate-200/80 dark:border-white/10 text-[8px] font-extrabold uppercase text-primary tracking-wider transition-all hover:scale-103 active:scale-97"
                                    >
                                        <Camera className="w-3 h-3" /> Add Photo
                                    </button>
                                )}

                                <input 
                                    type="file" 
                                    id="avatar-upload" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarChange} 
                                />

                                 {/* Micro stat numbers */}
                                 <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/80 dark:border-white/5">
                                     <div className="text-center">
                                         <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Goals</p>
                                         <p className="text-xs font-black text-foreground">{dreamProgress.total}</p>
                                     </div>
                                     <div className="text-center border-x border-slate-200/80 dark:border-white/5 px-2">
                                         <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Achieved</p>
                                         <p className="text-xs font-black text-emerald-500 dark:text-emerald-400">{dreamProgress.achieved}</p>
                                     </div>
                                     <div className="text-center">
                                         <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Avg Progress</p>
                                         <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{dreamProgress.avg}%</p>
                                     </div>
                                 </div>

                                 {/* Live Session & Relax Mode Stats */}
                                 {user && (
                                     <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/5">
                                         <div className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                                             <div className="flex items-center gap-1 mb-0.5 text-violet-600 dark:text-violet-400 font-bold">
                                                 <Clock className="w-3 h-3" />
                                                 <span className="text-[8px] font-black uppercase tracking-wider">Aspirant Online</span>
                                             </div>
                                             <p className="text-xs font-black text-foreground">{formatSessionDuration(sessionSeconds)}</p>
                                             <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                 Logged At {new Date(sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </p>
                                         </div>
                                         <div className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                                             <div className="flex items-center gap-1 mb-0.5 text-amber-500 font-bold">
                                                 <Coffee className="w-3 h-3" />
                                                 <span className="text-[8px] font-black uppercase tracking-wider">Relaxed State</span>
                                             </div>
                                             <p className="text-xs font-black text-foreground">{formatSessionDuration(relaxSeconds)}</p>
                                             <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Total Relax Time</p>
                                         </div>
                                     </div>
                                 )}
                            </div>

                            {/* Key Actions Section */}
                            <div className="flex-shrink-0 space-y-3 mb-8">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Personal Arena</p>
                                
                                <button
                                    onClick={handleNavigateToCorner}
                                    className="w-full flex items-center justify-between p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-transparent hover:from-violet-600/15 hover:via-purple-600/10 transition-all hover:border-primary/35 group active:scale-[0.98] shadow-sm relative overflow-hidden"
                                >
                                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                                    <div className="flex items-center gap-4 text-left relative z-10">
                                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                                            <Sparkles className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-foreground tracking-tight">Your Dream Corner</h4>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                                {dreamProgress.achieved} / {dreamProgress.total} Goals Done
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform relative z-10" />
                                </button>
                            </div>

                            {/* Theme Preference Dropdown */}
                            <div className="flex-shrink-0 space-y-3 mb-8">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Theme Preferences</p>
                                <div className="flex items-center gap-3">
                                    {/* Active Theme Preview Circle */}
                                    {(() => {
                                        const activeThemeObj = themes.find(t => t.id === theme) || themes[1];
                                        return (
                                            <div 
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300"
                                                style={{ background: activeThemeObj.color }}
                                                title={activeThemeObj.name}
                                            >
                                                <div className="w-4 h-4 rounded-full shadow-inner animate-pulse" style={{ background: activeThemeObj.accent }} />
                                            </div>
                                        );
                                    })()}

                                    <div className="relative flex-1">
                                        <select
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value as any)}
                                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-foreground text-sm font-bold py-3 pl-4 pr-10 rounded-2xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                        >
                                            {themes.map((t) => (
                                                <option key={t.id} value={t.id} className="bg-card text-foreground font-semibold">
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground font-bold">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Form */}
                            <div className="flex-shrink-0 space-y-6">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Account Settings</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Username</label>
                                        <div className="relative">
                                            <input type="text" value={user?.username} disabled className="w-full pl-11 pr-4 py-3 bg-muted/20 border border-slate-200/50 dark:border-white/5 rounded-2xl cursor-not-allowed opacity-50 font-bold text-slate-800 dark:text-slate-200 text-sm" />
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/45" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Email Address</label>
                                        <div className="relative">
                                            <input 
                                                type="email" 
                                                value={email} 
                                                onChange={(e) => handleEmailChange(e.target.value)} 
                                                className={cn(
                                                    "w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border text-foreground rounded-2xl font-bold text-sm outline-none transition-all focus:ring-1",
                                                    emailError 
                                                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500 focus:ring-red-500/30 text-red-500 dark:text-red-400" 
                                                        : "border-slate-200 dark:border-white/10 focus:border-primary/50 focus:bg-white dark:focus:bg-transparent focus:ring-primary/30"
                                                )} 
                                                placeholder="golu@example.com"
                                            />
                                            <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", emailError ? "text-red-500" : "text-primary")} />
                                        </div>
                                        {emailError && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 ml-1">
                                                <span>⚠️</span> {emailError}
                                            </motion.p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider ml-1">Phone Number</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={phone} 
                                                onChange={(e) => handlePhoneChange(e.target.value)} 
                                                className={cn(
                                                    "w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border text-foreground rounded-2xl font-bold text-sm outline-none transition-all focus:ring-1",
                                                    phoneError 
                                                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500 focus:ring-red-500/30 text-red-500 dark:text-red-400" 
                                                        : "border-slate-200 dark:border-white/10 focus:border-primary/50 focus:bg-white dark:focus:bg-transparent focus:ring-primary/30"
                                                )} 
                                                placeholder="10-digit phone number"
                                                maxLength={15}
                                            />
                                            <Phone className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", phoneError ? "text-red-500" : "text-primary")} />
                                        </div>
                                        {phoneError && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 ml-1">
                                                <span>⚠️</span> {phoneError}
                                            </motion.p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50">
                                        <Save className="w-4 h-4 animate-bounce" style={{ animationDuration: '2s' }} />
                                        {isSaving ? 'Updating...' : 'Save Details'}
                                    </button>
                                    <button onClick={() => { logout(); onClose(); useToastStore.getState().show('Logged out successfully', 'success'); }} className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-[0.98] border border-transparent hover:border-red-500/20">
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>



                    {/* Lightbox Detail View */}
                    <AnimatePresence>
                        {showLightbox && avatar && (
                            <div className="fixed inset-0 z-[2650] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowLightbox(false)}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                                />
                                
                                <button
                                    type="button"
                                    onClick={() => setShowLightbox(false)}
                                    className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 z-[2660]"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="relative max-w-[90vw] max-h-[80vh] aspect-square rounded-[2rem] border border-white/15 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] bg-slate-950 flex items-center justify-center"
                                >
                                    <img 
                                        src={avatar} 
                                        alt="Profile Full View" 
                                        className="w-full h-full object-cover max-w-[340px] max-h-[340px] md:max-w-[400px] md:max-h-[400px]" 
                                    />
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
