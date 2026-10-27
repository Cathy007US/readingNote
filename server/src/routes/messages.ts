import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// 公开：列表（分页 + 搜索）。只返回审核通过的留言。
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
  const search = String(req.query.q ?? req.query.search ?? "").trim();
  const offset = (page - 1) * pageSize;

  const params: unknown[] = [];
  const conditions: string[] = ["status = 'approved'"];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(nickname ILIKE $${params.length} OR content ILIKE $${params.length})`
    );
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM public.messages ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    params.push(pageSize, offset);
    const listRes = await pool.query(
      `SELECT id, nickname, content, status, reviewed_at, created_at
       FROM public.messages ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      items: listRes.rows,
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询失败" });
  }
});

// 公开：提交留言。新留言一律进入待审核状态，审核通过后才会在列表中出现。
router.post("/", async (req, res) => {
  const nickname = String(req.body?.nickname ?? "").trim();
  const content = String(req.body?.content ?? "").trim();

  if (!nickname || !content) {
    return res.status(400).json({ error: "昵称和内容必填" });
  }
  if (nickname.length > 50) {
    return res.status(400).json({ error: "昵称不能超过 50 个字符" });
  }
  if (content.length > 1000) {
    return res.status(400).json({ error: "留言内容不能超过 1000 个字符" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.messages (nickname, content, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, nickname, content, status, reviewed_at, created_at`,
      [nickname, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "提交失败，请稍后再试" });
  }
});

export default router;
