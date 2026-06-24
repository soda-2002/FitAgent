**Prompt 1：让 Cursor 只做 Phase 1 工程骨架**

你现在开始执行 FitAgent 的 Phase 1。

请严格按照以下要求开发，不要扩展功能，不要接入真实 Qwen API，不要实现真实 AI 分析。

# **项目目标**

FitAgent 是一个 AI 私人减脂教练 Agent Demo。

最终会支持：

1. 用户建档
2. 文本饮食热量估算
3. 图片上传识别食物
4. 食材推荐减脂餐
5. 健身计划生成
6. 每日记录
7. Dashboard 展示
8. AI Coach 根据用户记录给建议

但 Phase 1 只做工程骨架和基础数据链路。

# **Phase 1 目标**

完成一个可运行的基础项目：

- Frontend：Next.js + TypeScript + Tailwind
- Backend：FastAPI
- Database：SQLite
- 前后端能正常通信
- 数据库能初始化
- 页面布局基本可用
- 预留图片上传入口和后端接口，但不接入真实视觉模型

# **重要限制**

1. 不要接入 Qwen API。
2. 不要接入 Qwen-VL。
3. 不要写死任何模型名称。
4. 不要实现登录注册。
5. 不要引入复杂权限系统。
6. 不要做真实营养数据库。
7. 不要过度设计 UI。
8. 不要删除已有文件，除非明确说明原因并获得确认。
9. 所有代码要保证本地可以运行。
10. 给出清晰启动命令和测试步骤。

# **推荐目录结构**

请尽量按这个结构创建：

fitagent/
 ├── frontend/
 │  ├── app/
 │  ├── components/
 │  ├── lib/
 │  ├── types/
 │  ├── package.json
 │  └── …
 │
 ├── backend/
 │  ├── app/
 │  │  ├── main.py
 │  │  ├── database.py
 │  │  ├── models.py
 │  │  ├── schemas.py
 │  │  ├── routers/
 │  │  │  ├── health.py
 │  │  │  ├── profile.py
 │  │  │  ├── food.py
 │  │  │  ├── workout.py
 │  │  │  └── agent.py
 │  │  └── services/
 │  │    └── ai_service.py
 │  ├── requirements.txt
 │  ├── .env.example
 │  └── …
 │
 └── README.md

# **Backend 要求**

使用 FastAPI。

至少实现以下接口：

## **1. 健康检查**

GET /health

返回：

{
 “status”: “ok”,
 “message”: “FitAgent backend is running”
 }

## **2. 用户建档接口**

POST /profile

保存用户基础信息：

- height
- weight
- age
- gender
- goal
- target_weight
- training_level
- weekly_training_days
- diet_preference

GET /profile/{user_id}

读取用户信息。

## **3. 饮食记录接口**

POST /food/text-analyze/mock

Phase 1 只返回 mock 数据，不调用 AI。

输入：

{
 “user_id”: 1,
 “text”: “两个鸡蛋，一碗米饭”
 }

返回 mock：

{
 “foods”: [
 {
 “name”: “鸡蛋”,
 “estimated_weight”: “100g”,
 “calories”: 140,
 “protein”: 12,
 “carbs”: 1,
 “fat”: 10
 }
 ],
 “total_calories”: 140,
 “suggestion”: “Phase 1 mock result. AI will be connected later.”
 }

## **4. 图片上传接口预留**

POST /food/image-analyze/mock

要求：

- 支持 multipart/form-data 上传图片
- 接收 image file 和 user_id
- 暂时不调用 Qwen-VL
- 返回 mock 识别结果
- 保存图片可以先不做，或者保存到本地 uploads/，但要简单说明

返回 mock：

{
 “foods”: [
 {
 “name”: “鸡胸肉饭”,
 “estimated_weight”: “350g”,
 “calories”: 520,
 “protein”: 38,
 “carbs”: 55,
 “fat”: 12
 }
 ],
 “total_calories”: 520,
 “confidence”: “mock”,
 “suggestion”: “Phase 1 mock image analysis. Qwen-VL will be connected later.”
 }

## **5. 饮食记录保存接口**

POST /food/logs

保存用户确认后的饮食记录。

GET /food/logs/{user_id}

读取用户饮食记录。

## **6. 健身计划接口**

POST /workout/plan/mock

Phase 1 返回 mock 计划，不调用 AI。

GET /workout/plan/{user_id}

读取计划。

## **7. AI Coach 接口预留**

POST /agent/chat/mock

Phase 1 返回 mock 回复，不调用 AI。

# **Database 要求**

使用 SQLite。

可以使用 SQLAlchemy。

至少建立以下表：

## **users**

- id
- height
- weight
- age
- gender
- goal
- target_weight
- training_level
- weekly_training_days
- diet_preference
- created_at

## **food_logs**

- id
- user_id
- food_name
- estimated_weight
- calories
- protein
- carbs
- fat
- date
- source
- created_at

source 可取：

- text
- image
- manual

## **workout_plans**

- id
- user_id
- plan_json
- created_at

## **daily_logs**

- id
- user_id
- summary
- created_at

# **AI Service 预留要求**

在 backend/app/services/ai_service.py 中预留 AIService 类。

Phase 1 不调用真实模型，但要预留结构：

- call_text_model()
- call_vision_model()
- analyze_food_text()
- analyze_food_image()
- generate_meal_plan()
- generate_workout_plan()
- coach_chat()

这些函数 Phase 1 可以返回 mock。

后续 Phase 2 和 Phase 3 会在这里集中接入 DashScope Qwen 和 Qwen-VL。

要求模型名称从环境变量读取，不要写死：

- DASHSCOPE_API_KEY
- TEXT_MODEL
- VISION_MODEL

.env.example 中写：

DASHSCOPE_API_KEY=your_api_key_here
 TEXT_MODEL=qwen-plus
 VISION_MODEL=qwen-vl-plus

# **Frontend 要求**

使用 Next.js + TypeScript + Tailwind。

页面先做基础可用，不追求复杂视觉。

至少包含以下页面或模块：

## **1. Dashboard**

展示：

- 项目名 FitAgent
- 当前用户基础信息
- 今日热量 mock
- 今日蛋白质 mock
- 今日建议 mock
- 后端连接状态

页面加载时调用 GET /health，显示后端是否连接成功。

## **2. Profile 页面或卡片**

表单字段：

- 身高
- 体重
- 年龄
- 性别
- 减脂目标
- 目标体重
- 训练水平
- 每周训练天数
- 饮食偏好

提交后调用 POST /profile。

## **3. Food Analyzer**

包含两个 Tab 或两个区域：

### **文本输入**

用户输入：

“两个鸡蛋，一碗米饭”

点击分析，调用：

POST /food/text-analyze/mock

展示 mock 结果。

### **图片上传**

用户选择图片。

前端显示图片预览。

点击分析，调用：

POST /food/image-analyze/mock

展示 mock 结果。

注意：

Phase 1 不接真实 Qwen-VL，但必须把上传链路跑通。

## **4. Meal Planner 占位**

先做基础输入框：

“输入现有食材”

点击按钮后显示 mock 推荐。

## **5. Workout Plan 占位**

点击按钮后调用：

POST /workout/plan/mock

展示 mock 一周计划。

## **6. AI Coach Chat 占位**

输入问题，调用：

POST /agent/chat/mock

展示 mock 回复。

# **前后端通信**

前端需要统一配置 backend base url。

例如：

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

不要把地址散落在各个组件里。

# **README 要求**

请写清楚：

1. 项目简介
2. 技术栈
3. 目录结构
4. 后端启动方式
5. 前端启动方式
6. 如何初始化数据库
7. 如何测试 /health
8. Phase 1 已完成功能
9. Phase 2 待办：接入 Qwen 文本模型
10. Phase 3 待办：接入 Qwen-VL 图片识别

# **验收标准**

Phase 1 完成后必须满足：

1. 后端可以启动。
2. 前端可以启动。
3. 前端 Dashboard 能显示后端连接成功。
4. 用户 Profile 可以提交到后端。
5. 文本饮食分析能返回 mock 结果。
6. 图片上传能预览，且能发送到 FastAPI，返回 mock 图片识别结果。
7. SQLite 数据库文件生成成功。
8. 饮食记录可以保存和读取。
9. README 有完整启动步骤。
10. 代码中没有真实 API Key。

请先执行 Phase 1。完成后请输出：

1. 你创建/修改了哪些文件
2. 如何启动后端
3. 如何启动前端
4. 如何测试每个核心接口
5. 当前完成情况
6. 当前未完成情况
7. 下一阶段建议，但不要直接执行 Phase 2