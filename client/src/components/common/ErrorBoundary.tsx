import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught component error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-card border border-border/60 shadow-lg my-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                        {this.props.fallbackTitle || 'Something went wrong'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mb-5">
                        {this.state.error?.message || 'An unexpected error occurred in this view. Please try refreshing.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shadow-md"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Reload & Try Again</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
