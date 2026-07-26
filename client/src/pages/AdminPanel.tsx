import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import {
    Shield, Users, Key, Trash2, Edit3, Check, X, AlertTriangle, RefreshCw, User, Mail, Phone, Clock,
    ChevronDown, ChevronUp, Lock, Target, Award, FileText, BookOpen, TrendingUp, CheckCircle2,
    XCircle, Brain, Zap, BarChart2
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface UserStats {
    totalAttempted: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    testsTaken: number;
    avgScore: number;
    documentsUploaded: number;
    eliminationStats?: { skipped: number; wrong: number; correct: number };
}

interface TopTopic {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
}

interface RecentTest {
    title: string;
    score: number;
    totalMarks: number;
    percentage: number;
    completedAt: string;
    timeTakenMinutes: number;
}

interface RecentDoc {
    id: string;
    fileName: string;
    topicsCount: number;
}

interface AdminUser {
    id: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    individual_user_logged_in_time?: number;
    last_logout_time?: number;
    is_online?: boolean;
    total_logged_in_duration_ms?: number;
    last_active_time?: number;
    targetGoal?: string;
    userGoals?: any[];
    dailyGoalHours?: number;
    stats?: UserStats;
    topTopics?: TopTopic[];
    weakTopics?: string[];
    recentTests?: RecentTest[];
    recentDocs?: RecentDoc[];
}

type Panel = 'users' | 'edit' | 'password';

function formatTime(ts?: number) {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(ms?: number, isOnline?: boolean, loginTime?: number) {
    let totalMs = ms || 0;
    if (isOnline && loginTime) {
        totalMs += Math.max(0, Date.now() - loginTime);
    }
    if (!totalMs || totalMs <= 0) return '0 mins';
    const seconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    if (hours === 0 && minutes < 5) parts.push(`${secs} sec${secs > 1 ? 's' : ''}`);

    return parts.join(' ') || '< 1 min';
}

export default function AdminPanel() {
    const { user, token } = useAuthStore();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Edit state
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState('');

    // Password reset state
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMsg, setResetMsg] = useState('');

    // Delete confirm state
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getAuthHeaders = () => {
        const activeToken = token || useAuthStore.getState().token;
        return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
            setUsers(res.data.users || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (u: AdminUser) => {
        setEditingUser(u);
        setEditForm({ name: u.name, email: u.email, phone: u.phone || '' });
        setEditMsg('');
        setResetUserId(null);
        setDeleteUserId(null);
    };

    const handleEditSave = async () => {
        if (!editingUser) return;
        setEditLoading(true);
        setEditMsg('');
        try {
            await axios.patch(`${API_BASE}/admin/users/${editingUser.id}`, editForm, { headers: getAuthHeaders() });
            setEditMsg('✅ Profile updated successfully.');
            fetchUsers();
        } catch (err: any) {
            setEditMsg('❌ ' + (err.response?.data?.error || 'Update failed.'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetUserId || !newPassword) return;
        setResetLoading(true);
        setResetMsg('');
        try {
            const res = await axios.post(`${API_BASE}/admin/users/${resetUserId}/reset-password`, { newPassword }, { headers: getAuthHeaders() });
            setResetMsg('✅ ' + res.data.message);
            setNewPassword('');
        } catch (err: any) {
            setResetMsg('❌ ' + (err.response?.data?.error || 'Reset failed.'));
        } finally {
            setResetLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        setDeleteLoading(true);
        try {
            await axios.delete(`${API_BASE}/admin/users/${userId}`, { headers: getAuthHeaders() });
            setDeleteUserId(null);
            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Delete failed.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const adminAccount = users.find(u => u.username.toLowerCase() === 'admin');
    const studentUsers = filtered.filter(u => u.username.toLowerCase() !== 'admin');

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-border/60">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <Shield className="w-7 h-7 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Admin Control Panel</h1>
                    <p className="text-sm text-muted-foreground">Logged in as <span className="font-bold text-red-400">{user?.username}</span> · Full system access</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/40 text-sm font-medium transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Registered Students', value: users.filter(u => u.username.toLowerCase() !== 'admin').length, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                    { label: 'Active Today', value: users.filter(u => u.individual_user_logged_in_time && Date.now() - u.individual_user_logged_in_time < 86400000).length, icon: Clock, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                    { label: 'With Email', value: users.filter(u => u.email && !u.email.includes('@example.com')).length, icon: Mail, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { label: 'With Phone', value: users.filter(u => u.phone && u.phone.trim()).length, icon: Phone, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-2xl border flex items-center gap-3 ${stat.color}`}>
                        <stat.icon className={`w-5 h-5 flex-shrink-0 ${stat.color.split(' ')[0]}`} />
                        <div>
                            <p className="text-xl font-black">{stat.value}</p>
                            <p className="text-xs opacity-70">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student Users list */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" /> Student Accounts ({studentUsers.length})
                        </h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name, username, email..."
                            className="ml-auto w-56 px-3 py-1.5 text-xs rounded-xl border border-border/60 bg-muted/20 outline-none focus:border-primary/60 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 rounded-2xl bg-muted/20 animate-pulse" />
                            ))}
                        </div>
                    ) : studentUsers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">No student users found.</div>
                    ) : (
                        studentUsers.map(u => {
                            const isExpanded = expandedUser === u.id;
                            const isEditing = editingUser?.id === u.id;
                            return (
                                <div
                                    key={u.id}
                                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isEditing ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-card'}`}
                                >
                                    {/* Row */}
                                    <div className="flex items-center gap-3 p-3.5">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-border flex items-center justify-center flex-shrink-0 font-black text-sm text-primary">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm truncate">{u.name}</span>
                                                {u.username.toLowerCase() === 'admin' && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">ADMIN</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">@{u.username} · {u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors text-muted-foreground"
                                                title="Edit profile"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setResetUserId(u.id); setResetMsg(''); setNewPassword(''); setEditingUser(null); setDeleteUserId(null); }}
                                                className="p-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-400 transition-colors text-muted-foreground"
                                                title="Reset password"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setDeleteUserId(u.id); setEditingUser(null); setResetUserId(null); }}
                                                className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-muted-foreground"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                                                className="p-2 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-4 text-xs bg-muted/10">
                                            {/* Header Goal & Online Status Ribbon */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Target className="w-4 h-4 text-amber-400" />
                                                    <span className="font-extrabold text-foreground">Target Goals:</span>
                                                    {Array.isArray(u.userGoals) && u.userGoals.length > 0 ? (
                                                        u.userGoals.map((g: any, i: number) => (
                                                            <span key={i} className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px] flex items-center gap-1">
                                                                <span>{g.emoji || '🎯'}</span>
                                                                <span>{typeof g === 'string' ? g : g.title}</span>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                                                            {u.targetGoal || 'Competitive Exam Goal'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {u.is_online ? (
                                                        <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Now
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground font-medium text-[11px]">
                                                            Last Logout: <span className="text-foreground font-semibold">{formatTime(u.last_logout_time)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* KPI Stats Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                                                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                                                        <span>Questions Solved</span>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                                    </div>
                                                    <div className="text-lg font-black text-foreground">{u.stats?.totalAttempted || 0}</div>
                                                    <div className="text-[10px] font-bold text-emerald-400">{u.stats?.accuracy || 0}% Accuracy</div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                                                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                                                        <span>Mock Tests</span>
                                                        <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                                                    </div>
                                                    <div className="text-lg font-black text-foreground">{u.stats?.testsTaken || 0} Taken</div>
                                                    <div className="text-[10px] font-bold text-purple-400">{u.stats?.avgScore || 0}% Avg Score</div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                                                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                                                        <span>Active Time</span>
                                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                    </div>
                                                    <div className="text-sm font-extrabold text-amber-400 truncate">
                                                        {formatDuration(u.total_logged_in_duration_ms, u.is_online, u.individual_user_logged_in_time)}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">Total session time</div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1">
                                                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                                                        <span>Study Materials</span>
                                                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                                    </div>
                                                    <div className="text-lg font-black text-foreground">{u.stats?.documentsUploaded || 0} Docs</div>
                                                    <div className="text-[10px] text-muted-foreground">Uploaded files</div>
                                                </div>
                                            </div>

                                            {/* Studied Topics & Performance Progress */}
                                            {u.topTopics && u.topTopics.length > 0 && (
                                                <div className="p-3.5 rounded-xl bg-card border border-border/40 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-extrabold text-foreground flex items-center gap-1.5">
                                                            <Brain className="w-3.5 h-3.5 text-indigo-400" /> Studied Topics Performance
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold">{u.topTopics.length} Topics Studied</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {u.topTopics.map(t => {
                                                            const color = t.percentage >= 75 ? 'bg-emerald-500' : t.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                                                            return (
                                                                <div key={t.topic} className="space-y-1">
                                                                    <div className="flex justify-between text-[11px] font-bold">
                                                                        <span className="text-foreground">{t.topic}</span>
                                                                        <span className="text-muted-foreground">{t.correct}/{t.total} ({t.percentage}%)</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                                                        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(5, t.percentage)}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Weak Topics Attention Banner */}
                                            {u.weakTopics && u.weakTopics.length > 0 && (
                                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <span className="font-bold">Topics Needing Improvement:</span>{' '}
                                                        <span className="font-medium text-foreground">{u.weakTopics.join(', ')}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Test History */}
                                            {u.recentTests && u.recentTests.length > 0 && (
                                                <div className="p-3.5 rounded-xl bg-card border border-border/40 space-y-2">
                                                    <span className="font-extrabold text-foreground flex items-center gap-1.5">
                                                        <Award className="w-3.5 h-3.5 text-amber-400" /> Recent Mock Test Results
                                                    </span>
                                                    <div className="space-y-1.5">
                                                        {u.recentTests.map((t, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30 text-[11px]">
                                                                <div className="truncate font-semibold text-foreground max-w-[200px]">{t.title}</div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-muted-foreground">{t.timeTakenMinutes} min</span>
                                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${t.percentage >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                        {t.percentage}% Score ({t.score}/{t.totalMarks})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Basic User Account Metadata Footer */}
                                            <div className="pt-2 border-t border-border/30 grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                                                <div><User className="w-3 h-3 inline mr-1 text-primary" /> ID: <span className="font-mono text-[10px]">{u.id}</span></div>
                                                <div><Phone className="w-3 h-3 inline mr-1 text-emerald-400" /> {u.phone || 'No phone'}</div>
                                                <div><Clock className="w-3 h-3 inline mr-1 text-amber-400" /> Last login: <span className="font-semibold text-foreground">{formatTime(u.individual_user_logged_in_time || u.last_active_time)}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right panel: Admin Profile & Actions */}
                <div className="space-y-4">
                    {/* Admin Account Widget */}
                    {adminAccount && (
                        <div className="p-5 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-card to-card space-y-3.5 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center font-black text-red-400 text-sm">
                                        {adminAccount.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-sm text-foreground">{adminAccount.name}</span>
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase">ADMIN</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">@{adminAccount.username} · {adminAccount.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(adminAccount)}
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                        title="Edit Admin Info"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setResetUserId(adminAccount.id); setResetMsg(''); setNewPassword(''); setEditingUser(null); setDeleteUserId(null); }}
                                        className="p-1.5 rounded-lg hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 transition-colors"
                                        title="Reset Admin Password"
                                    >
                                        <Key className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Admin Status</span>
                                    <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> System Controller
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-background/60 border border-border/40 space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Active Session</span>
                                    <span className="font-extrabold text-amber-400 truncate">
                                        {formatDuration(adminAccount.total_logged_in_duration_ms, adminAccount.is_online, adminAccount.individual_user_logged_in_time)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Form */}
                    {editingUser && (
                        <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400">
                                <Edit3 className="w-4 h-4" /> Edit: @{editingUser.username}
                            </h3>
                            {[
                                { label: 'Full Name', key: 'name', icon: User },
                                { label: 'Email', key: 'email', icon: Mail },
                                { label: 'Phone', key: 'phone', icon: Phone },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <f.icon className="w-3 h-3" /> {f.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={(editForm as any)[f.key]}
                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-muted/20 outline-none focus:border-blue-500/60 transition-all"
                                    />
                                </div>
                            ))}
                            {editMsg && <p className="text-xs rounded-lg px-3 py-2 bg-muted/20 border border-border/40">{editMsg}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEditSave}
                                    disabled={editLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" />
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl border border-border/60 hover:bg-muted/30 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reset Password Form */}
                    {resetUserId && (
                        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                                <Key className="w-4 h-4" /> Reset Password
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                For: <span className="font-bold text-foreground">@{users.find(u => u.id === resetUserId)?.username}</span>
                            </p>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-muted/20 outline-none focus:border-amber-500/60 transition-all"
                                />
                            </div>
                            {resetMsg && <p className="text-xs rounded-lg px-3 py-2 bg-muted/20 border border-border/40">{resetMsg}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetLoading || !newPassword}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all disabled:opacity-50"
                                >
                                    <Key className="w-4 h-4" />
                                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                <button onClick={() => setResetUserId(null)} className="p-2 rounded-xl border border-border/60 hover:bg-muted/30 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirm */}
                    {deleteUserId && (
                        <div className="p-5 rounded-2xl border border-red-500/40 bg-red-500/5 space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-red-400">
                                <AlertTriangle className="w-4 h-4" /> Confirm Delete
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete <span className="font-bold text-red-400">@{users.find(u => u.id === deleteUserId)?.username}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDelete(deleteUserId)}
                                    disabled={deleteLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button onClick={() => setDeleteUserId(null)} className="p-2 rounded-xl border border-border/60 hover:bg-muted/30 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty right panel hint */}
                    {!editingUser && !resetUserId && !deleteUserId && (
                        <div className="p-6 rounded-2xl border border-dashed border-border/40 text-center space-y-2">
                            <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                            <p className="text-xs text-muted-foreground">Select an action on any user to manage their account here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
