# Reading Notes · 读书笔记

读书笔记与 idea 分享网站。

## 功能

- **首页**：全部笔记列表、搜索、分页、按标签分类筛选
- **留言页**：发布笔记（支持上传图片和音频）+ 留言列表
- **中英文切换**：右上角一键切换语言

## 技术栈

- 前端：Vite + React 18 + TypeScript + Tailwind CSS v4 + React Router
- 后端：Node.js + Express + TypeScript + Multer（文件上传），REST API
- 数据库：PostgreSQL

## 目录

```
reading-notes/
├── client/   # 前端
│   └── src/
│       ├── components/  # Layout, NoteCard
│       ├── i18n/        # 中英文翻译
│       ├── pages/       # Home, Messages
│       └── ...
└── server/   # 后端
    ├── uploads/          # 上传文件存储
    └── src/
        ├── routes/       # notes, messages
        └── ...
```

## 运行

### 1. 准备数据库

```bash
docker run -d --name reading-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reading_notes \
  -p 5432:5432 postgres:16-alpine
```

### 2. 启动后端

```bash
cd server
cp .env.example .env
npm install
npm run db:init    # 建表 + 示例数据
npm run dev        # http://localhost:3001
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

## REST API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/notes?search=&tag=&page=&pageSize=` | 笔记列表（搜索、标签筛选、分页） |
| GET | `/api/notes/tags` | 所有标签 |
| GET | `/api/notes/:id` | 笔记详情 |
| POST | `/api/notes` | 发布笔记（multipart/form-data：title, content, tags, image, audio） |
| GET | `/api/messages` | 留言列表 |
| POST | `/api/messages` | 提交留言 |
