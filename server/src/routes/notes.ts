import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// 公开：列表（分页 + 搜索 + 标签过滤），返回 { items, total, page, pageSize, tags }
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
  const search = String(req.query.q ?? req.query.search ?? "").trim();
  const tag = String(req.query.tag ?? "").trim();
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
  }
  if (tag) {
    params.push(tag);
    conditions.push(`$${params.length} = ANY(tags)`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM public.notes ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    params.push(pageSize, offset);
    const listRes = await pool.query(
      `SELECT id, title, content, tags, title_en, content_en, tags_en,
              image_url, audio_url, created_at
       FROM public.notes ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const tagRes = await pool.query(
      `SELECT DISTINCT unnest(tags) AS tag FROM public.notes ORDER BY tag`
    );

    res.json({
      items: listRes.rows,
      total,
      page,
      pageSize,
      tags: tagRes.rows.map((r) => r.tag),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询失败" });
  }
});

// 公开：单条
router.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM public.notes WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "不存在" });
  res.json(rows[0]);
});

// 需登录：新增
router.post("/", requireAuth, async (req, res) => {
  const { title, content, tags, title_en, content_en, tags_en, image_url, audio_url } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title 和 content 必填" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO public.notes
        (title, content, tags, title_en, content_en, tags_en, image_url, audio_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, content, tags ?? [], title_en ?? "", content_en ?? "", tags_en ?? [], image_url ?? "", audio_url ?? ""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "写入失败" });
  }
});

// 需登录：更新
router.put("/:id", requireAuth, async (req, res) => {
  const { title, content, tags, title_en, content_en, tags_en, image_url, audio_url } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE public.notes SET
        title=$1, content=$2, tags=$3, title_en=$4, content_en=$5,
        tags_en=$6, image_url=$7, audio_url=$8
       WHERE id=$9 RETURNING *`,
      [title, content, tags ?? [], title_en ?? "", content_en ?? "", tags_en ?? "", image_url ?? "", audio_url ?? "", req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "不存在" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "更新失败" });
  }
});

// 需登录：删除
router.delete("/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM public.notes WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;