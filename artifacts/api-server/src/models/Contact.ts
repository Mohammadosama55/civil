import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<IContact>("Contact", ContactSchema);
