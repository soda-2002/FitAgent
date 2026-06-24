现在开始执行 FitAgent Phase 2：接入 DashScope Qwen 文本模型。

请严格限制范围：本阶段只接入文本模型，不接入 Qwen-VL 图片识别，不做大规模重构，不做登录注册，不重写项目。

# **当前项目状态**

Phase 1 和 Phase 1.5 已完成：

- Next.js + TypeScript + Tailwind 前端
- FastAPI 后端
- SQLite 数据库
- 用户 Profile
- currentUserId localStorage 管理
- Food 文本分析 mock
- Food 图片分析 mock
- Meal Planner mock 独立接口
- Workout Plan mock
- AI Coach mock
- README 已更新

# **Phase 2 目标**

将以下 mock 文本能力替换为真实 DashScope Qwen 文本模型调用：

1. 文本饮食热量估算
2. 食材减脂餐推荐
3. 健身计划生成
4. AI Coach 文本问答

注意：图片上传识别仍然保持 mock，Qwen-VL 放到 Phase 3。

# **当前模型配置**

我已经在 backend/.env 中配置好了：

TEXT_MODEL=Qwen3.6-Flash
 VISION_MODEL=qwen-vl-plus

请注意：

1. Phase 2 只使用 TEXT_MODEL。
2. VISION_MODEL 只保留配置，不要在 Phase 2 调用。
3. 不要在代码里写死模型名。
4. 所有模型名称必须从环境变量读取。
5. 如果 TEXT_MODEL 调用失败，请在错误日志中明确显示当前使用的 TEXT_MODEL，方便排查模型名或权限问题。
6. 不要修改我现有的真实 API Key。
7. 不要把真实 API Key 写入 README、前端代码、日志输出或提交内容。

# **环境变量要求**

后端从环境变量读取：

- DASHSCOPE_API_KEY
- TEXT_MODEL
- VISION_MODEL

.env.example 中请写：

DASHSCOPE_API_KEY=your_api_key_here
 TEXT_MODEL=Qwen3.6-Flash
 VISION_MODEL=qwen-vl-plus

如果当前项目还没有读取 .env 的能力，请使用 python-dotenv 或合适方式加载。

不要提交真实 API Key。

# **模型调用要求**

请在 backend/app/services/ai_service.py 中集中实现 DashScope Qwen 文本调用。

要求：

1. 所有 Qwen 文本调用统一经过 AIService。
2. 不要在 router 里直接写模型调用逻辑。
3. 保留 mock fallback：
   - 如果 DASHSCOPE_API_KEY 不存在，返回清晰 mock 结果；
   - 如果 Qwen 调用失败，返回结构化 fallback；
   - 不要让整个后端崩溃。
4. Qwen 输出尽量要求 JSON。
5. 对 JSON 解析失败要做容错：
   - 尝试提取 JSON；
   - 如果失败，返回结构化 fallback；
   - 前端不能因为模型输出格式不稳定而崩溃。
6. 不要把图片识别接入真实模型，图片识别仍走 /food/image-analyze/mock。

# **需要新增或替换的接口**

## **1. 文本饮食分析**

保留原 mock 接口：

POST /food/text-analyze/mock

新增真实接口：

POST /food/text-analyze

输入：

{
 “user_id”: 1,
 “text”: “两个鸡蛋，一碗米饭”
 }

后端应读取用户 profile，用于个性化判断。

输出格式：

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
 “suggestion”: “这顿蛋白质尚可，但碳水来源偏单一，建议增加蔬菜。”
 }

要求：

- calories/protein/carbs/fat 尽量为数字
- estimated_weight 可以是字符串
- suggestion 用中文
- 明确这是估算，不要声称绝对准确

前端 Food 页面应改为优先调用 /food/text-analyze。
 如果后端提示没有 API Key 或调用失败，可以显示 fallback 信息。

## **2. 食材推荐减脂餐**

保留原 mock 接口：

POST /meal/plan/mock

新增真实接口：

POST /meal/plan

输入：

{
 “user_id”: 1,
 “ingredients”: “鸡蛋、鸡胸肉、西红柿”,
 “preference”: “高蛋白、低脂”
 }

后端应读取用户 profile。

输出格式：

{
 “meals”: [
 {
 “name”: “番茄鸡胸肉炒蛋”,
 “calories”: 420,
 “protein”: 38,
 “difficulty”: “easy”,
 “steps”: [“鸡胸肉切块”, “番茄切块”, “少油翻炒”],
 “reason”: “高蛋白、低脂，适合减脂期晚餐”
 }
 ],
 “suggestion”: “建议搭配一份绿叶菜，提高饱腹感。”
 }

前端 Meal 页面改为调用 /meal/plan。

## **3. 健身计划生成**

保留原 mock 接口：

POST /workout/plan/mock

新增真实接口：

POST /workout/plan

输入：

{
 “user_id”: 1
 }

后端读取用户 profile，生成一周训练计划。

输出格式建议：

{
 “plan”: [
 {
 “day”: “Monday”,
 “focus”: “上肢力量”,
 “duration”: “45分钟”,
 “exercises”: [
 {
 “name”: “俯卧撑”,
 “sets”: 4,
 “reps”: “10-12”,
 “note”: “保持核心收紧”
 }
 ]
 }
 ],
 “summary”: “本计划适合初级减脂用户，以力量训练和轻有氧结合为主。”
 }

要求：

- 同时保存到 workout_plans 表
- GET /workout/plan/{user_id} 能读取最近一次计划

前端 Workout 页面改为调用 /workout/plan。

## **4. AI Coach Chat**

保留原 mock 接口：

POST /agent/chat/mock

新增真实接口：

POST /agent/chat

输入：

{
 “user_id”: 1,
 “message”: “我今天吃多了怎么办？”
 }

后端应读取：

- user profile
- 最近 food logs
- 最近 workout plan

然后调用 Qwen，给出个性化建议。

输出格式：

{
 “reply”: “今天如果热量超出不多，不需要极端节食。建议晚餐降低油脂和精制碳水，增加蛋白质和蔬菜，明天恢复正常计划即可。”,
 “used_context”: {
 “has_profile”: true,
 “food_logs_count”: 3,
 “has_workout_plan”: true
 }
 }

前端 Coach 页面改为调用 /agent/chat。

# **Prompt 设计要求**

请为不同任务写清楚系统提示词或任务提示词：

1. 食物热量估算：
   - 明确这是非医疗建议
   - 要求估算，不要声称绝对准确
   - 输出 JSON
2. 食材推荐：
   - 面向减脂
   - 优先高蛋白、低油、简单易做
   - 输出 JSON
3. 健身计划：
   - 根据用户基础信息
   - 不给危险动作
   - 初学者要保守
   - 输出 JSON
4. AI Coach：
   - 根据用户数据
   - 不做医疗诊断
   - 给可执行建议
   - 中文回答

# **前端要求**

前端需要：

1. Food 文本分析按钮调用真实 /food/text-analyze。
2. Meal 页面调用真实 /meal/plan。
3. Workout 页面调用真实 /workout/plan。
4. Coach 页面调用真实 /agent/chat。
5. 保留 loading 状态。
6. 保留错误提示。
7. 如果 currentUserId 不存在，继续提示先去 Profile 建档。
8. 不要在前端暴露 DASHSCOPE_API_KEY。
9. 图片上传功能暂时继续调用 /food/image-analyze/mock，不要接视觉模型。

# **README 更新**

请更新 README：

1. 增加 Phase 2 已完成功能。
2. 增加 .env 配置说明。
3. 说明当前文本模型配置为 TEXT_MODEL=Qwen3.6-Flash。
4. 说明视觉模型已预留 VISION_MODEL=qwen-vl-plus，但 Phase 2 暂不调用。
5. 说明如果没有 API Key，系统会返回 mock/fallback。
6. 明确 Phase 3 待办：Qwen-VL 图片识别。

# **验收标准**

完成后请确保：

1. 后端能启动。
2. 前端能启动。
3. 没有真实 API Key 泄露。
4. 不设置 API Key 时，系统不会崩溃。
5. 设置 DASHSCOPE_API_KEY 后：
   - /food/text-analyze 能调用 Qwen 文本模型
   - /meal/plan 能调用 Qwen 文本模型
   - /workout/plan 能调用 Qwen 文本模型
   - /agent/chat 能调用 Qwen 文本模型
6. 图片识别仍然是 mock。
7. TypeScript 检查通过。
8. lint 无 error。
9. 后端核心接口 smoke test 通过。
10. README 更新完整。
11. 错误日志不输出真实 API Key。
12. 如果模型调用失败，日志中可以显示当前 TEXT_MODEL，但不能显示 API Key。

# **完成后请输出**

1. 修改了哪些文件
2. 新增了哪些接口
3. 如何配置 .env
4. 当前实际读取的 TEXT_MODEL 是什么
5. 如何启动和测试
6. 是否真实调用了 Qwen 文本模型
7. 如果没有 API Key，fallback 行为是什么
8. 是否还有阻塞 Phase 3 的问题

不要继续执行 Phase 3。