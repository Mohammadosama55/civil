import mongoose, { Schema, Document } from "mongoose";

export interface IPollOption {
  id: string;
  text: string;
  votes: number;
  votedBy: mongoose.Types.ObjectId[];
}

export interface IPoll extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  description?: string;
  options: IPollOption[];
  totalVotes: number;
  status: string;
  createdBy?: mongoose.Types.ObjectId;
  creatorName?: string;
  endsAt?: Date;
  createdAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
    votedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true },
    description: { type: String, default: null },
    options: [PollOptionSchema],
    totalVotes: { type: Number, default: 0 },
    status: { type: String, default: "active", enum: ["active", "closed"] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    creatorName: { type: String, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Poll = mongoose.model<IPoll>("Poll", PollSchema);
