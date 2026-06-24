# FitAgent

**基于多模态识别与长期记录的 AI 私人减脂教练 Agent Demo**

FitAgent 是一个作品集级 AI Agent Demo，基于 **FastAPI + Next.js + SQLite + DashScope Qwen / Qwen-VL** 构建。它支持文字饮食分析、图片识别食物、食材减脂餐推荐、健身计划生成、每日打卡、真实 Dashboard 统计、AI Coach 对话和周总结报告。

> 注意：FitAgent 不提供医疗诊断或治疗建议。所有热量、营养和训练建议仅作为健康管理参考。

---

## 项目亮点

- **多模态食物识别**：基于 Qwen-VL 分析食物图片，估算热量与营养。
- **个性化饮食分析**：结合用户 Profile 分析文本饮食输入。
- **减脂餐推荐**：根据现有食材生成高蛋白、低脂、易执行的菜谱。
- **健身计划生成**：根据身高体重、目标、训练水平生成一周训练计划。
- **Agent Memory**：读取用户 Profile、饮食记录、每日打卡、训练计划后进行上下文回答。
- **周总结报告**：基于最近 7 天记录生成复盘和下周建议。
- **前后端分离**：Next.js + FastAPI + SQLite，适合快速演示和本地运行。

---

## 功能预览

后续可补充截图或录屏 GIF。

- **Dashboard**：展示今日热量、蛋白质、最近记录和 AI 建议。
- **Food Analyzer**：支持文字输入和图片上传识别食物。
- **Meal Planner**：根据食材生成减脂餐。
- **Workout Plan**：生成一周健身计划。
- **Daily Check-in**：记录体重、心情、睡眠、训练完成情况。
- **AI Coach**：结合用户记录进行问答和周总结。

---

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Frontend | Next.js 16.2.9, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.9+ |
| Database | SQLite, SQLAlchemy async, aiosqlite |
| AI | DashScope Qwen, Qwen-VL |
| Storage | localStorage for demo current user state |
| Dev | Git, npm, venv |

---

## 项目结构

```text
fitagent/
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Dashboard
│   │   ├── profile/page.tsx     # 用户建档
│   │   ├── food/page.tsx        # Food Analyzer：文字 + 图片饮食分析
│   │   ├── meal/page.tsx        # Meal Planner：减脂餐推荐
│   │   ├── workout/page.tsx     # Workout Plan：健身计划生成
│   │   ├── daily/page.tsx       # Daily Check-in：每日打卡
│   │   └── coach/page.tsx       # AI Coach：对话 + 周总结
│   ├── components/
│   │   ├── NavBar.tsx
│   │   └── ui.tsx
│   ├── lib/
│   │   ├── api.ts               # 前端 API 请求封装
│   │   └── currentUser.ts       # Demo 当前用户 localStorage 状态
│   └── types/index.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口 + CORS
│   │   ├── config.py            # 环境变量配置
│   │   ├── database.py          # SQLite 初始化与轻量迁移
│   │   ├── models.py            # ORM 数据模型
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── dashboard.py
│   │   │   ├── food.py
│   │   │   ├── meal.py
│   │   │   ├── workout.py
│   │   │   ├── daily.py
│   │   │   └── agent.py
│   │   └── services/
│   │       └── ai_service.py    # DashScope Qwen / Qwen-VL 调用与 fallback
│   ├── requirements.txt
│   └── .env.example
│
├── start.sh                     # 一键启动脚本
└── README.md
```

---

## 快速开始

### 环境要求

| 工具 | 建议版本 |
| --- | --- |
| Python | 3.9+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | 任意近期版本 |

### 第一步：克隆项目

```bash
git clone https://github.com/你的用户名/FitAgent.git
cd FitAgent
```

### 第二步：安装后端依赖

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 第三步：配置后端环境变量

```bash
cp .env.example .env
```

编辑 `backend/.env`：

```bash
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TEXT_MODEL=qwen3.6-flash
VISION_MODEL=qwen-vl-plus
```

说明：

- 不要提交真实 API Key。
- 如果没有 API Key，系统会返回结构化 fallback/mock，不会崩溃。
- 如果你的 DashScope 控制台使用不同模型名，请以实际可用模型名为准。

### 第四步：启动后端

```bash
uvicorn app.main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```

### 第五步：安装前端依赖

```bash
cd ../frontend
npm install
```

### 第六步：配置前端环境变量

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF
```

### 第七步：启动前端

默认启动：

```bash
npm run dev
```

如果 `3000` 端口被占用：

```bash
npm run dev -- -p 3001
```

浏览器访问：

- `http://localhost:3000`
- 或 `http://localhost:3001`

---

## 一键启动

项目根目录提供了 `start.sh`。

首次使用仍需先安装后端和前端依赖，并配置 `backend/.env`。之后可在项目根目录运行：

```bash
chmod +x start.sh
./start.sh
```

说明：

- 后端运行在 `http://localhost:8000`
- 前端运行在 `http://localhost:3001`
- `Ctrl + C` 可同时停止前后端

---

## 环境变量说明

### backend/.env

| 变量 | 说明 |
| --- | --- |
| `DASHSCOPE_API_KEY` | DashScope API Key，不要提交真实值 |
| `TEXT_MODEL` | 文本模型，例如 `qwen3.6-flash` |
| `VISION_MODEL` | 视觉模型，例如 `qwen-vl-plus` |

### frontend/.env.local

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 后端 API 地址，默认 `http://localhost:8000` |

---

## 核心功能说明

### Dashboard

- 展示真实后端统计。
- 展示今日热量、蛋白质、最近记录和 AI 建议。
- 读取 `Profile`、`food_logs`、`daily_logs` 和 `workout_plans`。

### Profile

- 用户建档。
- 记录身高、体重、目标、训练水平、每周训练天数和饮食偏好。
- 前端用 `localStorage` 保存 Demo 当前用户 `currentUserId`。

### Food Analyzer

- 支持文本饮食分析。
- 支持图片上传识别食物。
- 用户确认后保存到 `food_logs`。
- 图片识别热量仅为估算，建议用户确认份量后保存。

### Meal Planner

- 输入现有食材。
- 生成减脂餐方案。
- 输出热量、蛋白质、制作步骤和推荐理由。

### Workout Plan

- 生成一周训练计划。
- 根据用户 Profile 个性化生成训练重点、动作和注意事项。

### Daily Check-in

- 记录体重、心情、是否训练、睡眠小时和每日总结。
- 用于 Dashboard 统计、AI Coach 上下文和周总结。

### AI Coach

- 读取 Profile、最近饮食、每日打卡和训练计划。
- 进行个性化问答。
- 基于最近 7 天记录生成本周总结和下周建议。

---

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/profile` | 创建用户 Profile |
| GET | `/profile/{user_id}` | 读取用户 Profile |
| POST | `/food/text-analyze` | 文本饮食分析 |
| POST | `/food/image-analyze` | 图片食物识别 |
| POST | `/food/logs` | 保存饮食记录 |
| GET | `/food/logs/{user_id}` | 读取饮食记录 |
| POST | `/meal/plan` | 生成减脂餐推荐 |
| POST | `/workout/plan` | 生成健身计划 |
| GET | `/workout/plan/{user_id}` | 读取训练计划 |
| POST | `/daily/logs` | 保存每日打卡 |
| GET | `/daily/logs/{user_id}` | 读取每日打卡 |
| GET | `/dashboard/{user_id}` | Dashboard 真实统计 |
| POST | `/agent/chat` | AI Coach 对话 |
| POST | `/agent/week-report` | 生成周总结 |

说明：

- 所有 `/mock` 接口仍可用于 fallback 测试。
- Swagger UI: `http://localhost:8000/docs`

---

## 测试命令

健康检查：

```bash
curl http://localhost:8000/health
```

文字饮食分析：

```bash
curl -X POST http://localhost:8000/food/text-analyze \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"text":"两个鸡蛋，一碗米饭"}'
```

图片识别：

```bash
curl -X POST http://localhost:8000/food/image-analyze \
  -F "user_id=1" \
  -F "image=@/path/to/food.jpg"
```

前端检查：

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

后端测试：

```bash
cd backend
source .venv/bin/activate
python -m unittest tests/test_ai_service.py -v
```

---

## 项目阶段

- **Phase 1**：工程骨架与 mock 功能。
- **Phase 1.5**：用户状态与接口边界修正。
- **Phase 2**：接入 Qwen 文本模型。
- **Phase 3**：接入 Qwen-VL 图片识别。
- **Phase 4**：Agent Memory、Dashboard 统计、每日打卡、周总结。

---

## 作品集价值

FitAgent 不是商业化成熟产品，而是一个完整的 AI Agent 产品原型。它体现了以下能力：

- **AI 产品原型设计能力**：从用户建档、记录、反馈到复盘，形成完整用户路径。
- **多模态模型接入能力**：同时接入文本模型和视觉模型，覆盖文字与图片输入。
- **Agent 上下文设计能力**：AI Coach 会读取用户历史记录，而不是只做单轮问答。
- **前后端分离 Demo 开发能力**：使用 Next.js + FastAPI + SQLite 快速构建可运行 Demo。
- **长期记录与个性化建议设计能力**：通过饮食记录、每日打卡和训练计划形成持续反馈。

---

## 安全与限制

- 不要提交 `backend/.env`。
- 不要提交 `frontend/.env.local`。
- 不要提交 `backend/fitagent.db`。
- 不要提交 `frontend/node_modules/` 或 `backend/.venv/`。
- 不要把真实 API Key 写入 README、前端代码、后端日志或提交记录。
- 所有热量和训练建议仅供健康管理参考。
- FitAgent 不提供医疗诊断、治疗建议或处方级建议。

---

## License

License: 仅用于学习与作品集展示，后续可补充正式 LICENSE。
