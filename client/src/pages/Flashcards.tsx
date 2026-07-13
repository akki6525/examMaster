import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    Loader2,
    Image as ImageIcon,
    CheckCircle,
    RotateCcw,
    Sparkles,
    FolderOpen,
    HelpCircle,
    BookOpen
} from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';
import { cn } from '../lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface ViewerDocument {
    id: string;
    fileName: string;
    fileType: string;
}

interface VisualCard {
    id: string;
    src: any;
    subject: string;
    topic: string;
    title: string;
    isMock: boolean;
    description?: string;
    gradient?: string;
}

// Dynamically discover images in the assets folder
const imageModules = import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,svg,webp,gif}', { eager: true });

export default function Flashcards() {
    const { documents, fetchDocuments } = useDocumentStore();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'visual' | 'slides'>('visual');

    // PDF Slider State
    const [selectedDoc, setSelectedDoc] = useState<ViewerDocument | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Visual Flashcard State
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
    const [visualIndex, setVisualIndex] = useState<number>(0);
    const [visualScale, setVisualScale] = useState<number>(1.0);
    const [isVisualFullscreen, setIsVisualFullscreen] = useState<boolean>(false);
    const [learnedCards, setLearnedCards] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDocuments();
        // Load learned card records
        const saved = localStorage.getItem('learned_visual_cards');
        if (saved) {
            try {
                setLearnedCards(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, [fetchDocuments]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError('');
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('PDF load error:', err);
        setError('Failed to load document. This might not be a valid PDF.');
        setLoading(false);
    };

    const selectDocument = (doc: ViewerDocument) => {
        setSelectedDoc(doc);
        setCurrentPage(1);
        setScale(1.0);
        setLoading(true);
        setError('');
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= numPages) {
            setCurrentPage(page);
        }
    };

    const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const toggleFullscreen = () => setIsFullscreen(prev => !prev);

    // Process scanned cards from custom assets folders
    const scannedCards = useMemo<VisualCard[]>(() => {
        return Object.entries(imageModules).map(([path, module]) => {
            const parts = path.split('/');
            const filename = parts[parts.length - 1] || 'Card';
            
            const title = filename
                .replace(/\.[^/.]+$/, "") 
                .replace(/[-_]/g, " ")
                .replace(/\b\w/g, c => c.toUpperCase());

            const assetsIndex = parts.indexOf('assets');
            let subject = 'Other';
            let topic = 'General';

            if (assetsIndex !== -1 && assetsIndex + 1 < parts.length - 1) {
                const subFolder = parts[assetsIndex + 1].toLowerCase();
                if (subFolder === 'geography') subject = 'Geography';
                else if (subFolder === 'history') subject = 'History';
                else if (subFolder === 'polity') subject = 'Polity';
                else if (subFolder !== 'assets') {
                    subject = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
                }

                // If there is/are folder(s) between standard subject folder and filename, last one decides Topic
                if (assetsIndex + 2 < parts.length - 1) {
                    const topicFolder = parts[parts.length - 2];
                    topic = topicFolder.charAt(0).toUpperCase() + topicFolder.slice(1).toLowerCase();
                }
            }

            return {
                id: path,
                src: (module as any).default || (module as any),
                subject,
                topic,
                title,
                isMock: false
            };
        });
    }, []);

    // Mock cards in case the scanned folders are empty
    const mockCards = useMemo<VisualCard[]>(() => [
        {
            id: 'mock-geography',
            src: '',
            subject: 'Geography',
            topic: 'Rivers',
            title: 'Indian River Basin Map',
            description: 'Flow analysis of Himalayan vs Peninsular Rivers. Focus on tributaries of Ganga (Yamuna, Son, Gandak), Godavari (tributaries: Wardha, Pranhita) and Indus system tributaries.',
            isMock: true,
            gradient: 'from-blue-600/20 to-cyan-500/20 border-blue-500/30'
        },
        {
            id: 'mock-polity',
            src: '',
            subject: 'Polity',
            topic: 'Constitution',
            title: 'Constitution Parts & Schedules',
            description: 'Study of 25 Parts and 12 Schedules. Focus heavily on Part III (Articles 12-35 Fundamental Rights) and Part IV (Directive Principles) + Part IV-A (Fundamental Duties).',
            isMock: true,
            gradient: 'from-violet-600/20 to-purple-500/20 border-violet-500/30'
        },
        {
            id: 'mock-history',
            src: '',
            subject: 'History',
            topic: 'Chronology',
            title: 'Ancient Major Empires Chronology',
            description: 'Chronological timeline of Mauryan (capital: Pataliputra, major kings: Chandragupta, Ashoka), Gupta Empire (Chandragupta I, Samudragupta - Napoleon of India), and Harsha Empire.',
            isMock: true,
            gradient: 'from-amber-600/20 to-orange-500/20 border-amber-500/30'
        }
    ], []);

    // Reset selectedTopic when resetting selectedSubject
    useEffect(() => {
        setSelectedTopic('All Topics');
    }, [selectedSubject]);

    // Dynamically query available topics for selection based on selected subject
    const availableTopics = useMemo(() => {
        let list = scannedCards.length > 0 ? scannedCards : mockCards;
        if (selectedSubject !== 'All') {
            list = list.filter(c => c.subject.toLowerCase() === selectedSubject.toLowerCase());
        }
        const topics = new Set<string>();
        list.forEach(c => {
            if (c.topic) {
                topics.add(c.topic);
            }
        });
        return topics.size > 0 ? ['All Topics', ...Array.from(topics)] : [];
    }, [scannedCards, mockCards, selectedSubject]);

    const cardsToDisplay = useMemo(() => {
        let list = scannedCards.length > 0 ? scannedCards : mockCards;
        if (selectedSubject !== 'All') {
            list = list.filter(c => c.subject.toLowerCase() === selectedSubject.toLowerCase());
        }
        if (selectedTopic !== 'All Topics') {
            list = list.filter(c => c.topic && c.topic.toLowerCase() === selectedTopic.toLowerCase());
        }
        return list;
    }, [scannedCards, selectedSubject, selectedTopic, mockCards]);

    // Reset visual index when switching filter
    useEffect(() => {
        setVisualIndex(0);
        setVisualScale(1.0);
    }, [selectedSubject, selectedTopic]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeTab !== 'visual' || isVisualFullscreen) return;
            if (e.key === 'ArrowRight') {
                if (visualIndex < cardsToDisplay.length - 1) {
                    setVisualIndex(prev => prev + 1);
                    setVisualScale(1.0);
                }
            } else if (e.key === 'ArrowLeft') {
                if (visualIndex > 0) {
                    setVisualIndex(prev => prev - 1);
                    setVisualScale(1.0);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, visualIndex, cardsToDisplay.length, isVisualFullscreen]);

    const toggleLearned = (cardId: string) => {
        setLearnedCards(prev => {
            const next = prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId];
            localStorage.setItem('learned_visual_cards', JSON.stringify(next));
            return next;
        });
    };

    const zoomInVisual = () => setVisualScale(prev => Math.min(prev + 0.25, 3));
    const zoomOutVisual = () => setVisualScale(prev => Math.max(prev - 0.25, 0.5));
    const resetZoomVisual = () => setVisualScale(1.0);
    const toggleVisualFullscreen = () => setIsVisualFullscreen(prev => !prev);

    const pdfDocuments = documents.filter(d => d.fileType === 'application/pdf');
    const subjects = ['All', 'Geography', 'History', 'Polity', 'Other'];
    const currentVisualCard = cardsToDisplay[visualIndex];

    // Handle mouse scroll wheel zoom for visual cards
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!currentVisualCard || !currentVisualCard.src) return;

            e.preventDefault();
            const delta = e.deltaY;
            setVisualScale(prev => {
                const step = 0.05;
                if (delta < 0) {
                    return Math.min(prev + step, 3.0);
                } else {
                    return Math.max(prev - step, 0.5);
                }
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [currentVisualCard]);

    return (
        <div className={cn(
            "space-y-6",
            (isFullscreen || isVisualFullscreen) ? "fixed inset-0 z-50 bg-background p-4" : "max-w-5xl mx-auto"
        )}>
            {/* Header & Mode Switcher */}
            {!(isFullscreen || isVisualFullscreen) && (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Revision & Flashcards</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Master your high-yield concepts using visual cards or document slides
                            </p>
                        </div>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex p-1 bg-muted rounded-2xl border border-border/50 max-w-sm w-full mt-2">
                        <button
                            onClick={() => { setActiveTab('visual'); setSelectedDoc(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200",
                                activeTab === 'visual'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ImageIcon className="w-4 h-4" />
                            Visual Cards
                        </button>
                        <button
                            onClick={() => setActiveTab('slides')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200",
                                activeTab === 'slides'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            PDF Slides
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 1: VISUAL FLASHCARDS */}
            {activeTab === 'visual' && (
                <div className="space-y-6">
                    {/* Subject Filter & Progress */}
                    {!(isFullscreen || isVisualFullscreen) && (
                        <div className="space-y-3 py-2 border-b border-border/40">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    {subjects.map((sub) => (
                                        <button
                                            key={sub}
                                            onClick={() => setSelectedSubject(sub)}
                                            className={cn(
                                                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap",
                                                selectedSubject === sub
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground"
                                            )}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Card Count & Revision Progress */}
                                {cardsToDisplay.length > 0 && (
                                    <div className="text-sm font-bold text-muted-foreground flex items-center gap-3">
                                        <span>Card {visualIndex + 1} of {cardsToDisplay.length}</span>
                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                                            <div 
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{ width: `${((visualIndex + 1) / cardsToDisplay.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Topic Selector Dropdown */}
                            {availableTopics.length > 1 && (
                                <div className="flex items-center gap-3 pt-2.5 border-t border-border/10">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Select Topic:</span>
                                    <div className="relative inline-block w-48">
                                        <select
                                            value={selectedTopic}
                                            onChange={(e) => setSelectedTopic(e.target.value)}
                                            className="w-full bg-card hover:bg-muted/50 border border-border/60 text-foreground text-xs font-bold py-2.5 pl-4.5 pr-10 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                        >
                                            {availableTopics.map((topic) => (
                                                <option key={topic} value={topic} className="bg-card text-foreground py-2">
                                                    {topic}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-muted-foreground">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Flashcard Container */}
                    {cardsToDisplay.length > 0 ? (
                        <div className="space-y-4">
                            {/* Card Toolbar */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-2.5">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest border border-primary/10">
                                        {currentVisualCard.subject}
                                    </span>
                                    <span className="font-bold text-foreground truncate max-w-sm">
                                        {currentVisualCard.title}
                                    </span>
                                    {scannedCards.length === 0 && (
                                        <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/10 flex items-center gap-1">
                                            Sample Card
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Mark as Learned */}
                                    <button
                                        onClick={() => toggleLearned(currentVisualCard.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                            learnedCards.includes(currentVisualCard.id)
                                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                                : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {learnedCards.includes(currentVisualCard.id) ? "Learned" : "Mark Learned"}
                                    </button>

                                    <div className="h-6 w-px bg-border/80 mx-1.5" />

                                    <button onClick={zoomOutVisual} className="p-2 hover:bg-muted rounded-xl transition-all" title="Zoom out">
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-semibold w-12 text-center">{Math.round(visualScale * 100)}%</span>
                                    <button onClick={zoomInVisual} className="p-2 hover:bg-muted rounded-xl transition-all" title="Zoom in">
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button onClick={resetZoomVisual} className="p-2 hover:bg-muted rounded-xl transition-all" title="Reset Zoom">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>

                                    <div className="h-6 w-px bg-border/80 mx-1.5" />

                                    <button onClick={toggleVisualFullscreen} className="p-2 hover:bg-muted rounded-xl transition-all" title="Fullscreen">
                                        {isVisualFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Card Body Display */}
                            <div 
                                ref={containerRef}
                                className={cn(
                                    "relative rounded-3xl bg-muted/30 overflow-auto flex items-center justify-center border border-border/70 shadow-inner",
                                    isVisualFullscreen ? "h-[calc(100vh-140px)]" : "h-[60vh] md:h-[65vh]"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentVisualCard.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-full h-full flex items-center justify-center p-6"
                                    >
                                        {currentVisualCard.src ? (
                                            <div className="w-full h-full flex items-center justify-center overflow-auto">
                                                <img
                                                    src={currentVisualCard.src}
                                                    alt={currentVisualCard.title}
                                                    style={{ transform: `scale(${visualScale})`, transformOrigin: 'center center' }}
                                                    className="max-h-full max-w-full object-contain rounded-2xl shadow-lg transition-transform duration-100 ease-out"
                                                />
                                            </div>
                                        ) : (
                                            /* Clean CSS Mock Card for empty state */
                                            <div className={cn(
                                                "w-full max-w-2xl p-8 rounded-3xl border-2 bg-gradient-to-br flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-md min-h-[350px]",
                                                currentVisualCard.gradient
                                            )}>
                                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                                                <div className="space-y-4 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-5 h-5 text-primary" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Visual Guide</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black">{currentVisualCard.title}</h3>
                                                    <p className="text-sm font-medium leading-relaxed text-muted-foreground whitespace-pre-line bg-card/40 p-5 rounded-2xl border border-border/30">
                                                        {currentVisualCard.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground/80 mt-6 relative z-10 pt-4 border-t border-border/30">
                                                    <span className="flex items-center gap-1.5 font-bold">
                                                        <FolderOpen className="w-3.5 h-3.5 text-primary" />
                                                        Subject: {currentVisualCard.subject}
                                                    </span>
                                                    <span className="italic flex items-center gap-1">
                                                        <HelpCircle className="w-3.5 h-3.5" />
                                                        Keyboard rules: Use Left/Right Arrow keys
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Deck Navigation Controls */}
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    onClick={() => {
                                        if (visualIndex > 0) {
                                            setVisualIndex(prev => prev - 1);
                                            setVisualScale(1.0);
                                        }
                                    }}
                                    disabled={visualIndex <= 0}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all text-sm border",
                                        visualIndex <= 0
                                            ? "text-muted-foreground border-transparent bg-transparent cursor-not-allowed opacity-50"
                                            : "hover:bg-muted text-foreground border-border/80 active:scale-95 shadow-sm"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                {/* Keyboard Indicator */}
                                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hidden sm:flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-muted border border-border">←</span>
                                    <span>Swipe / Browse</span>
                                    <span className="px-1.5 py-0.5 rounded bg-muted border border-border">→</span>
                                </div>

                                <button
                                    onClick={() => {
                                        if (visualIndex < cardsToDisplay.length - 1) {
                                            setVisualIndex(prev => prev + 1);
                                            setVisualScale(1.0);
                                        }
                                    }}
                                    disabled={visualIndex >= cardsToDisplay.length - 1}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm shadow-md",
                                        visualIndex >= cardsToDisplay.length - 1
                                            ? "text-muted-foreground bg-muted/40 cursor-not-allowed shadow-none"
                                            : "btn-primary hover:scale-[1.02] active:scale-95 text-white"
                                    )}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-3xl p-8 space-y-4">
                            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-bold">No Visual Cards Found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                There are no visual cards matching the subject "{selectedSubject}". Change subject filter or add new content.
                            </p>
                        </div>
                    )}

                    {/* Interactive Guideline box for assets location */}
                    {!(isFullscreen || isVisualFullscreen) && (
                        <div className="mt-8 p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center gap-4 text-left">
                            <div className="p-3 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-foreground">Aspirant Note: How to add your own Study Cards</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Copy your study diagrams, memory charts, maps, or infographics (PNG, JPG, SVG, WebP) directly to <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-bold">client/src/assets/geography</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-bold">history</code>, or <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-bold">polity</code> folders. They will load here in real time!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PDF DOCUMENT SLIDES (Original implementation retained) */}
            {activeTab === 'slides' && (
                <div className="space-y-6">
                    {/* Document Selection */}
                    {!selectedDoc && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {pdfDocuments.length > 0 ? (
                                pdfDocuments.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => selectDocument(doc)}
                                        className="p-6 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                    >
                                        <FileText className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                        <h3 className="font-semibold truncate">{doc.fileName}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Click to view
                                        </p>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No PDF Documents</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Upload PDF documents to view them here
                                    </p>
                                    <a href="/upload" className="btn-primary inline-flex items-center gap-2">
                                        Upload Documents
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Document Viewer */}
                    {selectedDoc && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {/* Toolbar */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedDoc(null)}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-medium truncate max-w-xs">{selectedDoc.fileName}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {numPages}
                                    </span>

                                    <div className="h-6 w-px bg-border mx-2" />

                                    <button onClick={zoomOut} className="p-2 hover:bg-muted rounded-lg" title="Zoom out">
                                        <ZoomOut className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm w-14 text-center">{Math.round(scale * 100)}%</span>
                                    <button onClick={zoomIn} className="p-2 hover:bg-muted rounded-lg" title="Zoom in">
                                        <ZoomIn className="w-5 h-5" />
                                    </button>

                                    <div className="h-6 w-px bg-border mx-2" />

                                    <button onClick={toggleFullscreen} className="p-2 hover:bg-muted rounded-lg" title="Fullscreen">
                                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* PDF Display */}
                            <div className={cn(
                                "relative rounded-xl bg-muted/50 overflow-auto flex justify-center",
                                isFullscreen ? "flex-1 h-[calc(100vh-180px)]" : "h-[70vh]"
                            )}>
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                )}

                                {error ? (
                                    <div className="flex items-center justify-center h-full text-center p-8">
                                        <div>
                                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">{error}</p>
                                            <button
                                                onClick={() => setSelectedDoc(null)}
                                                className="mt-4 btn-primary"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Document
                                        file={`http://localhost:3001/api/documents/${selectedDoc.id}/file`}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading=""
                                    >
                                        <Page
                                            pageNumber={currentPage}
                                            scale={scale}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="shadow-lg"
                                        />
                                    </Document>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                        currentPage <= 1
                                            ? "text-muted-foreground cursor-not-allowed"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Previous
                                </button>

                                <div className="flex-1 mx-4">
                                    <input
                                        type="range"
                                        min={1}
                                        max={numPages || 1}
                                        value={currentPage}
                                        onChange={(e) => goToPage(Number(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= numPages}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors",
                                        currentPage >= numPages
                                            ? "text-muted-foreground cursor-not-allowed"
                                            : "btn-primary"
                                    )}
                                >
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
