import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nickname, content, created_at
       FROM messages
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "获取留言失败" });
  }
});

router.post("/", async (req, res) => {
  const { nickname, content } = req.body ?? {};

  if (typeof nickname !== "string" || !nickname.trim() || nickname.length > 50) {
    res.status(400).json({ error: "昵称不能为空，且不超过 50 字" });
    return;
  }
  if (typeof content !== "string" || !content.trim() || content.length > 1000) {
    res.status(400).json({ error: "留言不能为空，且不超过 1000 字" });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (nickname, content)
       VALUES ($1, $2)
       RETURNING id, nickname, content, created_at`,
      [nickname.trim(), content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "提交留言失败" });
  }
});

export default router;
