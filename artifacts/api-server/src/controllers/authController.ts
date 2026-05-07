import { type Request, type Response } from "express";
import { User } from "../models/User";
import { RegisterBody, LoginBody, UpdateProfileBody } from "@workspace/api-zod";
import { signToken, verifyToken, extractToken, COOKIE_NAME } from "../middleware/auth";

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, maxAge: 7 * 24 * 60 * 60 * 1000 };

export function formatUser(user: InstanceType<typeof User>) {
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

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { username, email, password, name, location } = parsed.data;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) { res.status(400).json({ error: "Email or username already taken" }); return; }

  const user = await User.create({ username, email, password, name, location });
  const token = signToken(user._id.toString());
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS).status(201).json({ user: formatUser(user), token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ error: "Invalid email or password" }); return;
  }

  const token = signToken(user._id.toString());
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS).json({ user: formatUser(user), token });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME).json({ message: "Logged out" });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const payload = verifyToken(token);
    const user = await User.findByIdAndUpdate(payload.userId, { $set: parsed.data }, { new: true });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
