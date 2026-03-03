import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  type: 'photo' | 'embed' | 'story' | 'program';
  title?: string;
  caption?: string;
  imageUrl?: string;
  embedUrl?: string;
  embedType?: 'facebook' | 'instagram';
  tags: string[];
  program?: string;
  isPublished: boolean;
  isFeatured: boolean;
  likes: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    type: {
      type: String,
      enum: ['photo', 'embed', 'story', 'program'],
      required: true,
    },
    title: { type: String },
    caption: { type: String },
    imageUrl: { type: String },       // Cloudinary URL for photo posts
    embedUrl: { type: String },       // Facebook/Instagram embed URL
    embedType: {
      type: String,
      enum: ['facebook', 'instagram'],
    },
    tags: { type: [String], default: [] },
    program: { type: String },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    order: { type: Number, default: 0 }, // lower = shown first
  },
  {
    // Use Mongoose's built-in timestamps so updatedAt is auto-managed
    timestamps: true,
  }
);

// Compound index: published feed sorted by order then newest first
PostSchema.index({ isPublished: 1, order: 1, createdAt: -1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
