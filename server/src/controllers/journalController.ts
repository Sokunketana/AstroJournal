import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Journal from '../models/Journal.js';
import User from '../models/User.js';
import { detectEmotion } from '../utils/emotion.js';
import mongoose from 'mongoose';
import Constellation from '../models/Constellation.js';

interface JournalPosition {
  x: number;
  y: number;
  z: number;
}

const parsePosition = (value: unknown): JournalPosition | null => {
  if (!value || typeof value !== 'object') return null;

  const { x, y, z } = value as Partial<JournalPosition>;
  if (
    typeof x !== 'number' || !Number.isFinite(x)
    || typeof y !== 'number' || !Number.isFinite(y)
    || typeof z !== 'number' || !Number.isFinite(z)
  ) {
    return null;
  }

  return { x, y, z };
};

const classifyJournalEmotion = async (
  journalId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  content: string,
) => {
  try {
    const emotion = await detectEmotion(content);
    await Journal.updateOne(
      { _id: journalId, userId, content },
      { $set: { emotion } },
    );
  } catch (error) {
    console.error('Background journal emotion classification failed:', error);
  }
};

export const createJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { content, position: rawPosition } = req.body;
    const userId = req.user?.userId;


    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }

    const position = rawPosition === undefined ? undefined : parsePosition(rawPosition);
    if (rawPosition !== undefined && !position) {
      return res.status(400).json({ message: 'Journal position must contain finite x, y, and z coordinates' });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // TODO: implement 1 journal per day after testing
    /*
    const existingEntry = await Journal.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'You have already written a journal today.' });
    }
    */

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const lastEntryDate = user.lastEntryDate ? new Date(user.lastEntryDate) : null;
    if (lastEntryDate) {
      lastEntryDate.setHours(0, 0, 0, 0);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    const streakBeforeEntry = user.currentStreak;

    if (lastEntryDate) {
      if (lastEntryDate.getTime() === yesterday.getTime()) {
        newStreak = user.currentStreak + 1;
      } else if (lastEntryDate.getTime() === today.getTime()) {
        // TODO: implement 1 journal per day after testing
        /*
        return res.status(400).json({ message: 'Already posted today.' });
        */
        newStreak = user.currentStreak;
      } else {
        newStreak = 1;
      }
    }

    const starsEarned = 1;

    const journal = new Journal({
      userId: objectUserId,
      content: content.trim(),
      emotion: 'neutral',
      starsEarned,
      streakBeforeEntry,
      position,
      createdAt: new Date()
    });

    await journal.save();

    user.currentStreak = newStreak;
    user.totalStars = await Journal.countDocuments({ userId: objectUserId });
    user.lastEntryDate = journal.createdAt;

    await user.save();

    res.status(201).json({
      journal,
      user: { currentStreak: user.currentStreak, totalStars: user.totalStars },
    });

    setImmediate(() => {
      void classifyJournalEmotion(journal._id, objectUserId, journal.content);
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating journal', error });
  }
};

export const getJournals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const journals = await Journal.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journals', error });
  }
};

export const deleteJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const journal = await Journal.findOne({ _id: new mongoose.Types.ObjectId(id as string), userId: new mongoose.Types.ObjectId(userId) });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.totalStars = await Journal.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      _id: { $ne: journal._id },
    });

    user.currentStreak = journal.streakBeforeEntry;

    // Recalculate lastEntryDate
    const previousJournal = await Journal.findOne({ 
      userId: new mongoose.Types.ObjectId(userId), 
      _id: { $ne: journal._id } 
    }).sort({ createdAt: -1 });
    
    user.lastEntryDate = previousJournal ? previousJournal.createdAt : null;

    await user.save();
    await journal.deleteOne();

    await Constellation.updateMany(
      { userId, journalIds: journal._id },
      { $pull: { journalIds: journal._id } },
    );
    await Constellation.deleteMany({ userId, 'journalIds.1': { $exists: false } });

    res.json({ message: 'Journal deleted and stats reverted', user: { currentStreak: user.currentStreak, totalStars: user.totalStars } });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting journal', error });
  }
};

export const updateJournalPosition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y, z } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const journal = await Journal.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id as string), userId: new mongoose.Types.ObjectId(userId) },
      { position: { x, y, z } },
      { new: true }
    );

    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating journal position', error });
  }
};

export const updateJournalContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }

    const emotion = await detectEmotion(content);

    const journal = await Journal.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id as string), userId: new mongoose.Types.ObjectId(userId) },
      { content: content.trim(), emotion },
      { new: true }
    );

    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating journal content', error });
  }
};
