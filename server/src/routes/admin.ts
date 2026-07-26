import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { loadDB, saveDB } from '../services/persistence.js';
import { authMiddleware } from '../middleware/auth.js';
import { decrypt } from '../utils/crypto.js';

const router = Router();

// Admin username check — defined via ADMIN_USERNAME env var (default: "admin")
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

function adminGuard(req: any, res: any, next: any) {
    try {
        const db = loadDB();
        const dbUser = req.userId ? db.users[req.userId] : null;
        const rawUsername = dbUser?.username || req.user?.username || '';
        const currentUsername = decrypt(rawUsername).toLowerCase();
        
        if (currentUsername === ADMIN_USERNAME || req.user?.username?.toLowerCase() === ADMIN_USERNAME) {
            return next();
        }
        
        return res.status(403).json({ error: `Forbidden: Admin access only. Logged in as: ${currentUsername || 'guest'}` });
    } catch {
        return res.status(403).json({ error: 'Forbidden: Admin access verification failed.' });
    }
}

// GET /api/admin/users — list all users with comprehensive performance analytics
router.get('/users', authMiddleware, adminGuard, (req, res) => {
    try {
        const db = loadDB();
        const users = Object.values(db.users).map((u: any) => {
            const { passwordHash, ...safe } = u;
            const userId = u.id;

            // Decrypt user fields
            const decryptedUsername = decrypt(u.username || '');
            const decryptedName = decrypt(u.name || '');
            const decryptedEmail = decrypt(u.email || '');
            const decryptedPhone = decrypt(u.phone || '');

            // Fetch user practice stats
            const stats = db.practiceStats?.[userId] || db.practiceStats?.[decryptedUsername] || db.practiceStats?.[u.username] || db.practiceStats?.['default-user'] || {
                totalAttempted: 0,
                correct: 0,
                incorrect: 0,
                topicWiseScore: [],
                eliminationStats: { skipped: 0, wrong: 0, correct: 0 }
            };

            // Fetch user test results (including decrypted username fallback)
            const allTestResults = Object.values(db.testResults || {});
            const userResults = allTestResults
                .filter((r: any) => 
                    r.userId === userId || 
                    r.userId === decryptedUsername ||
                    r.userId === u.username
                )
                .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

            const testsTaken = userResults.length;
            const avgScore = testsTaken > 0
                ? Math.round(userResults.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / testsTaken)
                : 0;

            // Compute combined mock tests + practice questions analytics
            let mockAttempted = 0;
            let mockCorrect = 0;
            let mockIncorrect = 0;
            userResults.forEach((r: any) => {
                const total = r.answers?.length || r.totalMarks || 0;
                mockAttempted += total;
                if (r.answers && Array.isArray(r.answers)) {
                    const c = r.answers.filter((a: any) => a.isCorrect).length;
                    mockCorrect += c;
                    mockIncorrect += (total - c);
                } else {
                    const pct = r.percentage || 0;
                    const c = Math.round(total * (pct / 100));
                    mockCorrect += c;
                    mockIncorrect += (total - c);
                }
            });

            const totalQuestionsSolved = mockAttempted + (stats.totalAttempted || 0);
            const totalCorrect = mockCorrect + (stats.correct || 0);
            const totalIncorrect = mockIncorrect + (stats.incorrect || 0);
            const accuracy = totalQuestionsSolved > 0
                ? Math.round((totalCorrect / totalQuestionsSolved) * 100)
                : 0;

            // Fetch user documents (strict check)
            const userDocs = Object.values(db.documents || {})
                .filter((d: any) => d.userId === userId || d.userId === decryptedUsername || d.userId === u.username);

            // Recent test titles & scores
            const recentTests = userResults.slice(0, 5).map((r: any) => {
                const test = db.mockTests?.[r.testId];
                return {
                    title: test?.title || 'Mock Test',
                    score: r.score,
                    totalMarks: r.totalMarks,
                    percentage: r.percentage,
                    completedAt: r.completedAt,
                    timeTakenMinutes: Math.round((r.timeTaken || 0) / 60000)
                };
            });

            // Derive studied topics and weak topics
            const studiedTopics = stats.topicWiseScore || [];
            const topTopics = [...studiedTopics]
                .sort((a: any, b: any) => b.total - a.total)
                .slice(0, 5);
            const weakTopics = [...studiedTopics]
                .filter((t: any) => t.total >= 3 && t.percentage < 60)
                .sort((a: any, b: any) => a.percentage - b.percentage)
                .map((t: any) => t.topic);

            // Derive user target goals list
            let userGoalsList: string[] = [];
            if (Array.isArray(u.goals)) {
                userGoalsList = u.goals.map((g: any) => typeof g === 'string' ? g : (g.title || g.label || g.name || ''));
            }
            const formattedGoals = userGoalsList.filter(Boolean).join(' · ');
            const targetGoalDisplay = formattedGoals || u.targetGoal || (topTopics.length > 0 ? `${topTopics[0].topic} Focus` : 'Competitive Exam Preparation');

            return {
                ...safe,
                username: decryptedUsername,
                name: decryptedName,
                email: decryptedEmail,
                phone: decryptedPhone,
                targetGoal: targetGoalDisplay,
                userGoals: u.goals || [],
                dailyGoalHours: u.dailyGoalHours || 3,
                stats: {
                    totalAttempted: totalQuestionsSolved,
                    correct: totalCorrect,
                    incorrect: totalIncorrect,
                    accuracy,
                    testsTaken,
                    avgScore,
                    documentsUploaded: userDocs.length,
                    eliminationStats: stats.eliminationStats || { skipped: 0, wrong: 0, correct: 0 }
                },
                topTopics,
                weakTopics,
                recentTests,
                recentDocs: userDocs.slice(0, 3).map((d: any) => ({
                    id: d.id,
                    fileName: d.fileName,
                    topicsCount: d.topicsCount || (d.extractedTopics?.length || 0)
                }))
            };
        });

        res.json({ users });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/users/:userId — update any user's profile fields
router.patch('/users/:userId', authMiddleware, adminGuard, (req, res) => {
    try {
        const db = loadDB();
        const user = db.users[req.params.userId];
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { name, email, phone, avatar } = req.body;
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;

        db.users[req.params.userId] = user;
        saveDB(db);

        const { passwordHash, ...safe } = user;
        res.json({ success: true, user: safe });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users/:userId/reset-password — force-reset any user's password
router.post('/users/:userId/reset-password', authMiddleware, adminGuard, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters.' });
        }

        const db = loadDB();
        const user = db.users[req.params.userId];
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        db.users[req.params.userId] = user;
        saveDB(db);

        res.json({ success: true, message: `Password for "${user.username}" reset successfully.` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:userId — permanently delete a user
router.delete('/users/:userId', authMiddleware, adminGuard, (req, res) => {
    try {
        const db = loadDB();
        const user = db.users[req.params.userId];
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Prevent admin from deleting themselves
        if (user.username?.toLowerCase() === ADMIN_USERNAME) {
            return res.status(400).json({ error: 'Cannot delete the admin account.' });
        }

        delete db.users[req.params.userId];
        saveDB(db);
        res.json({ success: true, message: `User "${user.username}" deleted.` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/me — check if current user is admin
router.get('/me', authMiddleware, (req: any, res) => {
    const isAdmin = req.user?.username?.toLowerCase() === ADMIN_USERNAME;
    res.json({ isAdmin, adminUsername: ADMIN_USERNAME });
});

export { router as adminRouter };
