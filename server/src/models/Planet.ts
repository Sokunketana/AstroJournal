import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanet extends Document {
  userId: mongoose.Types.ObjectId;
  color: string;
  position?: { x: number; y: number; z: number };
  createdAt: Date;
}

const PlanetSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  color: { type: String, default: '#4a90e2' },
  position: {
    x: { type: Number },
    y: { type: Number },
    z: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IPlanet>('Planet', PlanetSchema);
