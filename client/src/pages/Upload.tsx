import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload as UploadIcon,
    FileText,
    Image as ImageIcon,
    File as LucideFile,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    Eye,
    Trash2,
    FolderOpen,
    RefreshCw,
    Download,
    FileImage,
    FileType2,
    BookOpen
} from 'lucide-react';
import { useDocumentStore, DocumentInfo } from '../stores/documentStore';
import { cn } from '../lib/utils';
import DocumentViewer from '../components/DocumentViewer';

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    documentId?: string;
}

interface ViewerTarget {
    docId: string;
    fileName: string;
    fileType: string;
}

const FILE_COLORS: Record<string, string> = {
    'application/pdf': 'from-red-500/20 to-red-600/10 border-red-500/30',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    'text/plain': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    'image/': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
};

const FILE_ICON_COLORS: Record<string, string> = {
    'application/pdf': 'text-red-400',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-400',
    'text/plain': 'text-emerald-400',
};

function getFileGradient(fileType: string) {
    if (fileType.startsWith('image/')) return FILE_COLORS['image/'];
    return FILE_COLORS[fileType] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
}

function getFileIconColor(fileType: string) {
    if (fileType.startsWith('image/')) return 'text-purple-400';
    return FILE_ICON_COLORS[fileType] || 'text-muted-foreground';
}

function getFileTypeLabel(fileType: string) {
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (fileType === 'text/plain') return 'TXT';
    if (fileType.startsWith('image/')) return fileType.split('/')[1].toUpperCase();
    return 'FILE';
}

function DocIcon({ fileType, className }: { fileType: string; className?: string }) {
    const color = getFileIconColor(fileType);
    if (fileType === 'application/pdf') return <FileText className={cn(color, className)} />;
    if (fileType.startsWith('image/')) return <FileImage className={cn(color, className)} />;
    if (fileType === 'text/plain') return <FileType2 className={cn(color, className)} />;
    if (fileType.includes('wordprocessingml')) return <BookOpen className={cn(color, className)} />;
    return <LucideFile className={cn(color, className)} />;
}

export default function Upload() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [viewerTarget, setViewerTarget] = useState<ViewerTarget | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { uploadFile, documents, fetchDocuments, deleteDocument, error } = useDocumentStore();

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
            file,
            status: 'pending' as const,
            progress: 0
        }));
        setFiles(prev => [...prev, ...newFiles]);

        for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            const fileIndex = files.length + i;

            setFiles(prev => prev.map((f, idx) =>
                idx === fileIndex ? { ...f, status: 'uploading' as const } : f
            ));

            try {
                await uploadFile(file);
                await fetchDocuments();
                setFiles(prev => prev.map((f, idx) =>
                    idx === fileIndex ? { ...f, status: 'success' as const, progress: 100 } : f
                ));
                // Auto-clear success entry after 3s
                setTimeout(() => {
                    setFiles(prev => prev.filter((_, idx) => idx !== fileIndex));
                }, 3000);
            } catch (err: any) {
                setFiles(prev => prev.map((f, idx) =>
                    idx === fileIndex ? { ...f, status: 'error' as const, error: err.message } : f
                ));
            }
        }
    }, [files.length, uploadFile, fetchDocuments]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxSize: 50 * 1024 * 1024
    });

    const removeUploadEntry = (index: number) => {
        setFiles(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleDelete = async (docId: string) => {
        setDeletingId(docId);
        try {
            await deleteDocument(docId);
        } finally {
            setDeletingId(null);
        }
    };

    const openViewer = (doc: DocumentInfo) => {
        setViewerTarget({
            docId: doc.id,
            fileName: doc.fileName,
            fileType: doc.fileType
        });
    };

    const handleDownload = (doc: DocumentInfo) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const url = `http://localhost:3001/api/documents/${doc.id}/file`;
        const a = document.createElement('a');
        a.href = url + (token ? `?t=${token}` : '');
        a.download = doc.fileName;
        a.click();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-1">My Documents</h1>
                    <p className="text-muted-foreground">
                        Upload and view your study materials — PDF, Word, TXT, or images
                    </p>
                </div>
                <button
                    onClick={() => fetchDocuments()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Dropzone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-3xl p-10 transition-all duration-500 cursor-pointer overflow-hidden group",
                    isDragActive
                        ? "border-primary bg-primary/10 scale-[1.01] shadow-2xl shadow-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg hover:-translate-y-0.5"
                )}
                {...getRootProps()}
            >
                <input {...getInputProps()} />

                {/* Animated glow on drag */}
                {isDragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />
                )}

                <div className="text-center relative z-10">
                    <motion.div
                        animate={isDragActive ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={cn(
                            "w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-all duration-500 shadow-sm",
                            isDragActive
                                ? "bg-gradient-to-br from-primary to-purple-600 shadow-primary/30"
                                : "bg-muted group-hover:bg-primary/10"
                        )}
                    >
                        <UploadIcon className={cn(
                            "w-10 h-10 transition-colors duration-500",
                            isDragActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                        )} />
                    </motion.div>

                    <h3 className="text-xl font-semibold mb-2">
                        {isDragActive ? "Drop files here!" : "Drag & drop files here"}
                    </h3>
                    <p className="text-muted-foreground mb-5 text-sm">
                        or click to browse from your computer
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { label: 'PDF', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                            { label: 'DOCX', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                            { label: 'TXT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                            { label: 'PNG / JPG', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                        ].map(({ label, color }) => (
                            <span key={label} className={cn("px-3 py-1 rounded-full text-xs font-medium border", color)}>
                                {label}
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">Max file size: 50MB</p>
                </div>
            </div>
            </motion.div>

            {/* Upload queue */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="space-y-3"
                    >
                        <h3 className="font-semibold text-base flex items-center gap-2">
                            <UploadIcon className="w-4 h-4 text-primary" />
                            Upload Queue
                        </h3>
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.file.name}-${index}`}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border bg-card/60 backdrop-blur-sm",
                                    file.status === 'success' ? "border-green-500/30" :
                                    file.status === 'error' ? "border-red-500/30" : "border-border"
                                )}
                            >
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                    <DocIcon fileType={file.file.type} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{file.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.file.size / 1024 / 1024).toFixed(2)} MB · {getFileTypeLabel(file.file.type)}
                                    </p>
                                    {file.status === 'uploading' && (
                                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                                initial={{ width: '5%' }}
                                                animate={{ width: '90%' }}
                                                transition={{ duration: 3, ease: 'easeOut' }}
                                            />
                                        </div>
                                    )}
                                    {file.status === 'error' && (
                                        <p className="text-xs text-red-400 mt-1">{file.error}</p>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    {file.status === 'uploading' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                                    {file.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {file.status === 'error' && (
                                        <button onClick={() => removeUploadEntry(index)} className="p-1 rounded-lg hover:bg-muted">
                                            <X className="w-5 h-5 text-red-400" />
                                        </button>
                                    )}
                                    {file.status === 'pending' && (
                                        <button onClick={() => removeUploadEntry(index)} className="p-1 rounded-lg hover:bg-muted">
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 text-sm"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Document library */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Your Documents</h2>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {documents.length}
                    </span>
                </div>

                {documents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                            <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground font-medium">No documents yet</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Upload your first file above to get started</p>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {documents.map((doc: DocumentInfo, idx: number) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={cn(
                                        "group relative rounded-3xl border bg-gradient-to-br p-5 flex flex-col gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                                        getFileGradient(doc.fileType)
                                    )}
                                >
                                    {/* Type badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white/70 uppercase tracking-wider">
                                            {getFileTypeLabel(doc.fileType)}
                                        </span>
                                    </div>

                                    {/* Icon + name */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center flex-shrink-0">
                                            <DocIcon fileType={doc.fileType} className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <h4 className="font-semibold text-sm leading-tight truncate pr-10">
                                                {doc.fileName}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 mt-auto">
                                        {/* Open/View */}
                                        <button
                                            onClick={() => openViewer(doc)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-black/25 hover:bg-primary hover:text-white text-sm font-medium transition-all duration-200 group/btn"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Open
                                        </button>

                                        {/* Download */}
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            title="Download"
                                            className="p-2 rounded-xl bg-black/25 hover:bg-white/20 transition-colors duration-200"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={deletingId === doc.id}
                                            title="Delete"
                                            className="p-2 rounded-xl bg-black/25 hover:bg-red-500/40 hover:text-red-300 transition-colors duration-200 disabled:opacity-40"
                                        >
                                            {deletingId === doc.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Document Viewer Modal */}
            <AnimatePresence>
                {viewerTarget && (
                    <DocumentViewer
                        docId={viewerTarget.docId}
                        fileName={viewerTarget.fileName}
                        fileType={viewerTarget.fileType}
                        onClose={() => setViewerTarget(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
