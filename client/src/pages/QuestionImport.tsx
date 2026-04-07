import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileUp,
    CheckCircle,
    AlertCircle,
    Loader2,
    Copy,
    Trash2
} from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';

const API_BASE = 'http://localhost:3001/api';

const examTypes = [
    { id: 'UKPSC', name: 'UKPSC (Uttarakhand PCS)' },
    { id: 'UKSSSC', name: 'UKSSSC (Uttarakhand SSC)' },
    { id: 'SSC CGL', name: 'SSC CGL' },
    { id: 'UPSC', name: 'UPSC Civil Services' }
];

const years = [2024, 2023, 2022, 2021, 2020];

export default function QuestionImport() {
    const [text, setText] = useState('');
    const [examType, setExamType] = useState('UKPSC');
    const [year, setYear] = useState(2024);
    const [topic, setTopic] = useState('General Studies');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    const handleImport = async () => {
        if (!text.trim()) {
            setResult({ success: false, message: 'Please paste some questions' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(`${API_BASE}/official-questions/import`, {
                text,
                examType,
                year,
                topic
            });

            setResult({
                success: true,
                message: response.data.message,
                count: response.data.imported
            });

            if (response.data.imported > 0) {
                setText('');
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error || 'Failed to import questions'
            });
        } finally {
            setLoading(false);
        }
    };

    const sampleFormat = `Q1: What is the capital of Uttarakhand?
(a) Nainital
(b) Dehradun
(c) Haridwar
(d) Almora
Answer: (b) Dehradun

Q2: Which river originates from Gangotri glacier?
(a) Yamuna
(b) Alaknanda
(c) Ganga
(d) Mandakini
Answer: (c) Ganga`;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
                    <FileUp className="w-8 h-8 text-primary" />
                    Import Questions
                </h1>
                <p className="text-muted-foreground">
                    Paste questions from any source to add them to your question bank
                </p>
            </div>

            {/* Import Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-card border border-border space-y-6"
            >
                {/* Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Exam Type</label>
                        <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                        >
                            {examTypes.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                            placeholder="e.g., General Studies, History"
                        />
                    </div>
                </div>

                {/* Text Area */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Paste Questions Here
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your questions in Q1:, Q2: format with options (a), (b), (c), (d) and Answer..."
                        className="w-full h-64 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none resize-none font-mono text-sm"
                    />
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            {text.length} characters
                        </span>
                        <button
                            onClick={() => setText('')}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear
                        </button>
                    </div>
                </div>

                {/* Sample Format */}
                <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Supported Format Example:</span>
                        <button
                            onClick={() => setText(sampleFormat)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" />
                            Use Sample
                        </button>
                    </div>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                        {sampleFormat}
                    </pre>
                </div>

                {/* Result Message */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-4 rounded-xl flex items-center gap-3",
                            result.success
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                        )}
                    >
                        {result.success ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{result.message}</span>
                    </motion.div>
                )}

                {/* Import Button */}
                <button
                    onClick={handleImport}
                    disabled={loading || !text.trim()}
                    className={cn(
                        "w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all",
                        loading || !text.trim()
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "btn-primary"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <FileUp className="w-5 h-5" />
                            Import Questions
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
