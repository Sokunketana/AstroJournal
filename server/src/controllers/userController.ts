import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';

export const craftPlanet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.totalStars < 10) {
      return res.status(400).json({ message: 'Not enough stars. You need at least 10 stars to craft a planet.' });
    }

    user.totalStars -= 10;

    const planetType = 'Planet';
    const inventoryItem = user.celestialInventory.find(item => item.type === planetType);

    if (inventoryItem) {
      inventoryItem.count += 1;
    } else {
      user.celestialInventory.push({ type: planetType, count: 1 });
    }

    await user.save();

    res.json({ message: 'Planet crafted successfully!', user: { totalStars: user.totalStars, celestialInventory: user.celestialInventory } });
  } catch (error) {
    res.status(500).json({ message: 'Error crafting planet', error });
  }
};

export const getUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error });
  }
};
