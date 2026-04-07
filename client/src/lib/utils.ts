import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

export function formatDuration(minutes: number): string {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
}

export function getScoreColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-red-500';
}

export function getScoreBgColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500/10 border-green-500/20';
    if (percentage >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (percentage >= 40) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case 'easy':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'medium':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'hard':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return 'bg-muted text-muted-foreground';
    }
}
