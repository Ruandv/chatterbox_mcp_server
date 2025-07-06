import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-secret'] as string;
    const expectedSecret = process.env.CHATTERBOX_SECRET;

    if (!expectedSecret) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!secret || secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};
