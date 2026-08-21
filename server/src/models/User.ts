import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
  currentStreak: number;
  totalStars: number;
  lastEntryDate: Date | null;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  currentStreak: { type: Number, default: 0 },
  totalStars: { type: Number, default: 0 },
  lastEntryDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
