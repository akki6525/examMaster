import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { loadDB, saveDB } from '../services/persistence.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';

const router = Router();

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
            avatar: ''
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
        const { username, newPassword } = req.body;
        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Username and new password are required' });
        }

        const db = loadDB();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({ error: 'Username not found' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        db.users[user.id].passwordHash = passwordHash;
        saveDB(db);

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
        
        const { name, email, phone, avatar } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        db.users[req.userId] = user;
        saveDB(db);

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export { router as authRouter };
