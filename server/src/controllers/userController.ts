import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';
import Journal from '../models/Journal.js';

export const getUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Recalculate from journals so legacy accounts recover every earned star.
    const totalStars = await Journal.countDocuments({ userId: user._id });
    if (user.totalStars !== totalStars) {
      user.totalStars = totalStars;
      await user.save();
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error });
  }
};
