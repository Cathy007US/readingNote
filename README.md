# Reading Notes · 读书笔记

读书笔记与 idea 分享网站。

## 功能

- **首页**：全部笔记列表、搜索、分页、按标签分类筛选
- **留言页**：纯留言功能（昵称 + 内容 + 留言列表），留言提交后需经后台审核，通过后才会公开展示
- **留言审核**：后台 `/admin/messages` 支持待审核、已通过、已拒绝筛选，可进行通过、拒绝、撤回、删除操作
- **笔记翻译**：每张笔记右上角可在原文与译文之间切换；后台发布时可指定中文或英文为原文
- **音频笔记**：填写音频后可只发布音频，正文可留空；有文字稿时可在前台切换「Show txt / Hide txt」

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
        ├── routes/       # notes, messages, admin
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
npm run db:init    # 建表 + 示例数据（升级时也执行一次，用于添加审核/原文语言/文字稿字段）
npm run dev        # http://localhost:3001
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

## 笔记原文与翻译

1. 后台「发布笔记」页面先选择「原文语言」：中文或 English。
2. 被选为原文的一组标题必填；没有音频时正文也必填，填写了 `audio_url` 后正文可以留空。另一组作为译文，可以留空。
3. 前台默认展示原文；如果译文完整，笔记卡片右上角会出现「→ EN」按钮（英文原文则为「→ 中文」），点击切换为译文后按钮变为「→ 原文」，再点可切回。
4. 译文标题或正文为空时，前台显示灰色「原文」按钮，不可点击，避免切换到空白内容。
5. 搜索和标签筛选会同时匹配中英文标题、正文和标签。
6. 首页标签栏默认展示中文标签；点击「全部」右侧的「EN」可展开全部英文标签，再次点击回到中文标签。

### 音频笔记

1. 后台填写「音频 URL」后，原文正文可以留空，标题仍然必填。
2. 只有纯音频笔记（中英文正文都为空）才会把右上角按钮换成「Show txt」；如果同时填写了正文，则仍然显示「→ EN / → 原文」，正文正常展示，音频也正常播放。
3. 纯音频笔记可以在后台填写可选的「文字稿」（`transcript` 字段）。前台内容区显示音频播放器；点击「Show txt」后文字稿显示在音频上方，按钮变为「Hide txt」，可来回切换。
4. 没有填写文字稿时，「Show txt」按钮置灰，音频仍然可以播放。
5. 音频功能复用已有的 `audio_url` 字段，新增可选 `transcript` 字段用于文字稿；不需要语音识别服务。
6. 前台音频播放器通过 `controlsList="nodownload"` 隐藏下载入口，并禁用右键菜单。

> 旧版本数据库升级后请执行一次 `npm run db:init`，会自动添加留言审核字段（`status`、`reviewed_at`）、笔记原文语言字段（`source_lang`）和音频文字稿字段（`transcript`）。旧留言会标记为已通过，旧笔记默认视为中文原文。

## 留言审核流程

1. 访客在留言页提交留言，后端以 `pending`（待审核）状态入库，前台不会立即显示。
2. 管理员登录后台后进入「留言列表」，在「待审核」标签中查看留言。
3. 点击「通过」后留言变为 `approved`，刷新前台留言页即可看到；点击「拒绝」则不会展示。
4. 已审核的留言可以「撤回」重新变为待审核，也可以直接删除。

## REST API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/notes?search=&tag=&page=&pageSize=` | 笔记列表（中英文搜索、标签筛选、分页） |
| GET | `/api/notes/:id` | 笔记详情 |
| POST | `/api/notes` | 发布笔记（JSON：title, content, tags, title_en, content_en, transcript, tags_en, source_lang, image_url, audio_url；有 audio_url 时 content 可留空） |
| GET | `/api/messages` | 已审核通过的留言列表 |
| POST | `/api/messages` | 提交留言（默认进入待审核状态） |
| POST | `/api/admin/login` | 管理员登录，返回 JWT |
| GET | `/api/admin/messages?status=&q=&page=&pageSize=` | 后台留言列表（需登录，`status`：pending / approved / rejected / all） |
| PATCH | `/api/admin/messages/:id` | 审核留言（需登录，body：`{ "status": "approved" }`） |
| DELETE | `/api/admin/messages/:id` | 删除留言（需登录） |

> `source_lang` 取值：`zh`（中文原文）或 `en`（英文原文）。非原文语言的一组字段作为译文，可以为空；译文标题或正文不完整时，前台显示灰色「原文」。
>
> `GET /api/notes` 额外返回 `tagsEn`（全部英文标签）。前端默认展示 `tags`（中文标签），点击标签栏的「EN」后展示 `tagsEn`。
