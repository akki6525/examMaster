import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'exammaster-super-secret-key-123';

export function authMiddleware(req: any, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
                    if (decoded && decoded.userId) {
                        req.userId = decoded.userId;
                        req.user = decoded;
                        return next();
                    }
                } catch (e) {
                    // Invalid/expired token - fallback to default user
                }
            }
        }

        // Default user fallback for guest/unauthenticated sessions so stats and reports work seamlessly
        req.userId = 'default-user';
        req.user = { userId: 'default-user', username: 'Guest' };
        next();
    } catch (error) {
        req.userId = 'default-user';
        req.user = { userId: 'default-user', username: 'Guest' };
        next();
    }
}
