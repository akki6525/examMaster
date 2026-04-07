import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Upload,
    BookOpen,
    FileQuestion,
    Layers,
    GraduationCap,
    FileUp,
    Sun,
    Moon,
    Menu,
    X,
    FileText,
    Brain,
    ChevronDown,
    User
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import ProfilePanel from './ProfilePanel';

interface LayoutProps {
    children: React.ReactNode;
}

// Primary nav shown always
const primaryNav = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/question-bank', label: 'Question Bank', icon: FileQuestion },
    { path: '/official-exams', label: 'Official Exams', icon: GraduationCap },
    { path: '/ai-report', label: 'AI Report', icon: Brain },
];

// Secondary nav in "More" dropdown
const secondaryNav = [
    { path: '/flashcards', label: 'Flashcards', icon: Layers },
    { path: '/import', label: 'Import Questions', icon: FileUp },
    { path: '/import-pdf', label: 'Import PDF', icon: FileText },
];

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { theme, setTheme } = useThemeStore();
    const { user } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Close "More" dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Hide layout for test interface
    if (location.pathname.startsWith('/test/')) {
        return <>{children}</>;
    }

    const allNav = [...primaryNav, ...secondaryNav];
    const isSecondaryActive = secondaryNav.some(item => location.pathname === item.path);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 supports-[backdrop-filter]:bg-background/40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 gap-2">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-gradient hidden sm:block">
                                {user ? `${user.username.charAt(0).toUpperCase() + user.username.slice(1)}'s ExamMaster` : 'ExamMaster'}
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1.5 flex-1 justify-center">
                            {primaryNav.map((item) => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            'relative flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors duration-200 text-sm font-semibold whitespace-nowrap z-10',
                                            isActive
                                                ? 'text-primary'
                                                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="desktopNav"
                                                className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            />
                                        )}
                                        <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive && "text-primary")} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* More dropdown */}
                            <div className="relative" ref={moreRef}>
                                <button
                                    onClick={() => setMoreOpen(!moreOpen)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium',
                                        isSecondaryActive || moreOpen
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    More
                                    <ChevronDown className={cn('w-3 h-3 transition-transform', moreOpen && 'rotate-180')} />
                                </button>
                                <AnimatePresence>
                                    {moreOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50"
                                        >
                                            {secondaryNav.map(item => {
                                                const isActive = location.pathname === item.path;
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        onClick={() => setMoreOpen(false)}
                                                        className={cn(
                                                            'flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors',
                                                            isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {item.label}
                                                    </Link>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {user && (
                                <div className="hidden lg:flex items-center mr-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                                    <span className="text-xs font-semibold text-muted-foreground mr-1">Hello,</span>
                                    <span className="text-xs font-bold text-foreground">{user.username}</span>
                                </div>
                            )}

                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors border border-transparent hover:border-border"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {user && (
                                <button
                                    onClick={() => setProfileOpen(true)}
                                    className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 border border-white/10"
                                >
                                    <User className="w-5 h-5 text-white" />
                                </button>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-10 h-10 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors border border-transparent hover:border-border"
                            >
                                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>


                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t bg-background overflow-hidden"
                        >
                            <nav className="container mx-auto px-4 py-3 grid grid-cols-2 gap-1">
                                {allNav.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="pt-20 pb-8 min-h-screen">
                <div className="container mx-auto px-4">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-6 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">© 2026 ExamMaster. Your path to exam success.</p>
                        <span className="text-sm text-muted-foreground">Built for serious exam preparation</span>
                    </div>
                </div>
            </footer>
            {/* Profile Panel - Rendered at root level to avoid stacking context issues */}
            <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
    );
}
