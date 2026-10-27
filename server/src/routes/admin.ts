import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SECRET = process.env.JWT_SECRET ?? "dev-secret";

const MESSAGE_STATUSES = ["pending", "approved", "rejected"] as const;
type MessageStatus = (typeof MESSAGE_STATUSES)[number];

const emptyCounts = { pending: 0, approved: 0, rejected: 0, all: 0 };

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

// 后台：留言列表（含待审核 / 已拒绝），支持状态筛选、搜索、分页
router.get("/messages", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Number(req.query.pageSize) || 10);
  const q = String(req.query.q ?? "").trim();
  const statusParam = String(req.query.status ?? "all");

  if (statusParam !== "all" && !MESSAGE_STATUSES.includes(statusParam as MessageStatus)) {
    return res.status(400).json({ error: "无效的留言状态" });
  }

  const params: unknown[] = [];
  const conditions: string[] = [];

  if (statusParam !== "all") {
    params.push(statusParam);
    conditions.push(`status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(nickname ILIKE $${params.length} OR content ILIKE $${params.length})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  try {
    // 角标数量跟随搜索条件，但不跟随状态筛选，方便在标签间切换
    const countParams: unknown[] = [];
    let countWhere = "";
    if (q) {
      countParams.push(`%${q}%`);
      countWhere = `WHERE (nickname ILIKE $1 OR content ILIKE $1)`;
    }

    const countsRes = await pool.query(
      `SELECT status, COUNT(*)::int AS n
       FROM public.messages ${countWhere}
       GROUP BY status`,
      countParams
    );

    const counts = { ...emptyCounts };
    for (const row of countsRes.rows as { status: MessageStatus; n: number }[]) {
      if (MESSAGE_STATUSES.includes(row.status)) counts[row.status] = row.n;
      counts.all += row.n;
    }

    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM public.messages ${where}`,
      params
    );
    const total = totalRes.rows[0].total;

    const listRes = await pool.query(
      `SELECT id, nickname, content, status, reviewed_at, created_at
       FROM public.messages ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    res.json({
      items: listRes.rows,
      total,
      page,
      pageSize,
      counts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询失败" });
  }
});

// 后台：审核留言（通过 / 拒绝 / 重新置为待审核）
router.patch("/messages/:id", requireAuth, async (req, res) => {
  const status = req.body?.status as MessageStatus;
  if (!MESSAGE_STATUSES.includes(status)) {
    return res.status(400).json({ error: "无效的留言状态" });
  }

  try {
    const reviewedAt = status === "pending" ? null : new Date();
    const { rows } = await pool.query(
      `UPDATE public.messages
       SET status = $1, reviewed_at = $2
       WHERE id = $3
       RETURNING id, nickname, content, status, reviewed_at, created_at`,
      [status, reviewedAt, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "留言不存在" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "审核失败" });
  }
});

// 后台：删除留言
router.delete("/messages/:id", requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM public.messages WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "留言不存在" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "删除失败" });
  }
});

export default router;
