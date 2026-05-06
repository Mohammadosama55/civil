import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  category: string;
  rating: number;
  message: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    category: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
