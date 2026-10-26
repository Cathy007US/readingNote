import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, UPLOAD_DIR } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "..", UPLOAD_DIR);

// 文件存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp3|wav|m4a|ogg|aac)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only images and audio files are supported"));
    }
  },
});

const router = Router();

// 根据 lang 选择对应的字段
function langColumns(lang: string) {
  if (lang === "en") {
    return {
      titleCol: "title_en",
      contentCol: "content_en",
      tagsCol: "tags_en",
    };
  }
  return {
    titleCol: "title",
    contentCol: "content",
    tagsCol: "tags",
  };
}

// 构建查询列，英文模式下如果英文字段为空则回退到中文
function buildSelect(lang: string) {
  const { titleCol, contentCol, tagsCol } = langColumns(lang);
  return `
    id,
    CASE WHEN ${titleCol} = '' THEN title ELSE ${titleCol} END AS title,
    CASE WHEN ${contentCol} = '' THEN content ELSE ${contentCol} END AS content,
    CASE WHEN array_length(${tagsCol}, 1) IS NULL THEN tags ELSE ${tagsCol} END AS tags,
    image_url, audio_url, created_at
  `;
}

// 笔记列表（搜索 + 分页 + tag 筛选 + 语言切换）
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const tag = String(req.query.tag ?? "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;
    const lang = String(req.query.lang ?? "zh");

    const cols = buildSelect(lang);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      // 搜索同时匹配中英文
      conditions.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length} OR title_en ILIKE $${params.length} OR content_en ILIKE $${params.length})`);
    }
    if (tag) {
      params.push(tag);
      // tag 同时匹配中英文数组
      conditions.push(`($${params.length} = ANY(tags) OR $${params.length} = ANY(tags_en))`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM notes ${where}`,
      params
    );
    const listResult = await pool.query(
      `SELECT ${cols} FROM notes ${where}
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    // 获取所有 tags（根据语言选择对应数组）
    const tagsCol = lang === "en" ? "tags_en" : "tags";
    const tagsResult = await pool.query(
      `SELECT t.tag FROM (
         SELECT DISTINCT unnest(${tagsCol}) AS tag FROM notes
       ) t
       WHERE t.tag IS NOT NULL AND t.tag != ''
       ORDER BY t.tag`
    );

    res.json({
      items: listResult.rows,
      total: totalResult.rows[0].total,
      page,
      pageSize,
      tags: tagsResult.rows.map((r) => r.tag).filter(Boolean),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// 获取所有 tag
router.get("/tags", async (req, res) => {
  try {
    const lang = String(req.query.lang ?? "zh");
    const tagsCol = lang === "en" ? "tags_en" : "tags";
    const { rows } = await pool.query(
      `SELECT t.tag FROM (
         SELECT DISTINCT unnest(${tagsCol}) AS tag FROM notes
       ) t
       WHERE t.tag IS NOT NULL AND t.tag != ''
       ORDER BY t.tag`
    );
    res.json({ tags: rows.map((r) => r.tag).filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }
  try {
    const lang = String(req.query.lang ?? "zh");
    const cols = buildSelect(lang);
    const { rows } = await pool.query(
      `SELECT ${cols} FROM notes WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// 发布笔记（支持上传图片 + 音频）
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      title, content, tags,
      titleEn, contentEn, tagsEn,
    } = req.body ?? {};

    if (typeof title !== "string" || !title.trim() || title.length > 200) {
      res.status(400).json({ error: "Title is required (max 200 chars)" });
      return;
    }
    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    function parseTags(val: unknown): string[] {
      if (Array.isArray(val)) {
        return val
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10);
      }
      if (typeof val === "string") {
        return val
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10);
      }
      return [];
    }

    const tagList = parseTags(tags);
    const tagListEn = parseTags(tagsEn);

    const files = req.files as
      | { image?: Express.Multer.File[]; audio?: Express.Multer.File[] }
      | undefined;

    const imageUrl = files?.image?.[0]
      ? `/uploads/${files.image[0].filename}`
      : "";
    const audioUrl = files?.audio?.[0]
      ? `/uploads/${files.audio[0].filename}`
      : "";

    try {
      const { rows } = await pool.query(
        `INSERT INTO notes (title, content, tags, title_en, content_en, tags_en, image_url, audio_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title, content, tags, title_en, content_en, tags_en, image_url, audio_url, created_at`,
        [
          title.trim(),
          content.trim(),
          tagList,
          (titleEn ?? "").trim(),
          (contentEn ?? "").trim(),
          tagListEn,
          imageUrl,
          audioUrl,
        ]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to publish note" });
    }
  }
);

export default router;
