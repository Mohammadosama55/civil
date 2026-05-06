import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  status: string;
  location: string;
  ward?: string;
  lat?: number;
  lng?: number;
  upvotes: number;
  upvotedBy: string[];
  imageUrl?: string;
  reportedBy?: mongoose.Types.ObjectId;
  reporterName?: string;
  complaintEmailSent: boolean;
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
    ward: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: String }],
    imageUrl: { type: String, default: null },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reporterName: { type: String, default: null },
    complaintEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);
