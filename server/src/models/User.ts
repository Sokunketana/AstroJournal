import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId?: string;
  username: string;
  password?: string;
  role: string;
  currentStreak: number;
  totalStars: number;
  lastEntryDate: Date | null;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: 'user' },
  currentStreak: { type: Number, default: 0 },
  totalStars: { type: Number, default: 0 },
  lastEntryDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
