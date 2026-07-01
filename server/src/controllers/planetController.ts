import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Planet from '../models/Planet.js';
import mongoose from 'mongoose';

export const getPlanets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const planets = await Planet.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    res.json(planets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching planets', error });
  }
};

export const updatePlanetPosition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y, z } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const planet = await Planet.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id as string), userId: new mongoose.Types.ObjectId(userId) },
      { position: { x, y, z } },
      { new: true }
    );

    if (!planet) {
      return res.status(404).json({ message: 'Planet not found' });
    }

    res.json(planet);
  } catch (error) {
    res.status(500).json({ message: 'Error updating planet position', error });
  }
};
