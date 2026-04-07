import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { BookOpen, User, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const login = useAuthStore((state) => state.login);
    const clearAuthData = useAuthStore((state) => state.clearAuthData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (username && password) {
            const success = login(username, password);
            if (!success) {
                setError('Invalid username or password for existing user.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background blobs for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-primary/20">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">ExamMaster</h1>
                    <p className="text-muted-foreground mt-2">Sign in to continue your preparation</p>
                </div>

                <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-xl backdrop-blur-sm">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg text-center font-medium animate-shake">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForgot(true)}
                                className="text-xs text-primary font-semibold hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border/50 text-center">
                        <p className="text-xs text-muted-foreground">
                            Demo app: Enter any username and password to log in.
                        </p>
                    </div>

                    <AnimatePresence>
                        {showForgot && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-background/95 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center z-20"
                            >
                                <Lock className="w-12 h-12 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">Forgot your Password?</h3>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Since this is a demo, your data is stored locally in your browser. 
                                    If you forgot your password, you can clear all credentials for this device and start fresh.
                                </p>
                                <div className="space-y-3 w-full">
                                    <button
                                        onClick={() => {
                                            clearAuthData();
                                            setShowForgot(false);
                                            setError('Credentials cleared. You can now login with any new password.');
                                        }}
                                        className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                                    >
                                        Clear & Start Fresh
                                    </button>
                                    <button
                                        onClick={() => setShowForgot(false)}
                                        className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
