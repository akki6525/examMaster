import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
    const { toasts, dismiss } = useToastStore();

    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
                        className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border backdrop-blur-md shadow-lg ${
                            toast.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : toast.type === 'error'
                                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
                            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />}
                            <span className="text-sm font-medium text-foreground">{toast.message}</span>
                        </div>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="ml-4 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
