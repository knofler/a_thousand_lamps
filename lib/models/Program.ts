import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram extends Document {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  coverImageUrl?: string;
  isActive: boolean;
  order: number;
}

const ProgramSchema = new Schema<IProgram>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    emoji: { type: String, default: '🪔' },
    coverImageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema);
