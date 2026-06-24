请基于你刚才的代码审查结果，执行 Phase 1.5 小修补。

目标：
 在进入 Phase 2 接入 DashScope Qwen 文本模型前，先修复当前 Phase 1 中影响后续开发的结构问题。

请严格限制修改范围，不要重写项目，不要大规模重构，不要接入真实 Qwen API，不要实现 Phase 2。

# **需要修复的问题**

## **1. 修复用户状态不一致问题**

当前问题：
 前端多个页面硬编码 DEFAULT_USER_ID = 1，但 Profile 每次 POST /profile 都会新建用户，导致用户状态混乱。

请改成：

1. Profile 提交成功后，把后端返回的 user_id 保存到前端统一状态。
2. 可以先使用 localStorage 保存 currentUserId。
3. 所有页面不要再直接硬编码 DEFAULT_USER_ID = 1。
4. Dashboard、Food、Meal、Workout、Coach 都应从统一方法读取 currentUserId。
5. 如果 currentUserId 不存在：
   - 页面提示用户先去 Profile 建档；
   - 或使用清晰的空状态提示；
   - 不要静默使用 1。
6. 在 frontend/lib 或合适位置封装：
   - getCurrentUserId()
   - setCurrentUserId()
   - clearCurrentUserId()
7. 前端页面显示当前 user_id，方便调试。

注意：
 不需要做登录注册。
 只需要 Demo 级用户状态管理。

## **2. 拆分 Meal Planner 后端接口**

当前问题：
 Meal Planner 页面调用 /agent/chat/mock，前端硬编码 mock 餐单，不利于 Phase 2 接入 Qwen。

请新增独立后端路由，例如：

POST /meal/plan/mock

输入：

{
 “user_id”: 1,
 “ingredients”: “鸡蛋、鸡胸肉、西红柿”,
 “preference”: “高蛋白、低脂”
 }

返回：

{
 “meals”: [
 {
 “name”: “番茄鸡胸肉炒蛋”,
 “calories”: 420,
 “protein”: 38,
 “difficulty”: “easy”,
 “steps”: [”…”],
 “reason”: “高蛋白、低脂，适合减脂期晚餐”
 }
 ],
 “suggestion”: “Phase 1.5 mock result. Qwen will be connected later.”
 }

要求：

1. 后端新增 meal router。
2. main.py 注册 meal router。
3. 前端 Meal 页面改为调用 /meal/plan/mock。
4. 不要再用 /agent/chat/mock 生成 meal plan。
5. 结果仍然是 mock，不调用真实 AI。

## **3. README 修正**

请修正 README 中不一致的信息：

1. Next.js 版本描述应和 package.json 一致。
2. 补充说明：
   - 当前前端默认端口是 3000。
   - 后端 CORS 当前允许 http://localhost:3000。
   - 如果前端运行到 3001，需要修改 backend/app/main.py 中 CORS 配置。
3. 补充 Phase 1.5 已修复内容。

## **4. Git 边界提醒**

当前根目录不是 git 仓库，只有 frontend/ 内有 .git。

请不要自动初始化 git，不要删除 frontend/.git。

只需要在 README 或最终总结里提醒：
 建议后续把 fitagent 根目录作为统一仓库管理，以便同时追踪 frontend 和 backend。

# **验收标准**

完成后请确保：

1. 后端能启动。
2. 前端能启动。
3. Profile 提交后能保存 currentUserId。
4. Dashboard/Food/Meal/Workout/Coach 使用同一个 currentUserId。
5. 没有 currentUserId 时有明确提示。
6. Meal 页面调用新的 /meal/plan/mock 接口。
7. /agent/chat/mock 仍保留给 Coach 使用。
8. README 已修正。
9. 不接入真实 Qwen API。
10. 不出现真实 API Key。
11. TypeScript 检查通过。
12. 后端核心接口 smoke test 通过。

完成后请输出：

1. 修改了哪些文件
2. 如何手动验证
3. 是否还有阻塞 Phase 2 的问题
4. 不要继续执行 Phase 2