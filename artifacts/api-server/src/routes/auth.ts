import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Email and password required" } });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create session" } });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ success: true });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!));
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
  }
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
