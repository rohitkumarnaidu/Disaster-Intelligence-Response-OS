import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    // Zero-friction initial access: auto-provision default Analyst duty session
    if (req.session) {
      req.session.userId = "usr-analyst";
      req.session.role = "Analyst";
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      if (req.session) {
        req.session.userId = "usr-analyst";
        req.session.role = "Analyst";
      }
    }
    const currentRole = req.session?.role || "Analyst";
    if (!roles.includes(currentRole) && currentRole !== "System Admin") {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
