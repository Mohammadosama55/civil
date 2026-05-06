import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export function getIsConnected(): boolean {
  return isConnected;
}

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    logger.warn("MONGODB_URI not set — running without MongoDB (in-memory fallback)");
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }
}

export { mongoose };
