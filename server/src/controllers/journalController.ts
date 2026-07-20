import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Journal from '../models/Journal.js';
import User from '../models/User.js';
import Planet from '../models/Planet.js';
import mongoose from 'mongoose';

export const createJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user?.userId;


    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

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
      userId: new mongoose.Types.ObjectId(userId),
      content,
      starsEarned,
      streakBeforeEntry,
      createdAt: new Date()
    });

    await journal.save();

    user.currentStreak = newStreak;
    user.totalStars += starsEarned;
    user.lastEntryDate = journal.createdAt;

    // Explicit Planet Merging
    if (user.totalStars >= 10) {
      // Find the 10 oldest loose journals
      const looseJournals = await Journal.find({
        userId: new mongoose.Types.ObjectId(userId),
        planetId: null
      }).sort({ createdAt: 1 }).limit(10);

      if (looseJournals.length === 10) {
        const planetColors = ['#4a90e2', '#d0021b', '#f5a623', '#7ed321', '#9013fe', '#50e3c2'];
        const randomColor = planetColors[Math.floor(Math.random() * planetColors.length)];
        
        const planet = new Planet({
          userId: new mongoose.Types.ObjectId(userId),
          color: randomColor
        });
        await planet.save();

        // Link journals to planet
        await Journal.updateMany(
          { _id: { $in: looseJournals.map(j => j._id) } },
          { $set: { planetId: planet._id } }
        );

        user.totalStars -= 10;
        const planetIndex = user.celestialInventory.findIndex(item => item.type === 'Planet');
        if (planetIndex !== -1) {
          user.celestialInventory[planetIndex].count += 1;
        } else {
          user.celestialInventory.push({ type: 'Planet', count: 1 });
        }
      }
    }

    await user.save();

    res.status(201).json({ journal, user: { currentStreak: user.currentStreak, totalStars: user.totalStars } });
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

    // Handle Planet dissolution or replacement
    if (journal.planetId) {
      const planetId = journal.planetId;
      
      // Try to find a loose replacement star (oldest loose star)
      const replacementStar = await Journal.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        planetId: null
      }).sort({ createdAt: 1 });

      if (replacementStar) {
        // Move the loose star into the planet to maintain its 10-star status
        await Journal.updateOne({ _id: replacementStar._id }, { $set: { planetId: planetId } });
        // Since we replaced the deleted star, the planet is still intact.
        // We just lost one loose star from the pool.
        user.totalStars = Math.max(0, user.totalStars - 1);
      } else {
        // No loose stars available to fill the gap, so dissolve the planet
        await Planet.deleteOne({ _id: planetId });
        
        // Unlink all other journals from this planet
        await Journal.updateMany(
          { planetId: planetId, _id: { $ne: journal._id } },
          { $set: { planetId: null } }
        );

        // Revert user inventory
        const planetIndex = user.celestialInventory.findIndex(item => item.type === 'Planet');
        if (planetIndex !== -1) {
          user.celestialInventory[planetIndex].count -= 1;
          if (user.celestialInventory[planetIndex].count <= 0) {
            user.celestialInventory.splice(planetIndex, 1);
          }
        }
        // Refund the 9 stars that are now loose again
        user.totalStars += 9;
      }
    } else {
      // Deleting a loose star
      user.totalStars = Math.max(0, user.totalStars - journal.starsEarned);
    }

    user.currentStreak = journal.streakBeforeEntry;

    // Recalculate lastEntryDate
    const previousJournal = await Journal.findOne({ 
      userId: new mongoose.Types.ObjectId(userId), 
      _id: { $ne: journal._id } 
    }).sort({ createdAt: -1 });
    
    user.lastEntryDate = previousJournal ? previousJournal.createdAt : null;

    await user.save();
    await journal.deleteOne();

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

    const journal = await Journal.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id as string), userId: new mongoose.Types.ObjectId(userId) },
      { content: content.trim() },
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
