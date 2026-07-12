import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    user?: {
        userId: string;
        username: string;
    };
}
