import mongoose, { Schema, Document } from "mongoose";

export interface ISOS extends Document {
  _id: mongoose.Types.ObjectId;
  location: string;
  description: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  status: string;
  createdAt: Date;
}

const SOSSchema = new Schema<ISOS>(
  {
    location: { type: String, required: true },
    description: { type: String, required: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    contactName: { type: String, default: null },
    status: { type: String, default: "received" },
  },
  { timestamps: true }
);

export const SOS = mongoose.model<ISOS>("SOS", SOSSchema);
