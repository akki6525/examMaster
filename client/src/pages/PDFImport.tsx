import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    Loader2,
    Sparkles,
    BookOpen,
    ChevronDown,
    Eye,
    EyeOff,
    Save,
    RefreshCw,
    X,
    Check,
    Info,
    ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';

const API_BASE = 'http://localhost:3001/api';

const ALL_EXAM_TYPES = [
    { id: 'SSC CGL', name: 'SSC CGL' },
    { id: 'UPSC', name: 'UPSC Civil Services' },
    { id: 'UKPSC', name: 'UKPSC (Uttarakhand PCS)' },
    { id: 'UKPSC-PCS', name: 'UKPSC PCS Prelims/Mains' },
    { id: 'UKPSC-ROARO', name: 'UKPSC RO/ARO' },
    { id: 'UKSSSC', name: 'UKSSSC (Uttarakhand SSC)' },
    { id: 'UKSSSC-VDO', name: 'UKSSSC VDO/Gram Vikas' },
    { id: 'UKSSSC-Patwari', name: 'UKSSSC Patwari/Lekhpal' },
    { id: 'UKSSSC-Forest', name: 'UKSSSC Forest Guard' },
];

const TOPICS = [
    'General Studies', 'General Knowledge', 'History', 'Geography',
    'Polity & Governance', 'Economy', 'Science & Technology',
    'Environment & Ecology', 'Mathematics', 'Reasoning',
    'English Language', 'Hindi Language', 'Current Affairs',
    'Uttarakhand GK', 'Indian Culture', 'Sports',
];

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

interface ParsedQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    selected: boolean;
}

type Step = 'upload' | 'configure' | 'preview' | 'done';

export default function PDFImport() {
    const [step, setStep] = useState<Step>('upload');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
    const [parseError, setParseError] = useState('');
    const [showRaw, setShowRaw] = useState(false);

    // Configuration
    const [examType, setExamType] = useState('UKPSC');
    const [year, setYear] = useState(2025);
    const [topic, setTopic] = useState('General Studies');
    const [customTopic, setCustomTopic] = useState('');
    const [subtopic, setSubtopic] = useState('');
    const [customSubtopic, setCustomSubtopic] = useState('');

    // Save state
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    const effectiveTopic = topic === '__custom__' ? customTopic : topic;
    const effectiveSubtopic = subtopic === '__custom__' ? customSubtopic : subtopic;

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setUploadedFile(file);
        setParsedQuestions([]);
        setParseError('');
        setSaveResult(null);
        setParsing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload to existing upload endpoint to extract text
            const uploadRes = await axios.post(`${API_BASE}/upload/single`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const docId = uploadRes.data.documentId;

            // Fetch extracted text from documents endpoint
            const docRes = await axios.get(`${API_BASE}/documents/${docId}`);
            const text: string = docRes.data.rawText || '';
            setRawText(text);

            // Parse MCQ questions from raw text
            const questions = parseMCQFromText(text);
            if (questions.length === 0) {
                setParseError('No MCQ questions could be detected in this PDF. Make sure it contains numbered questions with A/B/C/D options.');
            } else {
                setParsedQuestions(questions);
                setStep('configure');
            }
        } catch (err: any) {
            setParseError(err.response?.data?.error || err.message || 'Failed to read PDF');
        } finally {
            setParsing(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024,
    });

    function parseMCQFromText(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        // Normalize spacing to single spaces (removes weird PDF line breaks)
        const normalized = text
            .replace(/\s+/g, ' ')
            .trim();

        // Split text whenever we see a question number pattern like " 1. " or " Q2) "
        // Keep the number in the chunk using positive lookahead
        const rawChunks = normalized.split(/(?=(?:^|\s)(?:Q?\d+[.)])\s+)/i).filter(Boolean);

        // Merge false splits (like numbered lists inside a question)
        // A valid question chunk should eventually contain options and an answer.
        const chunks: string[] = [];
        let currentChunk = '';

        for (let i = 0; i < rawChunks.length; i++) {
            currentChunk += (currentChunk ? ' ' : '') + rawChunks[i].trim();
            
            // Check if the current merged chunk has options (a. or a)) AND an answer
            const hasOptions = /(?:^|\s)[(]?[aA][.)\]]\s+/.test(currentChunk);
            const hasAnswer = /(?:^|\s)(?:Answer|Ans|Correct Answer)\s*[:.-]?\s*/i.test(currentChunk);

            // If it has both, we consider the chunk complete
            if ((hasOptions && hasAnswer) || i === rawChunks.length - 1) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
        }

        for (let chunk of chunks) {
            chunk = chunk.trim();
            if (!chunk) continue;

            // Remove the starting number if present (e.g., "8. ")
            chunk = chunk.replace(/^(?:Q?\d+[.)])\s+/i, '');

            // Find where options start (look for " a. ", " a) ", " (a) ", etc.)
            const aMatch = chunk.match(/(?:^|\s)[(]?[aA][.)\]]\s+/);
            if (!aMatch) continue; // Skip if no options are found

            const splitIndex = aMatch.index!;
            let questionText = chunk.substring(0, splitIndex).trim();
            
            let remainingText = chunk.substring(splitIndex).trim(); // This contains options + answer + explanation

            // Split the remaining text by "Answer:" or "Ans:"
            const ansSplit = remainingText.split(/(?:^|\s)(?:Answer|Ans|Correct Answer)\s*[:.-]?\s*/i);
            const optionsText = ansSplit[0];
            const answerAndExpText = ansSplit[1] || '';

            // Parse options (a, b, c, d) using an iterative regex match
            const options: string[] = [];
            const optRegex = /(?:^|\s)[(]?([a-dA-D])[.)\]]\s+(.*?)(?=(?:^|\s)[(]?[a-dA-D][.)\]]\s+|$)/gi;
            let optMatch;
            while ((optMatch = optRegex.exec(optionsText)) !== null) {
                options.push(optMatch[2].trim());
            }

            if (options.length < 2) continue;

            let correctAns = '';
            let explanation = '';

            if (answerAndExpText) {
                // Split answer and explanation
                const expSplit = answerAndExpText.split(/(?:^|\s)(?:Explanation|Exp|Solution)\s*[:.-]?\s*/i);
                
                // The answer is usually just one letter (A, B, C, D)
                correctAns = expSplit[0].trim().charAt(0).toUpperCase();
                explanation = expSplit[1] ? expSplit[1].trim() : '';
            }

            // Map correctAns letter to the actual option text
            let finalCorrectAns = options[0];
            if (correctAns && /^[A-D]$/.test(correctAns)) {
                const idx = correctAns.charCodeAt(0) - 65;
                if (options[idx]) finalCorrectAns = options[idx];
            } else if (correctAns) {
                finalCorrectAns = correctAns;
            }

            questions.push({
                id: `pdf-q-${questions.length + 1}-${Date.now()}`,
                question: questionText,
                options,
                correctAnswer: finalCorrectAns,
                explanation,
                selected: true,
            });
        }

        return questions;
    }

    const toggleQuestion = (id: string) => {
        setParsedQuestions(prev => prev.map(q => q.id === id ? { ...q, selected: !q.selected } : q));
    };

    const toggleAll = () => {
        const allSelected = parsedQuestions.every(q => q.selected);
        setParsedQuestions(prev => prev.map(q => ({ ...q, selected: !allSelected })));
    };

    const handleSave = async () => {
        const toSave = parsedQuestions.filter(q => q.selected);
        if (toSave.length === 0) return;

        setSaving(true);
        setSaveResult(null);

        try {
            const response = await axios.post(`${API_BASE}/official-questions/import-parsed`, {
                questions: toSave.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    examType,
                    year,
                    topic: effectiveTopic,
                    subtopic: effectiveSubtopic,
                })),
                examType,
                year,
                topic: effectiveTopic,
                subtopic: effectiveSubtopic,
            });

            setSaveResult({
                success: true,
                message: response.data.message,
                count: response.data.imported,
            });
            setStep('done');
        } catch (err: any) {
            setSaveResult({
                success: false,
                message: err.response?.data?.error || 'Failed to save questions',
            });
        } finally {
            setSaving(false);
        }
    };

    const resetAll = () => {
        setStep('upload');
        setUploadedFile(null);
        setRawText('');
        setParsedQuestions([]);
        setParseError('');
        setSaveResult(null);
        setShowRaw(false);
    };

    const selectedCount = parsedQuestions.filter(q => q.selected).length;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    PDF Question Import
                </h1>
                <p className="text-muted-foreground">
                    Upload a PDF with MCQ questions → preview parsed questions → save to Official Exam bank
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {(['upload', 'configure', 'preview', 'done'] as Step[]).map((s, i) => {
                    const labels = ['Upload PDF', 'Configure', 'Preview & Select', 'Done'];
                    const stepIndex = ['upload', 'configure', 'preview', 'done'].indexOf(step);
                    const isDone = i < stepIndex;
                    const isCurrent = s === step;
                    return (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                isCurrent ? "bg-orange-500 text-white" :
                                isDone ? "bg-green-500/20 text-green-500" :
                                "bg-muted text-muted-foreground"
                            )}>
                                {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                                <span className="hidden sm:inline">{labels[i]}</span>
                            </div>
                            {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />}
                        </div>
                    );
                })}
            </div>

            {/* STEP 1: Upload */}
            {step === 'upload' && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div
                        {...getRootProps()}
                        className={cn(
                            "relative border-2 border-dashed rounded-3xl p-14 transition-all duration-300 cursor-pointer text-center",
                            isDragActive
                                ? "border-orange-500 bg-orange-500/5"
                                : "border-border hover:border-orange-500/50 hover:bg-muted/40"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className={cn(
                            "w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-300",
                            isDragActive ? "bg-orange-500 scale-110" : "bg-muted"
                        )}>
                            {parsing ? (
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            ) : (
                                <Upload className={cn("w-10 h-10", isDragActive ? "text-white" : "text-muted-foreground")} />
                            )}
                        </div>

                        {parsing ? (
                            <>
                                <h3 className="text-xl font-semibold mb-2">Reading PDF & Parsing Questions...</h3>
                                <p className="text-muted-foreground">This may take a few seconds</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold mb-2">
                                    {isDragActive ? "Drop your PDF here" : "Drag & drop your MCQ PDF"}
                                </h3>
                                <p className="text-muted-foreground mb-4">or click to browse — PDF files only, max 50MB</p>
                                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                    <span className="px-3 py-1 rounded-full bg-muted">Numbered questions (1., 2., 28.)</span>
                                    <span className="px-3 py-1 rounded-full bg-muted">A) B) C) D) options</span>
                                    <span className="px-3 py-1 rounded-full bg-muted">Answer: C format</span>
                                </div>
                            </>
                        )}
                    </div>

                    {parseError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Could not parse PDF</p>
                                <p className="text-sm mt-1 opacity-80">{parseError}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Format hints */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/5 to-pink-500/5 border border-orange-500/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-400">Expected PDF Format</span>
                        </div>
                        <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{`28. Between 1947 and 1990, which type of economic system did India largely follow? (HS - 29/07/2025 - SHIFT 2)
A) Pure Capitalism
B) Pure Socialism
C) Mixed Economy
D) Laissez-faire Economy
Answer: C
Explanation: From 1947 to 1991, India followed a mixed economy...`}</pre>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: Configure */}
            {step === 'configure' && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Success banner */}
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-green-400">
                                ✅ Parsed {parsedQuestions.length} questions from "{uploadedFile?.name}"
                            </p>
                            <p className="text-sm text-muted-foreground">Now configure where to save them</p>
                        </div>
                    </div>

                    {/* Config form */}
                    <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-orange-400" />
                            Save to Official Question Bank
                        </h3>

                        <div className="grid sm:grid-cols-4 gap-4">
                            {/* Exam Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Exam Type</label>
                                <div className="relative">
                                    <select
                                        value={examType}
                                        onChange={e => setExamType(e.target.value)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none cursor-pointer"
                                    >
                                        {ALL_EXAM_TYPES.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Year</label>
                                <div className="relative">
                                    <select
                                        value={year}
                                        onChange={e => setYear(parseInt(e.target.value))}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none cursor-pointer"
                                    >
                                        {YEARS.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Subject / Topic</label>
                                <div className="relative">
                                    <select
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none cursor-pointer"
                                    >
                                        {TOPICS.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                        <option value="__custom__">✏️ Custom topic...</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                                {topic === '__custom__' && (
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={e => setCustomTopic(e.target.value)}
                                        placeholder="Enter topic name..."
                                        className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none"
                                        autoFocus
                                    />
                                )}
                            </div>

                            {/* Subtopic */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Subtopic</label>
                                <div className="relative">
                                    <select
                                        value={subtopic}
                                        onChange={e => setSubtopic(e.target.value)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        <option value="__custom__">✏️ Custom subtopic...</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                                {subtopic === '__custom__' && (
                                    <input
                                        type="text"
                                        value={customSubtopic}
                                        onChange={e => setCustomSubtopic(e.target.value)}
                                        placeholder="Enter subtopic name..."
                                        className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-orange-500 focus:outline-none"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-muted/50 text-sm border border-border/50">
                            <span className="text-muted-foreground">Will be saved as:</span>
                            <span className="font-semibold">{ALL_EXAM_TYPES.find(e => e.id === examType)?.name}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-semibold">{year}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-semibold">{effectiveTopic || 'General Studies'}</span>
                            {effectiveSubtopic && (
                                <>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="font-semibold text-orange-400">{effectiveSubtopic}</span>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setStep('preview')}
                            disabled={topic === '__custom__' && !customTopic.trim()}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                            style={{ background: 'linear-gradient(to right, #f97316, #ec4899)' }}
                        >
                            <Eye className="w-5 h-5" />
                            Preview {parsedQuestions.length} Questions
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Raw text toggle */}
                    {rawText && (
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                            <button
                                onClick={() => setShowRaw(v => !v)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showRaw ? 'Hide' : 'Show'} raw extracted text
                            </button>
                            {showRaw && (
                                <pre className="mt-3 text-xs text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {rawText.substring(0, 3000)}{rawText.length > 3000 ? '...' : ''}
                                </pre>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* STEP 3: Preview & Select */}
            {step === 'preview' && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Header bar */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">
                                {parsedQuestions.length} Questions Detected
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {selectedCount} selected to import into <strong>{ALL_EXAM_TYPES.find(e => e.id === examType)?.name}</strong> · {year} · {effectiveTopic} {effectiveSubtopic ? `· ${effectiveSubtopic}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleAll}
                                className="text-sm px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                {parsedQuestions.every(q => q.selected) ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                                onClick={() => setStep('configure')}
                                className="text-sm px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    {/* Question cards */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {parsedQuestions.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                                onClick={() => toggleQuestion(q.id)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                    q.selected
                                        ? "border-orange-500/60 bg-orange-500/5"
                                        : "border-border bg-card opacity-60 hover:opacity-80"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all",
                                        q.selected
                                            ? "bg-orange-500 border-orange-500"
                                            : "border-border bg-background"
                                    )}>
                                        {q.selected && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Question number + text */}
                                        <div className="flex items-start gap-2 mb-2">
                                            <span className="text-xs font-bold text-orange-400 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                                            <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                                        </div>

                                        {/* Options */}
                                        <div className="grid sm:grid-cols-2 gap-1 mb-2">
                                            {q.options.map((opt, oi) => {
                                                const letter = String.fromCharCode(65 + oi);
                                                const isCorrect = opt === q.correctAnswer;
                                                return (
                                                    <div
                                                        key={oi}
                                                        className={cn(
                                                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs",
                                                            isCorrect
                                                                ? "bg-green-500/15 text-green-400 border border-green-500/20 font-semibold"
                                                                : "bg-muted/50 text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className={cn("font-bold flex-shrink-0", isCorrect ? "text-green-500" : "")}>{letter})</span>
                                                        {opt}
                                                        {isCorrect && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Explanation */}
                                        {q.explanation && (
                                            <p className="text-xs text-muted-foreground italic border-l-2 border-orange-500/30 pl-2">
                                                {q.explanation.length > 150 ? q.explanation.substring(0, 150) + '...' : q.explanation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Save button */}
                    {saveResult && !saveResult.success && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>{saveResult.message}</span>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving || selectedCount === 0}
                        className={cn(
                            "w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all",
                            selectedCount === 0 || saving
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        )}
                        style={selectedCount > 0 && !saving ? { background: 'linear-gradient(to right, #f97316, #ec4899)', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' } : {}}
                    >
                        {saving ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-5 h-5" /> Save {selectedCount} Questions to Official Bank</>
                        )}
                    </button>
                </motion.div>
            )}

            {/* STEP 4: Done */}
            {step === 'done' && saveResult && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-6"
                >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Questions Imported! 🎉</h2>
                        <p className="text-muted-foreground text-lg">
                            <strong className="text-green-400">{saveResult.count}</strong> questions added to{' '}
                            <strong>{ALL_EXAM_TYPES.find(e => e.id === examType)?.name}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                            Year: {year} · Topic: {effectiveTopic} {effectiveSubtopic ? `· Subtopic: ${effectiveSubtopic}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={resetAll}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Import Another PDF
                        </button>
                        <a
                            href="/official-exams"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(to right, #f97316, #ec4899)' }}
                        >
                            <Sparkles className="w-4 h-4" />
                            Go to Official Exams
                        </a>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
