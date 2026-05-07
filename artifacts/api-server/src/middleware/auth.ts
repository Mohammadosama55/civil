import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction, type Router } from "express";
import { User } from "../models/User";

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "civix-secret-dev";
export const COOKIE_NAME = "civix_token";

export function extractToken(req: Request): string | null {
  return (
    req.cookies?.[COOKIE_NAME] ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null)
  );
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export function requireAuth(): (
  req: Parameters<Router>[0],
  res: Parameters<Router>[1],
  next: Parameters<Router>[2]
) => Promise<void> {
  return async function authMiddleware(req, res, next): Promise<void> {
    const token = extractToken(req as Request);
    if (!token) {
      (res as Response).status(401).json({ error: "Not authenticated" });
      return;
    }
    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);
      if (!user) {
        (res as Response).status(401).json({ error: "User not found" });
        return;
      }
      (req as any).user = user;
      next();
    } catch {
      (res as Response).status(401).json({ error: "Invalid token" });
    }
  };
}

export async function requireWardAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user || user.role !== "ward_admin") {
      res.status(403).json({ error: "Forbidden — ward admin only" });
      return;
    }
    (req as any).user = user;
    (req as any).dbUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
