import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { loadDB, saveDB } from '../services/persistence.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { sendEmailOTP } from '../utils/mailer.js';

const router = Router();

// Memory store for password reset security OTPs
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

router.post('/register', async (req, res) => {
    try {
        const { username, password, name, email, phone } = req.body;
        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Username, password and name are required' });
        }

        const db = loadDB();
        
        // Check if user exists
        const userExists = Object.values(db.users).some(
            u => u.username.toLowerCase() === username.toLowerCase()
        );
        if (userExists) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: userId,
            username,
            name,
            passwordHash,
            email: email || `${username.toLowerCase()}@example.com`,
            phone: phone || '',
            avatar: '',
            individual_user_logged_in_time: Date.now()
        };

        db.users[userId] = newUser;
        saveDB(db);

        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
        
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const db = loadDB();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        user.individual_user_logged_in_time = Date.now();
        db.users[user.id] = user;
        saveDB(db);

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { username, verificationName, newPassword } = req.body;
        if (!username || !verificationName || !newPassword) {
            return res.status(400).json({ error: 'Username, verification credentials, and new password are required' });
        }

        const db = loadDB();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({ error: 'Username not found' });
        }

        const inputVerification = verificationName.trim().toLowerCase();
        const isVerifiedName = user.name && user.name.trim().toLowerCase() === inputVerification;
        const isVerifiedEmail = user.email && user.email.trim().toLowerCase() === inputVerification;
        const isVerifiedPhone = user.phone && user.phone.trim() === verificationName.trim();

        if (!isVerifiedName && !isVerifiedEmail && !isVerifiedPhone) {
            return res.status(403).json({ error: 'Security verification failed. Incorrect registered name, email, or phone.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        db.users[user.id].passwordHash = passwordHash;
        saveDB(db);

        res.json({ success: true, message: 'Password reset successfully!' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/request-otp', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const db = loadDB();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({ error: 'Username not found' });
        }

        if (!user.email || user.email.trim() === '') {
            return res.status(400).json({ error: 'No registered email address found for this user.' });
        }

        // Generate 6-digit random code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

        otpStore.set(user.username.toLowerCase(), { otp, expiresAt });

        // Send OTP via SMTP (Gmail or Ethereal sandbox)
        const mailResult = await sendEmailOTP(user.email, user.username, otp);

        // Obfuscate the email address for security UI feedback (e.g. j***n@domain.com)
        const [emailUser, emailDomain] = user.email.split('@');
        const hiddenEmail = emailUser.length > 2
            ? emailUser.charAt(0) + '*'.repeat(emailUser.length - 2) + emailUser.charAt(emailUser.length - 1) + '@' + emailDomain
            : emailUser.charAt(0) + '*@' + emailDomain;

        res.json({
            success: true,
            message: mailResult.url
                ? `OTP verification email dispatched to test mailbox successfully.`
                : `OTP verification email sent successfully to registered address ${hiddenEmail}`,
            // In development, return the Ethereal sandbox inbox preview URL so the user can see it in client UI
            previewUrl: process.env.NODE_ENV !== 'production' ? mailResult.url : undefined,
            mockOtp: !mailResult.url && process.env.NODE_ENV !== 'production' ? otp : undefined
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify-otp-reset', async (req, res) => {
    try {
        const { username, otp, newPassword } = req.body;
        if (!username || !otp || !newPassword) {
            return res.status(400).json({ error: 'Username, OTP code, and new password are required' });
        }

        const db = loadDB();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({ error: 'Username not found' });
        }

        const stored = otpStore.get(user.username.toLowerCase());
        if (!stored) {
            return res.status(400).json({ error: 'No OTP requested or validation expired. Please request a new OTP.' });
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(user.username.toLowerCase());
            return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
        }

        if (stored.otp.trim() !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
        }

        // OTP is correct! Hash the new password and save it
        const passwordHash = await bcrypt.hash(newPassword, 10);
        db.users[user.id].passwordHash = passwordHash;
        saveDB(db);

        // Delete used OTP
        otpStore.delete(user.username.toLowerCase());

        res.json({ success: true, message: 'Password reset successfully!' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/profile', authMiddleware, async (req: any, res) => {
    try {
        const db = loadDB();
        const user = db.users[req.userId];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/profile', authMiddleware, async (req: any, res) => {
    try {
        const db = loadDB();
        const user = db.users[req.userId];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { name, email, phone, avatar, individual_user_logged_in_time } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;
        if (individual_user_logged_in_time !== undefined) {
            user.individual_user_logged_in_time = individual_user_logged_in_time;
        }

        db.users[req.userId] = user;
        saveDB(db);

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export { router as authRouter };
