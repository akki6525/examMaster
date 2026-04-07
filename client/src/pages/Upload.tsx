import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload as UploadIcon,
    FileText,
    Image,
    File as LucideFile,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    Sparkles,
    Play
} from 'lucide-react';
import { useDocumentStore, DocumentInfo } from '../stores/documentStore';
import { useTestStore } from '../stores/testStore';
import { cn } from '../lib/utils';

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    documentId?: string;
}

export default function Upload() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);

    const { uploadFile, documents, fetchDocuments, error } = useDocumentStore();
    const { generateTest } = useTestStore();
    const navigate = useNavigate();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
            file,
            status: 'pending',
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Upload each file
        for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            const fileIndex = files.length + i;

            setFiles(prev => prev.map((f, idx) =>
                idx === fileIndex ? { ...f, status: 'uploading' } : f
            ));

            try {
                await uploadFile(file);
                await fetchDocuments();

                setFiles(prev => prev.map((f, idx) =>
                    idx === fileIndex ? { ...f, status: 'success', progress: 100 } : f
                ));
            } catch (err: any) {
                setFiles(prev => prev.map((f, idx) =>
                    idx === fileIndex ? { ...f, status: 'error', error: err.message } : f
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
        maxSize: 50 * 1024 * 1024 // 50MB
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, idx) => idx !== index));
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return Image;
        if (type === 'application/pdf') return FileText;
        return LucideFile;
    };

    const toggleDocSelection = (docId: string) => {
        setSelectedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleGenerateTest = async () => {
        if (selectedDocs.length === 0) return;

        setGenerating(true);
        try {
            const testId = await generateTest(selectedDocs, {
                questionCount: 20,
                duration: 30
            });
            navigate(`/test/${testId}`);
        } catch (err) {
            console.error('Failed to generate test:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
                <p className="text-muted-foreground">
                    Upload your study materials (PDF, DOCX, TXT, or images) to generate intelligent mock tests
                </p>
            </div>

            {/* Dropzone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-500 cursor-pointer overflow-hidden group",
                    isDragActive
                        ? "border-primary bg-primary/10 scale-[1.02] shadow-xl shadow-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg hover:-translate-y-1"
                )}
                {...getRootProps()}
            >
                <input {...getInputProps()} />

                <div className="text-center relative z-10">
                    <div className={cn(
                        "w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-all duration-500 shadow-sm",
                        isDragActive ? "bg-gradient-to-br from-primary to-purple-600 scale-110 shadow-primary/30 rotate-3" : "bg-muted group-hover:bg-muted/80 group-hover:scale-105 group-hover:-rotate-3"
                    )}>
                        <UploadIcon className={cn(
                            "w-12 h-12 transition-colors duration-500",
                            isDragActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                        )} />
                    </div>

                    <h3 className="text-xl font-semibold mb-2">
                        {isDragActive ? "Drop files here" : "Drag & drop files here"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        or click to browse from your computer
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                        {['PDF', 'DOCX', 'TXT', 'Images'].map(type => (
                            <span key={type} className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                                {type}
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        Max file size: 50MB
                    </p>
                </div>

                {/* Animated border on drag */}
                {isDragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 rounded-3xl border-2 border-primary pointer-events-none"
                    />
                )}
            </motion.div>

            {/* Upload Progress */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                    >
                        <h3 className="font-semibold text-lg">Uploading Files</h3>

                        {files.map((file, index) => {
                            const FileIcon = getFileIcon(file.file.type);

                            return (
                                <motion.div
                                    key={`${file.file.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                        <FileIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>

                                        {file.status === 'uploading' && (
                                            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full gradient-primary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '70%' }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </div>
                                        )}

                                        {file.status === 'error' && (
                                            <p className="text-sm text-red-500 mt-1">{file.error}</p>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0">
                                        {file.status === 'uploading' && (
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        )}
                                        {file.status === 'success' && (
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        )}
                                        {file.status === 'error' && (
                                            <AlertCircle className="w-6 h-6 text-red-500" />
                                        )}
                                        {file.status === 'pending' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <X className="w-5 h-5 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Existing Documents */}
            {documents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Your Documents</h3>
                        {selectedDocs.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {selectedDocs.length} selected
                            </span>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {documents.map((doc: DocumentInfo) => (
                            <motion.div
                                key={doc.id}
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleDocSelection(doc.id)}
                                className={cn(
                                    "p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-xl",
                                    selectedDocs.includes(doc.id)
                                        ? "border-primary bg-primary/5 shadow-primary/10"
                                        : "border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/40"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-colors duration-500 pointer-events-none" />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 shadow-sm",
                                        selectedDocs.includes(doc.id) ? "bg-gradient-to-br from-primary to-purple-600 scale-105" : "bg-muted group-hover:bg-primary/10 group-hover:scale-110"
                                    )}>
                                        <FileText className={cn(
                                            "w-7 h-7 transition-colors",
                                            selectedDocs.includes(doc.id) ? "text-white" : "text-muted-foreground group-hover:text-primary"
                                        )} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate mb-1">{doc.fileName}</h4>
                                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                            <span>{doc.topicsCount} topics</span>
                                            <span>•</span>
                                            <span>{doc.definitionsCount} definitions</span>
                                            <span>•</span>
                                            <span>{doc.keyTermsCount} key terms</span>
                                        </div>
                                    </div>

                                    {selectedDocs.includes(doc.id) && (
                                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Generate Test Button */}
                    {selectedDocs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center pt-4"
                        >
                            <button
                                onClick={handleGenerateTest}
                                disabled={generating}
                                className="relative overflow-hidden group flex items-center gap-3 text-lg font-bold px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 flex items-center gap-3">
                                {generating ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Generating Test...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6" />
                                        Generate Mock Test
                                        <Play className="w-5 h-5" />
                                    </>
                                )}
                                </span>
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
