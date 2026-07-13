import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { BookOpen, User, Lock, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    
    // States for custom Reset Password form
    const [resetUsername, setResetUsername] = useState('');
    const [resetPasswordVal, setResetPasswordVal] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);
    const resetPassword = useAuthStore((state) => state.resetPassword);
    const clearAuthData = useAuthStore((state) => state.clearAuthData);
    const showToast = useToastStore((state) => state.show);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (activeTab === 'login') {
                if (username && password) {
                    const res = await login(username, password);
                    if (res.success) {
                        showToast(`Logged in successfully!`, 'success');
                    } else {
                        setError(res.error || 'Invalid username or password.');
                    }
                }
            } else {
                if (username && name && password) {
                    if (password !== confirmPassword) {
                        setError('Passwords do not match');
                        setLoading(false);
                        return;
                    }
                    const res = await register(username, name, password);
                    if (res.success) {
                        showToast(`Success! Profile created for ${name}.`, 'success');
                    } else {
                        setError(res.error || 'Failed to create profile.');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
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
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-primary/20">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">ExamMaster</h1>
                    <p className="text-muted-foreground mt-2">Elevate your study experience</p>
                </div>

                <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-xl backdrop-blur-sm relative overflow-hidden">
                    {/* Tab Selection */}
                    <div className="flex bg-muted/60 p-1 rounded-xl mb-6 relative">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('login');
                                setError('');
                            }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'login' 
                                    ? 'bg-background text-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('register');
                                setError('');
                            }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'register' 
                                    ? 'bg-background text-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg text-center font-medium animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold ml-1 text-muted-foreground">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={activeTab === 'register' ? "Choose username" : "Enter your username"}
                                    className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {activeTab === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold ml-1 text-muted-foreground">Full Name</label>
                                <div className="relative group">
                                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your actual name"
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold ml-1 text-muted-foreground">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {activeTab === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold ml-1 text-muted-foreground">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'login' && (
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForgot(true)}
                                    className="text-xs text-primary font-semibold hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? (
                                'Processing...'
                            ) : activeTab === 'login' ? (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <UserPlus className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border/50 text-center">
                        <p className="text-xs text-muted-foreground">
                            {activeTab === 'login' 
                                ? "Don't have an account? Switch to Register above to create one."
                                : "Already have an account? Select Sign In above to enter."}
                        </p>
                    </div>

                    <AnimatePresence>
                        {showForgot && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-background/98 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center z-20"
                            >
                                <Lock className="w-10 h-10 text-primary mb-3" />
                                <h3 className="text-xl font-bold mb-1">Reset Password</h3>
                                <p className="text-[11px] text-muted-foreground text-center mb-4">
                                    Recover access by setting a new password for your username.
                                </p>
                                
                                {resetError && (
                                    <div className="w-full mb-3 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-lg text-center font-medium">
                                        {resetError}
                                    </div>
                                )}

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setResetError('');
                                    if (!resetUsername || !resetPasswordVal) {
                                        setResetError('Username and password are required.');
                                        return;
                                    }
                                    setResetLoading(true);
                                    const res = await resetPassword(resetUsername, resetPasswordVal);
                                    setResetLoading(false);
                                    if (res.success) {
                                        showToast('Password reset successfully! Try signing in.', 'success');
                                        setShowForgot(false);
                                        setResetUsername('');
                                        setResetPasswordVal('');
                                    } else {
                                        setResetError(res.error || 'Failed to reset password.');
                                    }
                                }} className="space-y-3 w-full text-left">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Username</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={resetUsername}
                                                onChange={(e) => setResetUsername(e.target.value)}
                                                placeholder="Enter username to reset"
                                                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="password"
                                                value={resetPasswordVal}
                                                onChange={(e) => setResetPasswordVal(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2 w-full">
                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all text-xs disabled:opacity-50"
                                        >
                                            {resetLoading ? 'Resetting...' : 'Save New Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgot(false);
                                                setResetUsername('');
                                                setResetPasswordVal('');
                                                setResetError('');
                                            }}
                                            className="w-full py-2.5 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition-all text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
