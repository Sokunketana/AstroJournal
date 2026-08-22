import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import User from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: {
          clerkId,
          username: clerkId,
          role: 'user',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    req.user = { userId: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};
