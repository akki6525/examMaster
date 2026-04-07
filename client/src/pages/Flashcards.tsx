import { useEffect, useState, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { motion } from 'framer-motion';
import {
    FileText,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    Download,
    Loader2
} from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';
import { cn } from '../lib/utils';

// Configure PDF.js worker - use local file to avoid CDN issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface ViewerDocument {
    id: string;
    fileName: string;
    fileType: string;
}

export default function Flashcards() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDoc, setSelectedDoc] = useState<ViewerDocument | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchDocuments();
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

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!selectedDoc) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                goToPage(currentPage + 1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                goToPage(currentPage - 1);
                break;
            case 'Escape':
                setIsFullscreen(false);
                break;
        }
    }, [selectedDoc, currentPage, numPages]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Filter only PDFs for now (DOCX viewer can be added later)
    const pdfDocuments = documents.filter(d =>
        d.fileType === 'application/pdf'
    );

    return (
        <div className={cn(
            "space-y-6",
            isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "max-w-5xl mx-auto"
        )}>
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    Document Viewer
                </h1>
                <p className="text-muted-foreground">
                    View your uploaded documents in slide mode
                </p>
            </div>

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

                        {/* Page dots / slider */}
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

                    {/* Keyboard shortcuts hint */}
                    <p className="text-center text-sm text-muted-foreground">
                        Use arrow keys or spacebar to navigate • Press Esc to exit fullscreen
                    </p>
                </motion.div>
            )}
        </div>
    );
}
