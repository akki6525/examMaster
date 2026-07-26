import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
    X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
    Maximize2, Minimize2, Search, FileText, Image as ImageIcon,
    File as FileIcon, Loader2, AlertCircle, RotateCw,
    Pencil, Highlighter, Eraser, MousePointer, RotateCcw, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';

// Use CDN worker URL for PDF.js (v5+ requires .mjs extension)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_URL = 'http://localhost:3001/api';

function getAuthHeader(): Record<string, string> {
    const authHeader = axios.defaults.headers.common['Authorization'] as string | undefined;
    return authHeader ? { Authorization: authHeader } : {};
}

export type AnnotationTool = 'select' | 'pen' | 'highlighter' | 'eraser';

export interface Point {
    x: number; // Normalized 0..1
    y: number; // Normalized 0..1
}

export interface Stroke {
    id: string;
    tool: 'pen' | 'highlighter';
    color: string;
    size: number;
    points: Point[];
}

const PEN_COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#f59e0b' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Dark', hex: '#1e293b' },
    { name: 'White', hex: '#ffffff' },
];

const HIGHLIGHTER_COLORS = [
    { name: 'Yellow', hex: '#facc15' },
    { name: 'Green', hex: '#4ade80' },
    { name: 'Pink', hex: '#f472b6' },
    { name: 'Cyan', hex: '#38bdf8' },
    { name: 'Orange', hex: '#fb923c' },
];

interface PageCanvasOverlayProps {
    pageNum: number;
    activeTool: AnnotationTool;
    color: string;
    size: number;
    strokes: Stroke[];
    onAddStroke: (pageNum: number, stroke: Stroke) => void;
    onEraseStroke: (pageNum: number, strokeId: string) => void;
}

function PageCanvasOverlay({
    pageNum,
    activeTool,
    color,
    size,
    strokes,
    onAddStroke,
    onEraseStroke,
}: PageCanvasOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef<boolean>(false);
    const currentPointsRef = useRef<Point[]>([]);

    // Redraw all strokes whenever canvas sizes or strokes update
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
            canvas.width = Math.round(rect.width);
            canvas.height = Math.round(rect.height);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        strokes.forEach(stroke => {
            if (!stroke.points || stroke.points.length === 0) return;

            ctx.save();
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;

            if (stroke.tool === 'highlighter') {
                ctx.globalAlpha = 0.45;
            } else {
                ctx.globalAlpha = 1.0;
            }

            const p0 = stroke.points[0];
            ctx.moveTo(p0.x * canvas.width, p0.y * canvas.height);

            for (let i = 1; i < stroke.points.length; i++) {
                const pt = stroke.points[i];
                ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
            }

            ctx.stroke();
            ctx.restore();
        });
    }, [strokes]);

    useEffect(() => {
        redraw();
    }, [strokes, redraw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(() => {
            redraw();
        });
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [redraw]);

    const getPos = (clientX: number, clientY: number): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
        };
    };

    const handleEraserAt = (pt: Point) => {
        const threshold = 0.035;
        strokes.forEach(stroke => {
            const hit = stroke.points.some(p => {
                const dx = p.x - pt.x;
                const dy = p.y - pt.y;
                return Math.sqrt(dx * dx + dy * dy) < threshold;
            });
            if (hit) {
                onEraseStroke(pageNum, stroke.id);
            }
        });
    };

    const startDrawing = (clientX: number, clientY: number) => {
        if (activeTool === 'select') return;
        const pt = getPos(clientX, clientY);
        if (!pt) return;

        if (activeTool === 'eraser') {
            isDrawingRef.current = true;
            handleEraserAt(pt);
            return;
        }

        isDrawingRef.current = true;
        currentPointsRef.current = [pt];

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalAlpha = activeTool === 'highlighter' ? 0.45 : 1.0;
        ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
    };

    const drawMove = (clientX: number, clientY: number) => {
        if (!isDrawingRef.current || activeTool === 'select') return;
        const pt = getPos(clientX, clientY);
        if (!pt) return;

        if (activeTool === 'eraser') {
            handleEraserAt(pt);
            return;
        }

        const pts = currentPointsRef.current;
        const lastPt = pts[pts.length - 1];
        pts.push(pt);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (lastPt) {
            ctx.save();
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.globalAlpha = activeTool === 'highlighter' ? 0.45 : 1.0;
            ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
            ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
            ctx.stroke();
            ctx.restore();
        }
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (activeTool === 'pen' || activeTool === 'highlighter') {
            const pts = currentPointsRef.current;
            if (pts.length > 0) {
                const newStroke: Stroke = {
                    id: Math.random().toString(36).substring(2, 9),
                    tool: activeTool,
                    color,
                    size,
                    points: [...pts],
                };
                onAddStroke(pageNum, newStroke);
            }
        }
        currentPointsRef.current = [];
    };

    return (
        <canvas
            ref={canvasRef}
            className={cn(
                "absolute inset-0 z-20 w-full h-full rounded-sm",
                activeTool === 'select' ? "pointer-events-none" : "pointer-events-auto touch-none",
                activeTool === 'pen' && "cursor-crosshair",
                activeTool === 'highlighter' && "cursor-crosshair",
                activeTool === 'eraser' && "cursor-pointer"
            )}
            onMouseDown={(e) => { e.preventDefault(); startDrawing(e.clientX, e.clientY); }}
            onMouseMove={(e) => { e.preventDefault(); drawMove(e.clientX, e.clientY); }}
            onMouseUp={(e) => { e.preventDefault(); stopDrawing(); }}
            onMouseLeave={() => stopDrawing()}
            onTouchStart={(e) => {
                if (activeTool === 'select') return;
                e.preventDefault();
                const t = e.touches[0];
                if (t) startDrawing(t.clientX, t.clientY);
            }}
            onTouchMove={(e) => {
                if (activeTool === 'select') return;
                e.preventDefault();
                const t = e.touches[0];
                if (t) drawMove(t.clientX, t.clientY);
            }}
            onTouchEnd={() => stopDrawing()}
            onTouchCancel={() => stopDrawing()}
        />
    );
}

interface DocumentViewerProps {
    docId: string;
    fileName: string;
    fileType: string;
    onClose: () => void;
}

type ViewerState = 'loading' | 'ready' | 'error';

export default function DocumentViewer({ docId, fileName, fileType, onClose }: DocumentViewerProps) {
    const [viewerState, setViewerState] = useState<ViewerState>('loading');
    const [errorMsg, setErrorMsg] = useState<string>('');

    // PDF state
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.1);
    const [pageInput, setPageInput] = useState<string>('1');
    const scrollRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Blob URL for images
    const [blobUrl, setBlobUrl] = useState<string>('');

    // Image state
    const [imgZoom, setImgZoom] = useState<number>(1);
    const [imgRotation, setImgRotation] = useState<number>(0);

    // Text state
    const [rawText, setRawText] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(false);

    // UI
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Annotation Canvas Tools state
    const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
    const [penColor, setPenColor] = useState<string>('#ef4444');
    const [penSize, setPenSize] = useState<number>(3);
    const [highlighterColor, setHighlighterColor] = useState<string>('#facc15');
    const [highlighterSize, setHighlighterSize] = useState<number>(20);
    const [annotations, setAnnotations] = useState<Record<number, Stroke[]>>({});
    const strokeHistoryRef = useRef<{ pageNum: number; stroke: Stroke }[]>([]);

    const isPDF  = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    const isText  = fileType === 'text/plain';
    const isDOCX  = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const fileEndpoint = `${API_URL}/documents/${docId}/file`;

    const pdfFileProp = useMemo(() => ({ url: fileEndpoint }), [fileEndpoint]);
    const pdfDocumentOptions = useMemo(() => ({ httpHeaders: getAuthHeader() }), [docId]);

    // ─── Fetch image as blob ────────────────────────────────────────────────
    useEffect(() => {
        if (!isImage) return;
        setViewerState('loading');
        axios.get(fileEndpoint, { headers: getAuthHeader(), responseType: 'blob' })
            .then(res => { setBlobUrl(URL.createObjectURL(res.data)); setViewerState('ready'); })
            .catch(err => { setErrorMsg(err.response?.data?.error || err.message); setViewerState('error'); });
        return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [docId, isImage]);

    // ─── Fetch text / DOCX raw text ─────────────────────────────────────────
    useEffect(() => {
        if (!isText && !isDOCX) return;
        setViewerState('loading');
        axios.get(`${API_URL}/documents/${docId}/raw-text`, { headers: getAuthHeader() })
            .then(res => { setRawText(res.data.rawText || '(No text content available)'); setViewerState('ready'); })
            .catch(err => { setErrorMsg(err.response?.data?.error || err.message); setViewerState('error'); });
    }, [docId, isText, isDOCX]);

    // ─── Annotation Canvas handlers ──────────────────────────────────────────
    const addStroke = (pageNum: number, stroke: Stroke) => {
        setAnnotations(prev => ({
            ...prev,
            [pageNum]: [...(prev[pageNum] || []), stroke],
        }));
        strokeHistoryRef.current.push({ pageNum, stroke });
    };

    const eraseStroke = (pageNum: number, strokeId: string) => {
        setAnnotations(prev => ({
            ...prev,
            [pageNum]: (prev[pageNum] || []).filter(s => s.id !== strokeId),
        }));
        strokeHistoryRef.current = strokeHistoryRef.current.filter(item => item.stroke.id !== strokeId);
    };

    const undoLastStroke = () => {
        const last = strokeHistoryRef.current.pop();
        if (!last) return;
        setAnnotations(prev => ({
            ...prev,
            [last.pageNum]: (prev[last.pageNum] || []).filter(s => s.id !== last.stroke.id),
        }));
    };

    const clearAllAnnotations = () => {
        setAnnotations({});
        strokeHistoryRef.current = [];
    };

    const strokeHistoryCount = useMemo(() => {
        return Object.values(annotations).reduce((acc, list) => acc + list.length, 0);
    }, [annotations]);

function escapeHtml(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

    // ─── Search highlight ───────────────────────────────────────────────────
    const highlightedText = useMemo(() => {
        const safeText = escapeHtml(rawText);
        if (!searchQuery.trim()) return safeText;
        const escapedSearch = escapeHtml(searchQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safeText.replace(
            new RegExp(`(${escapedSearch})`, 'gi'),
            '<mark style="background:#fbbf24;color:#1a1a1a;border-radius:2px;padding:0 2px">$1</mark>'
        );
    }, [rawText, searchQuery]);

    // ─── PDF callbacks ───────────────────────────────────────────────────────
    const onPdfLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        pageRefs.current = Array(numPages).fill(null);
        setViewerState('ready');
    };

    // ─── Scroll-based current page tracking ─────────────────────────────────
    useEffect(() => {
        if (!isPDF || numPages === 0) return;
        const container = scrollRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let best = currentPage;
                let bestRatio = 0;
                entries.forEach(entry => {
                    const idx = parseInt(entry.target.getAttribute('data-page') || '1');
                    if (entry.intersectionRatio > bestRatio) {
                        bestRatio = entry.intersectionRatio;
                        best = idx;
                    }
                });
                setCurrentPage(best);
                setPageInput(String(best));
            },
            { root: container, threshold: [0.3, 0.5, 0.7] }
        );

        pageRefs.current.forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [isPDF, numPages, scale]);

    // ─── Navigation ──────────────────────────────────────────────────────────
    const scrollToPage = useCallback((pageNum: number) => {
        const el = pageRefs.current[pageNum - 1];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const goToPrev = useCallback(() => {
        const p = Math.max(1, currentPage - 1);
        scrollToPage(p);
    }, [currentPage, scrollToPage]);

    const goToNext = useCallback(() => {
        const p = Math.min(numPages, currentPage + 1);
        scrollToPage(p);
    }, [currentPage, numPages, scrollToPage]);

    const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
        const n = parseInt(e.target.value);
        if (!isNaN(n) && n >= 1 && n <= numPages) scrollToPage(n);
    };

    const zoomIn  = () => isPDF ? setScale(s => Math.min(3, +(s + 0.2).toFixed(1))) : setImgZoom(z => Math.min(4, +(z + 0.25).toFixed(2)));
    const zoomOut = () => isPDF ? setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1))) : setImgZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)));
    const resetZoom = () => { setScale(1.1); setImgZoom(1); };

    // ─── Keyboard shortcuts ──────────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { if (isFullscreen) setIsFullscreen(false); else onClose(); }
            if (isPDF && viewerState === 'ready') {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext();
                if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToPrev();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                undoLastStroke();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isFullscreen, isPDF, viewerState, goToNext, goToPrev, onClose]);

    const getFileLabel = () => {
        if (isPDF)   return 'PDF Document';
        if (isImage) return 'Image';
        if (isDOCX)  return 'Word Document';
        if (isText)  return 'Text File';
        return 'Document';
    };

    const FileTypeIcon = () => {
        if (isPDF)   return <FileText className="w-4 h-4 text-red-400" />;
        if (isImage) return <ImageIcon className="w-4 h-4 text-purple-400" />;
        return <FileIcon className="w-4 h-4 text-blue-400" />;
    };

    const formattedText = useMemo(() => {
        if (!rawText) return [];
        return rawText
            .split(/\n{2,}/)
            .map(p => p.replace(/\n/g, ' ').trim())
            .filter(p => p.length > 0);
    }, [rawText]);

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* Viewer Panel */}
                <motion.div
                    key="panel"
                    initial={{ scale: 0.93, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    className={cn(
                        "flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden",
                        isFullscreen ? "fixed inset-2" : "w-[96vw] max-w-5xl h-[90vh]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ══ Header Toolbar ══ */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-[#161b27] flex-shrink-0 flex-wrap">
                        {/* File info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileTypeIcon />
                            <div className="min-w-0">
                                <p className="font-semibold text-sm text-white truncate leading-tight">{fileName}</p>
                                <p className="text-[10px] text-gray-500 leading-tight">{getFileLabel()}</p>
                            </div>
                        </div>

                        {/* PDF page navigation */}
                        {isPDF && numPages > 0 && (
                            <div className="flex items-center gap-1 text-sm text-gray-300 bg-white/5 rounded-xl px-2 py-1">
                                <button onClick={goToPrev} disabled={currentPage === 1}
                                    className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="number" value={pageInput} onChange={handlePageInput}
                                    min={1} max={numPages}
                                    className="w-9 text-center bg-transparent text-xs text-white focus:outline-none"
                                />
                                <span className="text-gray-500 text-xs">/ {numPages}</span>
                                <button onClick={goToNext} disabled={currentPage === numPages}
                                    className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Zoom */}
                        {(isPDF || isImage) && (
                            <div className="flex items-center gap-1 bg-white/5 rounded-xl px-1.5 py-1">
                                <button onClick={zoomOut} className="p-1 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
                                <button onClick={resetZoom} className="text-xs text-gray-300 hover:text-white min-w-[42px] text-center transition-colors">
                                    {isPDF ? `${Math.round(scale * 100)}%` : `${Math.round(imgZoom * 100)}%`}
                                </button>
                                <button onClick={zoomIn} className="p-1 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
                            </div>
                        )}

                        {/* Image rotate */}
                        {isImage && (
                            <button onClick={() => setImgRotation(r => (r + 90) % 360)}
                                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-colors" title="Rotate 90°">
                                <RotateCw className="w-4 h-4" />
                            </button>
                        )}

                        {/* Text search */}
                        {(isText || isDOCX) && (
                            <button onClick={() => setShowSearch(s => !s)}
                                className={cn("p-1.5 rounded-xl hover:bg-white/10 transition-colors",
                                    showSearch ? "text-primary bg-primary/20" : "text-gray-300")}
                                title="Search in document">
                                <Search className="w-4 h-4" />
                            </button>
                        )}

                        <div className="w-px h-5 bg-white/10" />

                        {/* Fullscreen */}
                        <button onClick={() => setIsFullscreen(f => !f)}
                            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        {/* Close */}
                        <button onClick={onClose}
                            className="p-1.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors ml-0.5"
                            title="Close (Esc)">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ══ Annotation Sub-Toolbar (Pen / Marker / Eraser / Colors) ══ */}
                    {(isPDF || isImage) && viewerState === 'ready' && (
                        <div className="flex items-center justify-between px-4 py-1.5 bg-[#121722] border-b border-white/10 flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 hidden sm:inline">Practice:</span>
                                <button
                                    onClick={() => setActiveTool('select')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                                        activeTool === 'select' ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white hover:bg-white/5")}
                                    title="Cursor / Select Mode"
                                >
                                    <MousePointer className="w-3.5 h-3.5" />
                                    <span>Select</span>
                                </button>

                                <button
                                    onClick={() => setActiveTool('pen')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                                        activeTool === 'pen' ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white hover:bg-white/5")}
                                    title="Pen Tool (Tick options & write notes)"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Pen</span>
                                </button>

                                <button
                                    onClick={() => setActiveTool('highlighter')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                                        activeTool === 'highlighter' ? "bg-amber-500 text-black font-bold shadow" : "text-gray-400 hover:text-white hover:bg-white/5")}
                                    title="Marker / Highlighter Tool"
                                >
                                    <Highlighter className="w-3.5 h-3.5" />
                                    <span>Marker</span>
                                </button>

                                <button
                                    onClick={() => setActiveTool('eraser')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors",
                                        activeTool === 'eraser' ? "bg-red-500/80 text-white shadow" : "text-gray-400 hover:text-white hover:bg-white/5")}
                                    title="Eraser Tool"
                                >
                                    <Eraser className="w-3.5 h-3.5" />
                                    <span>Eraser</span>
                                </button>
                            </div>

                            {/* Color swatches & Stroke size */}
                            {activeTool !== 'select' && activeTool !== 'eraser' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                        {(activeTool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS).map(c => (
                                            <button
                                                key={c.hex}
                                                onClick={() => activeTool === 'highlighter' ? setHighlighterColor(c.hex) : setPenColor(c.hex)}
                                                className={cn("w-4 h-4 rounded-full transition-transform hover:scale-125 border border-white/20",
                                                    (activeTool === 'highlighter' ? highlighterColor : penColor) === c.hex && "ring-2 ring-white scale-110")}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-lg border border-white/5 text-[11px] text-gray-300">
                                        <button
                                            onClick={() => activeTool === 'highlighter' ? setHighlighterSize(12) : setPenSize(2)}
                                            className={cn("px-1.5 py-0.5 rounded hover:bg-white/10",
                                                (activeTool === 'highlighter' ? highlighterSize === 12 : penSize === 2) && "bg-white/20 text-white font-bold")}
                                        >Fine</button>
                                        <button
                                            onClick={() => activeTool === 'highlighter' ? setHighlighterSize(24) : setPenSize(5)}
                                            className={cn("px-1.5 py-0.5 rounded hover:bg-white/10",
                                                (activeTool === 'highlighter' ? highlighterSize === 24 : penSize === 5) && "bg-white/20 text-white font-bold")}
                                        >Med</button>
                                        <button
                                            onClick={() => activeTool === 'highlighter' ? setHighlighterSize(36) : setPenSize(10)}
                                            className={cn("px-1.5 py-0.5 rounded hover:bg-white/10",
                                                (activeTool === 'highlighter' ? highlighterSize === 36 : penSize === 10) && "bg-white/20 text-white font-bold")}
                                        >Thick</button>
                                    </div>
                                </div>
                            )}

                            {/* Undo & Clear */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={undoLastStroke}
                                    disabled={strokeHistoryCount === 0}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                                    title="Undo last stroke (Ctrl+Z)"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Undo</span>
                                </button>

                                <button
                                    onClick={clearAllAnnotations}
                                    disabled={strokeHistoryCount === 0}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                                    title="Clear all annotations"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Clear All</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Text-search bar */}
                    {showSearch && (isText || isDOCX) && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#1c2333] border-b border-white/10 flex-shrink-0">
                            <Search className="w-3.5 h-3.5 text-gray-500" />
                            <input
                                autoFocus type="text" placeholder="Search in document..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ══ Content area (scrollable) ══ */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-auto relative"
                        style={{ background: isPDF ? '#525659' : '#0d1117' }}
                    >
                        {/* Generic loading */}
                        {viewerState === 'loading' && !isPDF && (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm">Loading {getFileLabel()}...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {viewerState === 'error' && (
                            <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white mb-1">Failed to load document</p>
                                    <p className="text-sm text-gray-400">{errorMsg}</p>
                                </div>
                            </div>
                        )}

                        {/* ── PDF — continuous scroll, ALL pages with Canvas Annotation Overlay ── */}
                        {isPDF && (
                            <div className="flex flex-col items-center py-6 gap-4">
                                <Document
                                    key={docId}
                                    file={pdfFileProp}
                                    onLoadSuccess={onPdfLoadSuccess}
                                    onLoadError={(err) => { setErrorMsg(err.message); setViewerState('error'); }}
                                    options={pdfDocumentOptions}
                                    loading={
                                        <div className="flex flex-col items-center justify-center py-40 gap-4 text-gray-400">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                            <p className="text-sm">Loading PDF...</p>
                                        </div>
                                    }
                                    error={
                                        <div className="flex flex-col items-center justify-center py-40 gap-3 text-gray-400">
                                            <AlertCircle className="w-8 h-8 text-red-400" />
                                            <p className="text-sm">Failed to render PDF</p>
                                        </div>
                                    }
                                >
                                    {numPages > 0 && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
                                        const isNearVisible = Math.abs(pageNum - currentPage) <= 3;
                                        const estimatedWidth = Math.round(595 * scale);
                                        const estimatedHeight = Math.round(842 * scale);

                                        return (
                                            <div
                                                key={pageNum}
                                                data-page={pageNum}
                                                ref={el => { pageRefs.current[pageNum - 1] = el; }}
                                                className="mb-4 relative shadow-2xl bg-white rounded-sm overflow-hidden"
                                                style={{ width: estimatedWidth, minHeight: estimatedHeight }}
                                            >
                                                {isNearVisible ? (
                                                    <>
                                                        <Page
                                                            pageNumber={pageNum}
                                                            scale={scale}
                                                            renderTextLayer
                                                            renderAnnotationLayer
                                                            loading={
                                                                <div
                                                                    className="flex items-center justify-center bg-white"
                                                                    style={{ width: estimatedWidth, height: estimatedHeight }}
                                                                >
                                                                    <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
                                                                </div>
                                                            }
                                                        />
                                                        <PageCanvasOverlay
                                                            pageNum={pageNum}
                                                            activeTool={activeTool}
                                                            color={activeTool === 'highlighter' ? highlighterColor : penColor}
                                                            size={activeTool === 'highlighter' ? highlighterSize : penSize}
                                                            strokes={annotations[pageNum] || []}
                                                            onAddStroke={addStroke}
                                                            onEraseStroke={eraseStroke}
                                                        />
                                                    </>
                                                ) : (
                                                    <div 
                                                        className="flex flex-col items-center justify-center bg-white text-gray-400 font-semibold text-sm select-none"
                                                        style={{ width: estimatedWidth, height: estimatedHeight }}
                                                    >
                                                        <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary/40" />
                                                        <span>Page {pageNum}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </Document>
                            </div>
                        )}

                        {/* ── Image with Canvas Annotation Overlay ── */}
                        {isImage && viewerState === 'ready' && blobUrl && (
                            <div
                                className="flex items-center justify-center min-h-full p-8"
                                style={{ cursor: imgZoom > 1 && activeTool === 'select' ? 'grab' : 'default' }}
                            >
                                <div className="relative inline-block">
                                    <img
                                        src={blobUrl}
                                        alt={fileName}
                                        draggable={false}
                                        style={{
                                            transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`,
                                            transformOrigin: 'center',
                                            transition: 'transform 0.2s ease',
                                            maxWidth: '100%',
                                            maxHeight: '80vh',
                                            borderRadius: '8px',
                                            boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
                                            userSelect: 'none',
                                        }}
                                    />
                                    <PageCanvasOverlay
                                        pageNum={1}
                                        activeTool={activeTool}
                                        color={activeTool === 'highlighter' ? highlighterColor : penColor}
                                        size={activeTool === 'highlighter' ? highlighterSize : penSize}
                                        strokes={annotations[1] || []}
                                        onAddStroke={addStroke}
                                        onEraseStroke={eraseStroke}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── TXT / DOCX — styled prose ── */}
                        {(isText || isDOCX) && viewerState === 'ready' && (
                            <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
                                <div className="mb-8 pb-6 border-b border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        {isDOCX
                                            ? <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                            : <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />}
                                        <h1 className="text-lg font-semibold text-white truncate">{fileName}</h1>
                                    </div>
                                    <p className="text-xs text-gray-500">{getFileLabel()} · {formattedText.length} paragraphs</p>
                                </div>

                                {rawText ? (
                                    searchQuery ? (
                                        <div
                                            className="text-gray-200 text-sm leading-7 whitespace-pre-wrap font-mono"
                                            style={{ wordBreak: 'break-word' }}
                                            dangerouslySetInnerHTML={{ __html: highlightedText }}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {formattedText.map((para, i) => {
                                                const isHeading = para.length < 80 && !para.endsWith('.') && para.length > 3
                                                    && (para === para.toUpperCase() || /^[A-Z][A-Za-z\s:–-]{3,60}$/.test(para));
                                                if (isHeading) {
                                                    return (
                                                        <h2 key={i} className="text-base font-bold text-white mt-6 mb-2 first:mt-0 border-l-2 border-primary pl-3">
                                                            {para}
                                                        </h2>
                                                    );
                                                }
                                                return (
                                                    <p key={i} className="text-gray-300 text-sm leading-7" style={{ wordBreak: 'break-word' }}>
                                                        {para}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                        <FileText className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">No readable text content found in this document</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ══ Fixed bottom bar ══ */}
                    {isPDF && numPages > 1 && viewerState === 'ready' && (
                        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-[#161b27] border-t border-white/10 flex-shrink-0">
                            <button
                                onClick={goToPrev}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300 text-xs"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Prev
                            </button>

                            <span className="text-xs text-gray-400">
                                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{numPages}</strong>
                            </span>

                            <button
                                onClick={goToNext}
                                disabled={currentPage === numPages}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-300 text-xs"
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
