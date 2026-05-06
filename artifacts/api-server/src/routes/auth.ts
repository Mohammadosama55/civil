import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { RegisterBody, LoginBody, UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "civix-secret-dev";
const COOKIE_NAME = "civix_token";

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function formatUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    name: user.name ?? null,
    location: user.location ?? null,
    bio: user.bio ?? null,
    avatar: user.avatar ?? null,
    role: user.role,
    issueCount: user.issueCount,
    createdAt: user.createdAt.toISOString(),
  };
}

export function getAuthMiddleware() {
  return async function authMiddleware(
    req: Parameters<Router>[0],
    res: Parameters<Router>[1],
    next: Parameters<Router>[2]
  ): Promise<void> {
    const token =
      req.cookies?.[COOKIE_NAME] ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(payload.userId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      (req as any).user = user;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, email, password, name, location } = parsed.data;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(400).json({ error: "Email or username already taken" });
    return;
  }

  const user = await User.create({ username, email, password, name, location });
  const token = signToken(user._id.toString());

  res
    .cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 })
    .status(201)
    .json({ user: formatUser(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user._id.toString());
  res
    .cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({ user: formatUser(user), token });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(COOKIE_NAME).json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token =
    req.cookies?.[COOKIE_NAME] ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.patch("/auth/profile", async (req, res): Promise<void> => {
  const token =
    req.cookies?.[COOKIE_NAME] ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findByIdAndUpdate(payload.userId, { $set: parsed.data }, { new: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
