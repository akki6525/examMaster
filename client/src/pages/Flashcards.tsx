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
    BookOpen,
    AlertCircle,
    Award
} from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';
import { cn } from '../lib/utils';
import ukGeographyFlashcards from '../data/ukGeographyFlashcards.json';
import ukHistoryFlashcards from '../data/ukHistoryFlashcards.json';
import kailashImg from '../assets/kailash.png';
import historyImg from '../assets/gandhi.png';


// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const isImage = (text: string) => {
    return text.trim().startsWith('![') && text.includes('](') && text.trim().endsWith(')');
};

const renderImage = (imgMarkdown: string) => {
    const match = imgMarkdown.match(/!\[.*?\]\((.*?)\)/);
    const src = match ? match[1] : '';
    if (!src) return null;
    return (
        <div className="w-full flex justify-center my-3">
            <img src={src} alt="Flashcard visual content" className="rounded-2xl max-h-48 object-contain shadow-md border border-border" />
        </div>
    );
};

const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const BackgroundOverlay = ({ subject }: { subject: 'UK Geography' | 'UK History' }) => {
    const bgImg = subject === 'UK Geography' ? kailashImg : historyImg;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none rounded-[2rem]">
            {/* Full-color photo background — clearly visible like Gita/Kabir quote cards */}
            <img
                src={bgImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-[0.45] dark:opacity-[0.38]"
            />
            {/* Gradient mask over the photo to keep text readable */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/20 to-background/40 dark:from-background/85 dark:via-background/60 dark:to-background/85" />

            {/* Vector overlay elements on top of the image watermark */}
            <div className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18]">
                <svg viewBox="0 0 1440 600" width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
                    {subject === 'UK Geography' ? (
                        <>
                            {/* Layered mountain peaks */}
                            <path d="M0,480 L250,180 L500,420 L850,120 L1200,460 L1440,280 L1440,600 L0,600 Z" fill="currentColor" className="text-emerald-600/35 dark:text-emerald-500/15" />
                            <path d="M0,520 L350,300 L700,490 L1050,220 L1440,510 L1440,600 L0,600 Z" fill="currentColor" className="text-teal-600/45 dark:text-teal-500/25" />

                            {/* Flowing rivers */}
                            <path d="M0,540 Q360,490 720,550 T1440,520 L1440,600 L0,600 Z" fill="currentColor" className="text-cyan-400/50 dark:text-cyan-500/30" />
                            <path d="M0,570 Q360,530 720,580 T1440,550 L1440,600 L0,600 Z" fill="currentColor" className="text-blue-500/60 dark:text-blue-600/45" />

                            {/* Pine tree outlines on mountains */}
                            <path d="M120,420 L125,405 L130,420 Z M123,410 L127,410 L125,395 Z" fill="currentColor" className="text-emerald-800/40 dark:text-emerald-300/20" />
                            <path d="M220,400 L225,385 L230,400 Z M223,390 L227,390 L225,375 Z" fill="currentColor" className="text-emerald-800/40 dark:text-emerald-300/20" />
                            <path d="M620,480 L625,465 L630,480 Z M623,470 L627,470 L625,455 Z" fill="currentColor" className="text-emerald-800/40 dark:text-emerald-300/20" />
                            <path d="M980,380 L985,365 L990,380 Z M983,370 L987,370 L985,355 Z" fill="currentColor" className="text-emerald-800/40 dark:text-emerald-300/20" />

                            {/* Soil contour lines representing earth layers */}
                            <path d="M1000,480 Q1150,450 1350,510" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4,8" fill="none" className="text-amber-800/30 dark:text-amber-600/20" />
                            <path d="M1100,520 Q1220,500 1390,550" stroke="currentColor" strokeWidth="2" strokeDasharray="3,6" fill="none" className="text-amber-900/35 dark:text-amber-700/20" />
                        </>
                    ) : (
                        <>
                            {/* Fort walls / bastions representations (History) */}
                            <path d="M0,600 L0,430 L60,430 L60,450 L100,450 L100,430 L140,430 L140,450 L180,450 L180,470 L260,470 L300,600 Z" fill="currentColor" className="text-amber-800/25 dark:text-amber-600/10" />

                            {/* Temple silhouette with flags */}
                            <path d="M570,600 L570,440 L630,370 L690,440 L690,600 Z" fill="currentColor" className="text-amber-850/30 dark:text-amber-700/15" />
                            <path d="M620,370 L630,285 L640,370 Z" fill="currentColor" className="text-amber-500/40 dark:text-amber-400/25" />
                            <circle cx="630" cy="275" r="9" fill="currentColor" className="text-amber-500/60 dark:text-amber-400/40" />
                            <path d="M630,285 L655,295 L630,305 Z" fill="currentColor" className="text-orange-600/60 dark:text-orange-500/45" />

                            {/* Tree for Chipko movement */}
                            <path d="M1120,600 L1120,440 Q1080,380 1120,330 Q1160,290 1200,340 Q1240,385 1160,440 L1160,600 Z" fill="currentColor" className="text-amber-900/35 dark:text-amber-800/15" />
                            <circle cx="1140" cy="310" r="55" fill="currentColor" className="text-emerald-800/25 dark:text-emerald-700/15" />
                            <circle cx="1190" cy="330" r="45" fill="currentColor" className="text-emerald-800/20 dark:text-emerald-700/10" />

                            {/* People silhouettes hugging the tree (Activism / Protest) */}
                            {/* Person 1 Left */}
                            <circle cx="1085" cy="495" r="10" fill="currentColor" className="text-amber-950/40 dark:text-amber-600/25" />
                            <path d="M1065,600 L1070,530 Q1085,510 1100,530 L1105,600 Z" fill="currentColor" className="text-amber-950/40 dark:text-amber-600/25" />
                            <path d="M1085,530 Q1105,515 1125,495" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" className="text-amber-900/45 dark:text-amber-600/30" />

                            {/* Person 2 Right */}
                            <circle cx="1195" cy="500" r="10" fill="currentColor" className="text-amber-950/40 dark:text-amber-600/25" />
                            <path d="M1175,600 L1180,535 Q1195,515 1210,535 L1215,600 Z" fill="currentColor" className="text-amber-950/40 dark:text-amber-600/25" />
                            <path d="M1195,535 Q1175,520 1155,500" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" className="text-amber-900/45 dark:text-amber-600/30" />

                            {/* Warfare elements (Crossed swords and shield in the bottom left) */}
                            <circle cx="280" cy="520" r="30" fill="none" stroke="currentColor" strokeWidth="5" className="text-amber-850/45 dark:text-amber-700/25" />
                            <circle cx="280" cy="520" r="20" fill="currentColor" className="text-amber-850/20 dark:text-amber-700/10" />
                            <path d="M230,570 L330,470 M320,460 L340,480" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-amber-700/60 dark:text-amber-600/35" />
                            <path d="M230,470 L330,570 M220,480 L240,460" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-amber-700/60 dark:text-amber-600/35" />

                            {/* Sacred Golden Sun */}
                            <circle cx="720" cy="180" r="75" fill="currentColor" className="text-amber-400/20 dark:text-amber-500/10" />
                            <path d="M720,100 L720,80 M720,260 L720,280 M640,180 L620,180 M800,180 L820,180 M665,125 L650,110 M775,235 L790,250 M665,235 L650,250 M775,125 L790,110" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-amber-400/40 dark:text-amber-500/25" />
                        </>
                    )}
                </svg>
            </div>
        </div>
    );
};




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
    const [activeTab, setActiveTab] = useState<'visual' | 'slides' | 'notes'>('visual');

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
    const [revisionCards, setRevisionCards] = useState<string[]>([]);
    const [progressFilter, setProgressFilter] = useState<'all' | 'learned' | 'revision' | 'unlearned'>('all');
    const containerRef = useRef<HTMLDivElement>(null);

    // Notes Inside Flashcard State
    const [selectedNotesSubject, setSelectedNotesSubject] = useState<'UK Geography' | 'UK History'>('UK Geography');
    const [selectedNotesTopic, setSelectedNotesTopic] = useState<string>('');
    const [notesIndex, setNotesIndex] = useState<number>(0);
    const [isNotesFlipped, setIsNotesFlipped] = useState<boolean>(false);
    const [notesLearnedCards, setNotesLearnedCards] = useState<string[]>([]);
    const [notesRevisionCards, setNotesRevisionCards] = useState<string[]>([]);

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
        // Load revision card records
        const savedRevision = localStorage.getItem('revision_visual_cards');
        if (savedRevision) {
            try {
                setRevisionCards(JSON.parse(savedRevision));
            } catch (e) {
                console.error(e);
            }
        }
        // Load notes progress
        const savedNotesLearned = localStorage.getItem('learned_notes_cards');
        if (savedNotesLearned) {
            try {
                setNotesLearnedCards(JSON.parse(savedNotesLearned));
            } catch (e) {
                console.error(e);
            }
        }
        const savedNotesRevision = localStorage.getItem('revision_notes_cards');
        if (savedNotesRevision) {
            try {
                setNotesRevisionCards(JSON.parse(savedNotesRevision));
            } catch (e) {
                console.error(e);
            }
        }
    }, [fetchDocuments]);

    const getCardKey = useCallback((card: any) => {
        if (!card) return '';
        return `${card.topic}_${card.front.slice(0, 30)}`;
    }, []);

    const toggleNotesLearned = (cardKey: string) => {
        setNotesLearnedCards(prev => {
            const next = prev.includes(cardKey)
                ? prev.filter(id => id !== cardKey)
                : [...prev, cardKey];
            localStorage.setItem('learned_notes_cards', JSON.stringify(next));
            return next;
        });
    };

    const toggleNotesRevision = (cardKey: string) => {
        setNotesRevisionCards(prev => {
            const next = prev.includes(cardKey)
                ? prev.filter(id => id !== cardKey)
                : [...prev, cardKey];
            localStorage.setItem('revision_notes_cards', JSON.stringify(next));
            return next;
        });
    };

    const activeNotesDataset = useMemo(() => {
        return selectedNotesSubject === 'UK Geography' ? ukGeographyFlashcards : ukHistoryFlashcards;
    }, [selectedNotesSubject]);

    const notesTopics = useMemo(() => {
        const topics = new Set<string>();
        activeNotesDataset.forEach((card: any) => {
            if (card.topic) {
                topics.add(card.topic);
            }
        });
        return Array.from(topics);
    }, [activeNotesDataset]);

    const notesCardsToDisplay = useMemo(() => {
        if (!selectedNotesTopic) return [];
        return activeNotesDataset.filter((card: any) => card.topic === selectedNotesTopic);
    }, [selectedNotesTopic, activeNotesDataset]);

    // Set default topic on load or subject change
    useEffect(() => {
        if (notesTopics.length > 0) {
            if (!notesTopics.includes(selectedNotesTopic)) {
                setSelectedNotesTopic(notesTopics[0]);
            }
        } else {
            setSelectedNotesTopic('');
        }
    }, [notesTopics, selectedNotesTopic]);

    // Reset notesIndex and isNotesFlipped on topic change
    useEffect(() => {
        setNotesIndex(0);
        setIsNotesFlipped(false);
    }, [selectedNotesTopic]);

    // Keyboard navigation for notes
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeTab !== 'notes') return;
            if (e.key === 'ArrowRight') {
                if (notesIndex < notesCardsToDisplay.length - 1) {
                    setNotesIndex(prev => prev + 1);
                    setIsNotesFlipped(false);
                }
            } else if (e.key === 'ArrowLeft') {
                if (notesIndex > 0) {
                    setNotesIndex(prev => prev - 1);
                    setIsNotesFlipped(false);
                }
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setIsNotesFlipped(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, notesIndex, notesCardsToDisplay.length]);


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

    // Reset visual index when switching progress filter
    useEffect(() => {
        setVisualIndex(0);
        setVisualScale(1.0);
    }, [progressFilter]);

    const cardsToDisplay = useMemo(() => {
        let list = scannedCards.length > 0 ? scannedCards : mockCards;
        if (selectedSubject !== 'All') {
            list = list.filter(c => c.subject.toLowerCase() === selectedSubject.toLowerCase());
        }
        if (selectedTopic !== 'All Topics') {
            list = list.filter(c => c.topic && c.topic.toLowerCase() === selectedTopic.toLowerCase());
        }

        // Progress status filtering of cards:
        if (progressFilter === 'learned') {
            list = list.filter(c => learnedCards.includes(c.id));
        } else if (progressFilter === 'revision') {
            list = list.filter(c => revisionCards.includes(c.id));
        } else if (progressFilter === 'unlearned') {
            list = list.filter(c => !learnedCards.includes(c.id));
        }

        return list;
    }, [scannedCards, selectedSubject, selectedTopic, mockCards, progressFilter, learnedCards, revisionCards]);

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

    const toggleRevision = (cardId: string) => {
        setRevisionCards(prev => {
            const next = prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId];
            localStorage.setItem('revision_visual_cards', JSON.stringify(next));
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
                    <div className="flex p-1 bg-muted rounded-2xl border border-border/50 max-w-md w-full mt-2">
                        <button
                            onClick={() => { setActiveTab('visual'); setSelectedDoc(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
                                activeTab === 'visual'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ImageIcon className="w-4 h-4" />
                            Visual Cards
                        </button>
                        <button
                            onClick={() => { setActiveTab('notes'); setSelectedDoc(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
                                activeTab === 'notes'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab('slides')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200",
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

                            {/* Option selection row */}
                            <div className="flex flex-wrap items-center gap-4 pt-2.5 border-t border-border/10">
                                {/* Topic Selector */}
                                {availableTopics.length > 1 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Topic:</span>
                                        <div className="relative inline-block w-44">
                                            <select
                                                value={selectedTopic}
                                                onChange={(e) => setSelectedTopic(e.target.value)}
                                                className="w-full bg-card hover:bg-muted/50 border border-border/60 text-foreground text-xs font-bold py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                            >
                                                {availableTopics.map((topic) => (
                                                    <option key={topic} value={topic} className="bg-card text-foreground">
                                                        {topic}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-muted-foreground">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Status Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Filter:</span>
                                    <div className="relative inline-block w-48 font-semibold">
                                        <select
                                            value={progressFilter}
                                            onChange={(e) => setProgressFilter(e.target.value as any)}
                                            className="w-full bg-card hover:bg-muted/50 border border-border/60 text-foreground text-xs font-bold py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                        >
                                            <option value="all">All Study Cards</option>
                                            <option value="learned">Learned Cards Only</option>
                                            <option value="revision">Need Revision Only</option>
                                            <option value="unlearned">Unlearned Cards Only</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-muted-foreground">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                        title="Mark this card as learned"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {learnedCards.includes(currentVisualCard.id) ? "Learned" : "Mark Learned"}
                                    </button>

                                    {/* Need Revision */}
                                    <button
                                        onClick={() => toggleRevision(currentVisualCard.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                            revisionCards.includes(currentVisualCard.id)
                                                ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                                                : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                                        )}
                                        title="Flag this card for revision"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {revisionCards.includes(currentVisualCard.id) ? "Needs Revision" : "Need Revision"}
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
                                {progressFilter !== 'all'
                                    ? `There are no visual cards matching the status "${progressFilter === 'revision' ? 'need revision' : progressFilter}" for subject "${selectedSubject}".`
                                    : `There are no visual cards matching the subject "${selectedSubject}". Change subject filter or add new content.`}
                            </p>
                        </div>
                    )}

                    {/* Interactive Guideline box for assets location */}

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

            {/* TAB 3: NOTES INSIDE FLASHCARDS */}
            {activeTab === 'notes' && (() => {
                const theme = selectedNotesSubject === 'UK Geography' ? {
                    gradient: "from-sky-500/10 via-cyan-500/5 to-card dark:from-cyan-950/20 dark:via-indigo-950/10 dark:to-card",
                    bgBadge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/10",
                    footerLabel: "uk-geography-notes",
                    titleIcon: "🌍",
                    titleLabel: "Uttarakhand Geography Notes",
                    category: "Category: UK Geography"
                } : {
                    gradient: "from-amber-500/12 via-orange-500/5 to-card dark:from-amber-950/25 dark:via-orange-950/10 dark:to-card",
                    bgBadge: "bg-amber-500/10 text-amber-500 border-amber-500/10",
                    footerLabel: "uk-history-notes",
                    titleIcon: "📜",
                    titleLabel: "Uttarakhand History Notes",
                    category: "Category: UK History"
                };

                return (
                    <div className="space-y-6">
                        {/* Subject & Sub-section Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/40">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Subject selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Subject:</span>
                                    <div className="relative inline-block w-40 font-semibold border-none">
                                        <select
                                            value={selectedNotesSubject}
                                            onChange={(e) => setSelectedNotesSubject(e.target.value as any)}
                                            className="w-full bg-card hover:bg-muted/50 border border-border/60 text-foreground text-xs font-bold py-2.5 px-3.5 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                        >
                                            <option value="UK Geography">UK Geography</option>
                                            <option value="UK History">UK History</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-muted-foreground">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sub-section label */}
                                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border", theme.bgBadge)}>
                                    <Award className="w-3.5 h-3.5" />
                                    New Section Notes
                                </div>

                                {/* Category badge */}
                                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border", theme.bgBadge)}>
                                    {theme.category}
                                </div>
                            </div>

                            {/* Top progress stats */}
                            <div className="text-xs font-bold gap-3 flex items-center text-muted-foreground">
                                <span>Completed Topics:</span>
                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-lg font-black">
                                    {notesLearnedCards.filter(c => c.startsWith('topic_learned_')).length} of {notesTopics.length}
                                </span>
                            </div>
                        </div>

                        {/* Topic selector */}
                        <div className="flex flex-col gap-3 bg-muted/20 p-4 rounded-3xl border border-border/50">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
                                <span className="text-xs uppercase font-black tracking-widest text-muted-foreground whitespace-nowrap">
                                    Selected Topic ({notesTopics.indexOf(selectedNotesTopic) + 1}/{notesTopics.length}):
                                </span>
                                <div className="relative flex-1 min-w-[200px]">
                                    <select
                                        value={selectedNotesTopic}
                                        onChange={(e) => setSelectedNotesTopic(e.target.value)}
                                        className="w-full bg-card hover:bg-muted/50 border border-border/60 text-foreground text-xs font-bold py-2.5 px-4 pr-10 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/45 transition-all shadow-sm"
                                    >
                                        {notesTopics.map((topic, i) => (
                                            <option key={topic} value={topic}>
                                                {`${i + 1}. ${topic}`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-muted-foreground">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Topic navigation buttons */}
                            <div className="flex items-center justify-between border-t border-border/20 pt-3">
                                <button
                                    onClick={() => {
                                        const idx = notesTopics.indexOf(selectedNotesTopic);
                                        if (idx > 0) {
                                            setSelectedNotesTopic(notesTopics[idx - 1]);
                                        }
                                    }}
                                    disabled={notesTopics.indexOf(selectedNotesTopic) <= 0}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous Topic
                                </button>

                                {/* Mark Topic Completed */}
                                <button
                                    onClick={() => {
                                        const topicKey = `topic_learned_${selectedNotesTopic}`;
                                        toggleNotesLearned(topicKey);
                                    }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border",
                                        notesLearnedCards.includes(`topic_learned_${selectedNotesTopic}`)
                                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                                    )}
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    {notesLearnedCards.includes(`topic_learned_${selectedNotesTopic}`) ? "Topic Completed" : "Mark Topic Completed"}
                                </button>

                                <button
                                    onClick={() => {
                                        const idx = notesTopics.indexOf(selectedNotesTopic);
                                        if (idx < notesTopics.length - 1) {
                                            setSelectedNotesTopic(notesTopics[idx + 1]);
                                        }
                                    }}
                                    disabled={notesTopics.indexOf(selectedNotesTopic) >= notesTopics.length - 1}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                                >
                                    Next Topic <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Subject-Themed Notes Container */}
                        <div className={cn("relative rounded-[2rem] border border-border/80 p-6 md:p-8 shadow-xl min-h-[500px] overflow-hidden flex flex-col justify-between bg-gradient-to-br", theme.gradient)}>
                            {/* Interactive Geography/History SVG background overlay */}
                            <BackgroundOverlay subject={selectedNotesSubject} />

                            <div className="relative z-10 space-y-6 flex-1">
                                {/* Topic Title */}
                                <div className="flex items-start justify-between border-b border-border/30 pb-4 mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                            <span className="text-sm select-none">{theme.titleIcon}</span> {theme.titleLabel}
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-foreground pr-10 leading-snug">
                                            {selectedNotesTopic}
                                        </h2>
                                    </div>
                                    <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest border border-primary/10 whitespace-nowrap self-start">
                                        {notesCardsToDisplay.length} Notes Section{notesCardsToDisplay.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Notes Blocks */}
                                <div className="space-y-6 pr-1 custom-scrollbar">
                                    {notesCardsToDisplay.length > 0 ? (
                                        notesCardsToDisplay.map((card: any, idx: number) => (
                                            <div key={idx} className="space-y-4 bg-background/50 hover:bg-background/85 p-5 md:p-6 rounded-2xl border border-border/40 hover:border-primary/20 transition-all shadow-sm group">
                                                {/* Concept/Title block if it isn't matching generic labels */}
                                                {card.front && !card.front.startsWith('Key Facts:') && !card.front.startsWith('Details:') && (
                                                    <h3 className="text-base font-extrabold text-foreground border-l-2 border-primary pl-3 py-0.5 leading-relaxed group-hover:text-primary transition-colors">
                                                        {card.front}
                                                    </h3>
                                                )}

                                                {/* Bullet points & formatted texts */}
                                                <div className="space-y-3 pl-0.5">
                                                    {card.back_bullets && card.back_bullets.map((bullet: string, bIdx: number) => {
                                                        if (bullet.trim() === '--' || bullet.trim() === '') return null;
                                                        if (isImage(bullet)) {
                                                            return <div key={bIdx}>{renderImage(bullet)}</div>;
                                                        }

                                                        // Extract emoji at starting if direct
                                                        const emojiMatch = bullet.match(/^\s*([\uD800-\uDBFF][\uDC00-\uDFFF])/);
                                                        const emoji = emojiMatch ? emojiMatch[1] : '📌';
                                                        const textContent = emojiMatch ? bullet.replace(/^\s*([\uD800-\uDBFF][\uDC00-\uDFFF])\s*/, '') : bullet;

                                                        return (
                                                            <div key={bIdx} className="flex gap-3 items-start p-3 bg-muted/10 hover:bg-muted/20 rounded-xl border border-border/20 transition-colors">
                                                                <span className="text-lg flex-shrink-0 select-none">{emoji}</span>
                                                                <span className="text-sm font-medium leading-relaxed text-card-foreground">
                                                                    {renderFormattedText(textContent)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground italic">No details found for this topic.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer styling */}
                            <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest pt-5 border-t border-border/30 mt-6 select-none">
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Active Recall Study Mode
                                </span>
                                <span>{theme.footerLabel}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
