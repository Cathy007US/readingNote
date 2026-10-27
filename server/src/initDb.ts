import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));

function findSchemaSql(): string {
  // 编译后：dist/schema.sql（build 脚本会复制）
  const inDist = join(here, "schema.sql");
  if (existsSync(inDist)) return inDist;
  // 开发模式：src/schema.sql
  const inSrc = join(here, "schema.sql");
  if (existsSync(inSrc)) return inSrc;
  // 兜底：向上查找
  let dir = here;
  for (let i = 0; i < 3; i++) {
    const p = join(dir, "schema.sql");
    if (existsSync(p)) return p;
    const srcP = join(dir, "src", "schema.sql");
    if (existsSync(srcP)) return srcP;
    dir = dirname(dir);
  }
  throw new Error("schema.sql not found");
}

async function main() {
  const sqlPath = findSchemaSql();
  const sql = readFileSync(sqlPath, "utf8");
  await pool.query(sql);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM notes");
  if (rows[0].n === 0) {
    await pool.query(
      `INSERT INTO notes
        (title, content, tags, title_en, content_en, tags_en)
       VALUES
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18)`,
      [
        // Note 1: 被讨厌的勇气
        "《被讨厌的勇气》读后感",
        "一切烦恼都来自人际关系。如果想要自由，就必须有被讨厌的勇气。阿德勒心理学的核心在于课题分离——把自己能控制的和不能控制的分开，只关注自己能控制的部分。",
        ["心理学", "阿德勒", "成长"],
        "Thoughts on 'The Courage to Be Disliked'",
        "All problems are interpersonal relationship problems. To be free, you need the courage to be disliked. The core of Adlerian psychology is the separation of tasks — distinguishing what you can control from what you cannot, and focusing only on what you can.",
        ["Psychology", "Adler", "Growth"],

        // Note 2: 活着
        "《活着》笔记",
        "人是为活着本身而活着，而不是为了活着之外的任何事物而活着。福贵的一生让我明白，生命的力量不在于拥有多少，而在于承受了多少之后依然前行。",
        ["文学", "余华", "生命"],
        "Notes on 'To Live'",
        "People live for the sake of living itself, not for anything beyond living. Fugui's life taught me that the power of life lies not in how much you have, but in how much you can endure and still move forward.",
        ["Literature", "Yu Hua", "Life"],

        // Note 3: 原子习惯
        "《原子习惯》摘要",
        "习惯是自我提高的复利。每天进步1%，一年后就是37倍。关键不是目标，而是系统——专注于过程而非结果，让好习惯变得显而易见、有吸引力、简单、令人满足。",
        ["习惯", "自我管理", "方法论"],
        "Summary of 'Atomic Habits'",
        "Habits are the compound interest of self-improvement. Improving 1% every day means 37x better in a year. The key is not the goal but the system — focus on the process, not the outcome. Make good habits obvious, attractive, simple, and satisfying.",
        ["Habits", "Self-management", "Methodology"],
      ]
    );
  }

  console.log("数据库初始化完成");
  await pool.end();
}

main().catch((err) => {
  console.error("数据库初始化失败：", err);
  process.exit(1);
});
