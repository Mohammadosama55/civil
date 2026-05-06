import { Request, Response, NextFunction } from "express";
import { getIsConnected } from "../lib/mongodb";

export function requireDB(req: Request, res: Response, next: NextFunction): void {
  if (!getIsConnected()) {
    res.status(503).json({
      error: "Database unavailable",
      message: "MongoDB is not connected. Please set the MONGODB_URI secret.",
    });
    return;
  }
  next();
}
