import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SECRET = process.env.JWT_SECRET ?? "dev-secret";

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }
  const token = jwt.sign({ role: "admin" }, SECRET, { expiresIn: "7d" });
  res.json({ token });
});

router.get("/me", requireAuth, (_req, res) => {
  res.json({ ok: true, role: "admin" });
});

export default router;