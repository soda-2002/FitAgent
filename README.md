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
│   │   ├── daily/page.tsx    # 每日打卡
│   │   └── coach/page.tsx    # AI Coach 对话 + 周总结
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
│   │   │   ├── dashboard.py
│   │   │   ├── health.py
│   │   │   ├── profile.py
│   │   │   ├── food.py
│   │   │   ├── meal.py
│   │   │   ├── workout.py
│   │   │   ├── daily.py
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

# 3. 配置环境变量
cp .env.example .env

# 4. 启动服务（数据库在首次启动时自动初始化）
uvicorn app.main:app --reload --port 8000
```

后端运行于 `http://localhost:8000`。

当前后端 CORS 允许 `http://localhost:3000`、`http://localhost:3001`、`http://127.0.0.1:3000`、`http://127.0.0.1:3001`。

---

## 环境变量

后端从 `backend/.env` 读取配置：

```bash
DASHSCOPE_API_KEY=your_api_key_here
TEXT_MODEL=Qwen3.6-Flash
VISION_MODEL=qwen-vl-plus
```

Phase 2 调用 `TEXT_MODEL` 对应的 DashScope Qwen 文本模型。Phase 3 调用 `VISION_MODEL` 对应的 DashScope Qwen-VL 视觉模型，默认配置为 `qwen-vl-plus`。

如果没有配置 `DASHSCOPE_API_KEY`，或 Qwen / Qwen-VL 调用失败，后端会返回结构化 mock/fallback 结果，不会让接口整体崩溃。不要把真实 API Key 写入 README、前端代码或日志。

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

Phase 4 对已有 `daily_logs` 表做了安全扩展：启动后端时会检查 `weight`、`mood`、`workout_done`、`sleep_hours` 字段，旧数据库缺字段时自动 `ALTER TABLE ADD COLUMN`，不会删除已有数据。

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

### 文字饮食分析（Qwen 文本）

```bash
curl -X POST http://localhost:8000/food/text-analyze \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"text":"两个鸡蛋，一碗米饭"}'
```

### 图片上传分析（mock）

```bash
curl -X POST http://localhost:8000/food/image-analyze/mock \
  -F "user_id=1" \
  -F "image=@/path/to/food.jpg"
```

### 图片上传分析（Qwen-VL）

```bash
curl -X POST http://localhost:8000/food/image-analyze \
  -F "user_id=1" \
  -F "image=@/path/to/food.jpg"
```

图片上传支持 `jpg / jpeg / png / webp`，限制 5MB 以内。图片热量识别只是估算，不保证营养数据绝对准确，建议用户确认份量后再保存。

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

### Dashboard 真实数据统计

```bash
curl http://localhost:8000/dashboard/1
```

返回用户 Profile、今日饮食统计、最近 7 天平均热量/蛋白质、饮食记录数量、每日打卡数量、训练计划状态和规则建议。

### 保存每日打卡

```bash
curl -X POST http://localhost:8000/daily/logs \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"weight":79.5,"mood":"一般","workout_done":true,"sleep_hours":7,"summary":"今天饮食基本正常，晚上做了30分钟有氧。"}'
```

### 读取最近每日打卡

```bash
curl http://localhost:8000/daily/logs/1
```

### 生成减脂餐推荐（mock）

```bash
curl -X POST http://localhost:8000/meal/plan/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"ingredients":"鸡蛋、鸡胸肉、西红柿","preference":"高蛋白、低脂"}'
```

### 生成减脂餐推荐（Qwen 文本）

```bash
curl -X POST http://localhost:8000/meal/plan \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"ingredients":"鸡蛋、鸡胸肉、西红柿","preference":"高蛋白、低脂"}'
```

### 生成健身计划（mock）

```bash
curl -X POST http://localhost:8000/workout/plan/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1}'
```

### 生成健身计划（Qwen 文本）

```bash
curl -X POST http://localhost:8000/workout/plan \
  -H "Content-Type: application/json" \
  -d '{"user_id":1}'
```

### AI Coach 对话（mock）

```bash
curl -X POST http://localhost:8000/agent/chat/mock \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"message":"我今天吃得怎么样？"}'
```

### AI Coach 对话（Qwen 文本）

```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"message":"我今天吃多了怎么办？"}'
```

`/agent/chat` 会读取用户 Profile、最近 7 天饮食记录、最近 7 条每日打卡和最新训练计划。返回的 `used_context` 会说明实际使用了多少记录。

### 本周总结报告

```bash
curl -X POST http://localhost:8000/agent/week-report \
  -H "Content-Type: application/json" \
  -d '{"user_id":1}'
```

周总结会读取最近 7 天饮食记录、每日打卡和最新训练计划，调用 Qwen 文本模型生成中文复盘。没有 API Key、记录不足或模型输出格式异常时，会返回结构化 fallback 报告。

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

建议继续以 `fitagent/` 根目录作为统一仓库管理，便于同时追踪 `frontend/`、`backend/` 和文档改动。

---

## Phase 2 已完成功能：接入 Qwen 文本模型

- [x] `AIService.call_text_model()` 通过 DashScope OpenAI 兼容接口调用 `TEXT_MODEL`
- [x] 新增 `POST /food/text-analyze`：基于用户 Profile 的文本饮食估算
- [x] 新增 `POST /meal/plan`：基于用户 Profile 和食材偏好的减脂餐推荐
- [x] 新增 `POST /workout/plan`：基于用户 Profile 的一周训练计划，并保存到 `workout_plans`
- [x] 新增 `POST /agent/chat`：读取 Profile、最近饮食记录、最近训练计划后生成中文建议
- [x] 保留所有 `/mock` 接口；没有 API Key 或模型异常时返回结构化 fallback
- [x] 前端 Food / Meal / Workout / Coach 已切到真实文本接口
- [x] 图片上传识别仍保留 `/food/image-analyze/mock`，不调用视觉模型

---

## Phase 3 已完成功能：接入 Qwen-VL 图片识别

- [x] 实现 `AIService.call_vision_model()`：通过 DashScope OpenAI 兼容接口调用 `VISION_MODEL`
- [x] 实现 `analyze_food_image()`：图片 base64 data URL 编码，多模态调用，结构化 JSON 输出
- [x] 新增 `POST /food/image-analyze`：支持 jpg / jpeg / png / webp，限制 5MB
- [x] 保留 `POST /food/image-analyze/mock` 作为 mock/fallback 调试入口
- [x] 前端 Food 图片上传默认调用真实 `/food/image-analyze`
- [x] 图片识别结果仍需用户确认后，才通过 `POST /food/logs` 保存，`source=image`
- [x] 没有 API Key、视觉模型调用失败或 JSON 解析失败时，返回结构化 fallback
- [x] UI 提醒图片识别热量仅为估算，请确认份量后保存

---

## Phase 4 已完成功能：Agent Memory + 周总结

- [x] 新增 `GET /dashboard/{user_id}`：读取真实 Profile、饮食记录、训练计划和每日打卡，返回 Dashboard 统计与规则建议
- [x] 新增 Daily Check-in：`POST /daily/logs` 保存体重、心情、是否训练、睡眠和总结；`GET /daily/logs/{user_id}` 读取最近打卡
- [x] 新增 `POST /agent/week-report`：基于最近 7 天饮食、每日打卡和最新训练计划生成中文周总结
- [x] 增强 `/agent/chat`：读取 Profile、最近 7 天饮食记录、最近 7 条每日打卡和最新训练计划，并返回 `used_context`
- [x] 前端 Dashboard 改为展示真实后端统计，不再只显示 mock 数据
- [x] 前端新增 `/daily` 页面，支持提交打卡和查看最近 7 条记录
- [x] Coach 页面新增“生成本周总结”入口，不影响原有聊天功能
- [x] `daily_logs` 旧表启动时自动补字段，不删除已有数据

## 项目阶段概览

- Phase 1：工程骨架、FastAPI / Next.js / SQLite、Profile、mock 饮食分析、mock 健身计划、mock Coach
- Phase 1.5：`currentUserId` 本地状态、前后端接口路径和用户上下文修正
- Phase 2：接入 DashScope Qwen 文本模型，支持饮食文本分析、减脂餐、训练计划和 Coach
- Phase 3：接入 DashScope Qwen-VL 图片识别，支持真实食物图片分析
- Phase 4：Agent Memory、真实 Dashboard 统计、每日打卡、周总结和增强 Coach 上下文

> FitAgent 当前仍是减脂管理 Agent Demo，不提供医疗诊断或治疗建议。所有热量、营养和训练建议都应视为估算和健康管理参考。
