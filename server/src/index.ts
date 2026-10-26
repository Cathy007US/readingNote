import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import notesRouter from "./routes/notes.js";
import messagesRouter from "./routes/messages.js";
import { PORT, CORS_ORIGIN, UPLOAD_DIR, pingDatabase } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "5mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "5mb" })
);

// 静态文件：上传的图片/音频
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "..", UPLOAD_DIR), {
    maxAge: "7d",
  })
);

app.get("/api/health", async (_req, res) => {
  try {
    await pingDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api/notes", notesRouter);
app.use("/api/messages", messagesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

app.listen(PORT, async () => {
  console.log(`API 服务已启动：http://localhost:${PORT}`);
  try {
    await pingDatabase();
    console.log("PostgreSQL 连接正常");
  } catch (err) {
    console.error("PostgreSQL 连接失败：", err);
  }
});
