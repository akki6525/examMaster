import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Lock, Save, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
    const { user, updateProfile, logout } = useAuthStore();
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setSaved(false);
        // Simulate API call
        setTimeout(() => {
            updateProfile({ email, phone });
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 800);
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-[1000] overflow-y-auto"
                    >
                        <div className="p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold">Profile Settings</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold">{user?.username}</h3>
                                <p className="text-muted-foreground">Premium Member</p>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" /> Username
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.username}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl cursor-not-allowed opacity-70"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-primary" /> Password
                                    </label>
                                    <input
                                        type="password"
                                        value={user?.password}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl cursor-not-allowed opacity-70"
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-1 italic">(Mock display as per requirements)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-primary" /> Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" /> Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-8 space-y-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        onClose();
                                    }}
                                    className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
