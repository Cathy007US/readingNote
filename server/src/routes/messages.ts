import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// 公开：列表（分页 + 搜索），返回 { items, total, page, pageSize }
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
  const search = String(req.query.q ?? req.query.search ?? "").trim();
  const offset = (page - 1) * pageSize;

  const params: unknown[] = [];
  let where = "";
  if (search) {
    params.push(`%${search}%`);
    where = `WHERE nickname ILIKE $1 OR content ILIKE $1`;
  }

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM public.messages ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    params.push(pageSize, offset);
    const listRes = await pool.query(
      `SELECT id, nickname, content, created_at FROM public.messages ${where}
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

// 公开：新增留言
router.post("/", async (req, res) => {
  const { nickname, content } = req.body;
  if (!nickname || !content) return res.status(400).json({ error: "昵称和内容必填" });
  const { rows } = await pool.query(
    `INSERT INTO public.messages (nickname, content) VALUES ($1,$2) RETURNING *`,
    [nickname, content]
  );
  res.status(201).json(rows[0]);
});

// 需登录：删除
router.delete("/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM public.messages WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;