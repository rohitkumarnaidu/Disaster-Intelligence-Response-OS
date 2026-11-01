import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    // Development fallback only when explicitly enabled via environment variable
    if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_AUTO_AUTH === "true") {
      if (req.session) {
        req.session.userId = "usr-analyst";
        req.session.role = "Analyst";
        return next();
      }
    }
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_AUTO_AUTH === "true") {
        if (req.session) {
          req.session.userId = "usr-analyst";
          req.session.role = "Analyst";
        }
      } else {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
        return;
      }
    }
    const currentRole = req.session?.role;
    if (!currentRole || (!roles.includes(currentRole) && currentRole !== "System Admin")) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
