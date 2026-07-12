import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'exammaster-super-secret-key-123';

export function authMiddleware(req: any, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
        req.userId = decoded.userId;
        req.user = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
