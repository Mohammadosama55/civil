import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  status: string;
  location: string;
  lat?: number;
  lng?: number;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  imageUrl?: string;
  reportedBy?: mongoose.Types.ObjectId;
  reporterName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, required: true },
    status: { type: String, default: "open", enum: ["open", "in-progress", "resolved"] },
    location: { type: String, required: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    imageUrl: { type: String, default: null },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reporterName: { type: String, default: null },
  },
  { timestamps: true }
);

export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);
