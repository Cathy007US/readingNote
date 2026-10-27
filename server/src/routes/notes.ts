import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

type SourceLang = "zh" | "en";

function buildNotePayload(body: Record<string, unknown>) {
  const sourceLang: SourceLang = body.source_lang === "en" ? "en" : "zh";
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const titleEn = String(body.title_en ?? "").trim();
  const contentEn = String(body.content_en ?? "").trim();
  const transcript = String(body.transcript ?? "").trim();
  const tagsEn = Array.isArray(body.tags_en)
    ? body.tags_en.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const imageUrl = String(body.image_url ?? "").trim();
  const audioUrl = String(body.audio_url ?? "").trim();

  const error =
    sourceLang === "en"
      ? !titleEn
        ? "英文标题必填"
        : !contentEn && !audioUrl
          ? "英文内容必填；如果使用音频，可以留空"
          : ""
      : !title
        ? "中文标题必填"
        : !content && !audioUrl
          ? "中文内容必填；如果使用音频，可以留空"
          : "";

  return {
    sourceLang,
    title,
    content,
    tags,
    titleEn,
    contentEn,
    transcript,
    tagsEn,
    imageUrl,
    audioUrl,
    error,
  };
}

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
    conditions.push(
      `(title ILIKE $${params.length} OR content ILIKE $${params.length}
        OR title_en ILIKE $${params.length} OR content_en ILIKE $${params.length})`
    );
  }
  if (tag) {
    params.push(tag);
    conditions.push(`($${params.length} = ANY(tags) OR $${params.length} = ANY(tags_en))`);
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
      `SELECT id, title, content, tags, title_en, content_en, transcript, tags_en,
              source_lang, image_url, audio_url, created_at
       FROM public.notes ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // 默认标签栏只展示中文标签；英文标签通过前端 EN 按钮单独展开
    const [tagRes, tagEnRes] = await Promise.all([
      pool.query(
        `SELECT DISTINCT tag
         FROM (SELECT unnest(tags) AS tag FROM public.notes) AS all_tags
         WHERE tag <> ''
         ORDER BY tag`
      ),
      pool.query(
        `SELECT DISTINCT tag
         FROM (SELECT unnest(tags_en) AS tag FROM public.notes) AS all_tags
         WHERE tag <> ''
         ORDER BY tag`
      ),
    ]);

    res.json({
      items: listRes.rows,
      total,
      page,
      pageSize,
      tags: tagRes.rows.map((r) => r.tag),
      tagsEn: tagEnRes.rows.map((r) => r.tag),
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
  const payload = buildNotePayload(req.body ?? {});
  if (payload.error) return res.status(400).json({ error: payload.error });

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.notes
        (title, content, tags, title_en, content_en, transcript, tags_en,
         source_lang, image_url, audio_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        payload.title,
        payload.content,
        payload.tags,
        payload.titleEn,
        payload.contentEn,
        payload.transcript,
        payload.tagsEn,
        payload.sourceLang,
        payload.imageUrl,
        payload.audioUrl,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "写入失败" });
  }
});

// 需登录：更新
router.put("/:id", requireAuth, async (req, res) => {
  const payload = buildNotePayload(req.body ?? {});
  if (payload.error) return res.status(400).json({ error: payload.error });

  try {
    const { rows } = await pool.query(
      `UPDATE public.notes SET
        title=$1, content=$2, tags=$3, title_en=$4, content_en=$5,
        transcript=$6, tags_en=$7, source_lang=$8, image_url=$9, audio_url=$10
       WHERE id=$11 RETURNING *`,
      [
        payload.title,
        payload.content,
        payload.tags,
        payload.titleEn,
        payload.contentEn,
        payload.transcript,
        payload.tagsEn,
        payload.sourceLang,
        payload.imageUrl,
        payload.audioUrl,
        req.params.id,
      ]
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
