import mongoose, { Schema, Document } from 'mongoose';

export interface IJournal extends Document {
  userId: mongoose.Types.ObjectId;
  planetId?: mongoose.Types.ObjectId | null;
  content: string;
  starsEarned: number;
  streakBeforeEntry: number;
  position?: { x: number; y: number; z: number };
  createdAt: Date;
}

const JournalSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planetId: { type: Schema.Types.ObjectId, ref: 'Planet', default: null, index: true },
  content: { type: String, required: true },
  starsEarned: { type: Number, required: true },
  streakBeforeEntry: { type: Number, required: true },
  position: {
    x: { type: Number },
    y: { type: Number },
    z: { type: Number }
  },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export default mongoose.model<IJournal>('Journal', JournalSchema);
