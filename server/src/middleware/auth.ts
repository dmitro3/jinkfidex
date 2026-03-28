import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/db";

export interface AuthRequest extends Request {
  user?: { id: string; address: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { address: string };
    const user = await prisma.user.findUnique({ where: { address: decoded.address.toLowerCase() } });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = { id: user.id, address: user.address };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const admins = env.ADMIN_ADDRESSES.split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
    if (!admins.includes(req.user!.address.toLowerCase())) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { next(); return; }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { address: string; id: string };
    req.user = { id: decoded.id, address: decoded.address };
  } catch { /* ignore */ }
  next();
}
