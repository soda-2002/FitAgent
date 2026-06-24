# FitAgent

**基于 FastAPI + Qwen 多模态模型构建的 AI 私人减脂教练 Agent**

> 实现食物图片识别、个性化饮食规划、训练计划生成以及长期用户记录分析。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| Frontend | Next.js 16.2.9 · TypeScript · Tailwind CSS |
| Backend | FastAPI · Python 3.9+ |
| Database | SQLite (via SQLAlchemy async + aiosqlite) |
| AI (Phase 2+) | DashScope Qwen (文本) |
| AI (Phase 3+) | DashScope Qwen-VL (视觉) |

---

## 目录结构

```
fitagent/
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── profile/page.tsx  # 用户建档
│   │   ├── food/page.tsx     # 食物分析（文字 + 图片）
│   │   ├── meal/page.tsx     # 食材推荐减脂餐
│   │   ├── workout/page.tsx  # 健身计划
│   │   └── coach/page.tsx    # AI Coach 对话
│   ├── components/NavBar.tsx
│   ├── lib/api.ts            # 统一 API 请求封装
│   ├── lib/currentUser.ts    # Demo 当前用户 localStorage 状态
│   ├── types/index.ts        # TypeScript 类型定义
│   └── .env.local            # NEXT_PUBLIC_API_BASE_URL
│
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI 入口 + CORS
│   │   ├── config.py         # 环境变量配置
│   │   ├── database.py       # SQLAlchemy async engine
│   │   ├── models.py         # ORM 数据模型
│   │   ├── schemas.py        # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── profile.py
│   │   │   ├── food.py
│   │   │   ├── meal.py
│   │   │   ├── workout.py
│   │   │   └── agent.py
│   │   └── services/
│   │       └── ai_service.py # AI 服务（Phase 1 为 mock）
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## 启动后端

```bash
cd backend

# 1. 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量（Phase 1 可跳过，无需真实 API Key）
cp .env.example .env

# 4. 启动服务（数据库在首次启动时自动初始化）
uvicorn app.main:app --reload --port 8000
```

后端运行于 `http://localhost:8000`。

当前后端 CORS 允许 `http://localhost:3000`。如果前端开发服务运行到 `3001` 或其他端口，需要同步修改 `backend/app/main.py` 中的 `allow_origins`。

---

## 启动前端

```bash
cd frontend

# 安装依赖（首次）
npm install

# 开发模式
npm run dev
```

前端默认运行于 `http://localhost:3000`。

---

## 数据库初始化

SQLite 数据库文件 `backend/fitagent.db` **在后端首次启动时自动创建**，无需额外操作。

如需重置数据库：

```bash
rm backend/fitagent.db
# 重启后端即可重新初始化
```

---

## 测试核心接口

### 健康检查

```bash
curl http://localhost:8000/health
# → {"status":"ok","message":"FitAgent backend is running"}
```

### 用户建档

```bash
curl -X POST http://localhost:8000/profile \
  -H "Content-Type: application/json" \
  -d '{"height":175,"weight":80,"age":28,"gender":"male","goal":"减脂","target_weight":70,"training_level":"beginner","weekly_training_days":3}'
```

### 文字饮食分析（mock）

```bash
curl -X POST http://localhost:8000/food/text-analyze/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"text":"两个鸡蛋，一碗米饭"}'
```

### 图片上传分析（mock）

```bash
curl -X POST http://localhost:8000/food/image-analyze/mock \
  -F "user_id=1" \
  -F "image=@/path/to/food.jpg"
```

### 保存饮食记录

```bash
curl -X POST http://localhost:8000/food/logs \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"food_name":"鸡蛋","calories":140,"protein":12,"carbs":1,"fat":10,"date":"2026-06-21","source":"text"}'
```

### 读取饮食记录

```bash
curl http://localhost:8000/food/logs/1
```

### 生成减脂餐推荐（mock）

```bash
curl -X POST http://localhost:8000/meal/plan/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"ingredients":"鸡蛋、鸡胸肉、西红柿","preference":"高蛋白、低脂"}'
```

### 生成健身计划（mock）

```bash
curl -X POST http://localhost:8000/workout/plan/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1}'
```

### AI Coach 对话（mock）

```bash
curl -X POST http://localhost:8000/agent/chat/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"message":"我今天吃得怎么样？"}'
```

### Swagger UI

访问 `http://localhost:8000/docs` 可查看并测试所有接口。

---

## Phase 1 已完成功能

- [x] Next.js + TypeScript + Tailwind 前端框架
- [x] FastAPI 后端，统一 CORS 配置
- [x] SQLite 数据库，自动初始化（4 张表：users / food_logs / workout_plans / daily_logs）
- [x] 前后端通信，`NEXT_PUBLIC_API_BASE_URL` 统一配置
- [x] Dashboard：后端连接状态 + 用户信息摘要 + 今日热量/蛋白质统计
- [x] Profile 页面：建档表单，提交保存到数据库
- [x] Food Analyzer：文字输入分析（mock）+ 图片上传预览 + 图片分析（mock）+ 确认保存记录
- [x] Meal Planner：食材输入 + mock 减脂餐推荐
- [x] Workout Plan：一键生成 7 天 mock 训练计划，保存到数据库
- [x] AI Coach：对话界面，mock 回复
- [x] `AIService` 类预留所有方法（`analyze_food_text` / `analyze_food_image` / `generate_meal_plan` / `generate_workout_plan` / `coach_chat`）
- [x] 环境变量管理（`DASHSCOPE_API_KEY` / `TEXT_MODEL` / `VISION_MODEL`），模型名不硬编码

---

## Phase 1.5 已修复内容

- [x] 前端新增 `frontend/lib/currentUser.ts`，用 `localStorage` 管理 Demo 当前用户 `currentUserId`
- [x] Profile 提交成功后保存后端返回的 `user_id`
- [x] Dashboard / Food / Meal / Workout / Coach 统一读取 `currentUserId`，不再静默使用 `1`
- [x] 未设置当前用户时，相关页面显示清晰提示并禁用提交动作
- [x] 新增后端 `POST /meal/plan/mock`，Meal Planner 不再复用 `/agent/chat/mock`
- [x] 保留 `/agent/chat/mock` 给 AI Coach 使用
- [x] 修正 README 中 Next.js 版本和 CORS/端口说明

---

## 版本控制说明

当前 `fitagent/` 根目录不是 git 仓库，只有 `frontend/` 内存在 `.git`。后续进入 Phase 2 前，建议把 `fitagent/` 根目录作为统一仓库管理，以便同时追踪 `frontend/` 和 `backend/` 的改动。

---

## Phase 2 待办：接入 Qwen 文本模型

- [ ] 在 `backend/.env` 中填写真实 `DASHSCOPE_API_KEY`
- [ ] 实现 `AIService.call_text_model()` — 调用 DashScope OpenAI 兼容接口
- [ ] 实现 `analyze_food_text()` — 真实营养分析，JSON 输出
- [ ] 实现 `generate_meal_plan()` — 基于用户 Profile 生成减脂餐
- [ ] 实现 `generate_workout_plan()` — 基于用户 Profile 生成真实训练计划
- [ ] 将 `/food/text-analyze/mock` → `/food/text-analyze`（路由升级）

---

## Phase 3 待办：接入 Qwen-VL 图片识别

- [ ] 实现 `AIService.call_vision_model()` — 调用 DashScope Qwen-VL
- [ ] 实现 `analyze_food_image()` — 图片 base64 编码，多模态调用，结构化 JSON 输出
- [ ] 前端图片上传压缩（控制图片大小 < 1MB）
- [ ] 将 `/food/image-analyze/mock` → `/food/image-analyze`（路由升级）

---

## Phase 4 待办：Agent + Memory

- [ ] 实现 `coach_chat()` — 真实 Agent Tool Calling
- [ ] 工具：`get_user_profile()` / `get_food_history()` / `get_workout_plan()` / `save_user_record()`
- [ ] AI 回复基于用户历史数据个性化生成
