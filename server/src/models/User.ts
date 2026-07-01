import mongoose, { Schema, Document } from 'mongoose';

export interface ICelestialItem {
  type: string;
  count: number;
}

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'user' | 'admin';
  currentStreak: number;
  totalStars: number;
  celestialInventory: ICelestialItem[];
  lastEntryDate: Date | null;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  currentStreak: { type: Number, default: 0 },
  totalStars: { type: Number, default: 0 },
  celestialInventory: [{
    type: { type: String, required: true },
    count: { type: Number, default: 1 }
  }],
  lastEntryDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
