import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import Constellation from '../models/Constellation.js';
import Journal from '../models/Journal.js';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

interface ConstellationInput {
  title: string;
  color: string;
  journalIds: mongoose.Types.ObjectId[];
}

const parseInput = (body: unknown): ConstellationInput | string => {
  if (!body || typeof body !== 'object') return 'A constellation is required.';

  const { title, color, journalIds } = body as Record<string, unknown>;
  if (typeof title !== 'string' || !title.trim()) return 'Title is required.';
  if (title.trim().length > 60) return 'Title cannot exceed 60 characters.';
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return 'Color must be a six-digit hex value.';
  if (!Array.isArray(journalIds)) return 'Journal IDs are required.';

  const uniqueIds = [...new Set(journalIds)];
  if (uniqueIds.length < 2) return 'Choose at least two stars.';
  if (uniqueIds.length > 30) return 'A constellation can contain at most 30 stars.';
  if (uniqueIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    return 'One or more journal IDs are invalid.';
  }

  return {
    title: title.trim(),
    color: color.toLowerCase(),
    journalIds: uniqueIds.map((id) => new mongoose.Types.ObjectId(id as string)),
  };
};

const ownsAllJournals = async (
  userId: mongoose.Types.ObjectId,
  journalIds: mongoose.Types.ObjectId[],
) => {
  const count = await Journal.countDocuments({ _id: { $in: journalIds }, userId });
  return count === journalIds.length;
};

export const getConstellations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const constellations = await Constellation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(constellations);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching constellations', error });
  }
};

export const createConstellation = async (req: AuthRequest, res: Response) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId) return res.status(401).json({ message: 'Unauthorized' });

    const input = parseInput(req.body);
    if (typeof input === 'string') return res.status(400).json({ message: input });

    const userId = new mongoose.Types.ObjectId(rawUserId);
    if (!(await ownsAllJournals(userId, input.journalIds))) {
      return res.status(400).json({ message: 'Every star must belong to your journal.' });
    }

    const constellation = await Constellation.create({ userId, ...input });
    return res.status(201).json(constellation);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating constellation', error });
  }
};

export const updateConstellation = async (req: AuthRequest, res: Response) => {
  try {
    const rawUserId = req.user?.userId;
    const { id } = req.params;
    if (!rawUserId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid constellation ID.' });

    const input = parseInput(req.body);
    if (typeof input === 'string') return res.status(400).json({ message: input });

    const userId = new mongoose.Types.ObjectId(rawUserId);
    if (!(await ownsAllJournals(userId, input.journalIds))) {
      return res.status(400).json({ message: 'Every star must belong to your journal.' });
    }

    const constellation = await Constellation.findOneAndUpdate(
      { _id: id, userId },
      input,
      { new: true, runValidators: true },
    );
    if (!constellation) return res.status(404).json({ message: 'Constellation not found.' });
    return res.json(constellation);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating constellation', error });
  }
};

export const deleteConstellation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid constellation ID.' });

    const constellation = await Constellation.findOneAndDelete({ _id: id, userId });
    if (!constellation) return res.status(404).json({ message: 'Constellation not found.' });
    return res.json({ message: 'Constellation deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting constellation', error });
  }
};
