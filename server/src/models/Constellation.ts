import mongoose, { Schema, Document } from 'mongoose';

export interface IConstellation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  color: string;
  journalIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ConstellationSchema = new Schema<IConstellation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 60 },
  color: { type: String, required: true, default: '#a78bfa' },
  journalIds: [{ type: Schema.Types.ObjectId, ref: 'Journal', required: true }],
}, { timestamps: true });

ConstellationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IConstellation>('Constellation', ConstellationSchema);
