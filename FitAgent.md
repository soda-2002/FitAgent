# **FitAgent**

请先阅读下面的 FitAgent PRD，理解项目定位、技术架构、功能边界。

注意：
1. 现在不要创建文件，不要修改代码，不要执行任何开发操作。
2. 不需要制定开发计划，后续每个 Phase 我会单独提供明确开发 Prompt。
3. 只需要输出：
   - 你对项目目标的理解
   - 推荐技术栈是否合理
   - 当前 PRD 是否存在明显技术风险
   - 是否有需要提前确认的问题

项目原则：
- 严格按照后续 Phase Prompt 开发
- 不主动新增功能
- 不改变技术路线

技术路线：
Frontend：
Next.js + Tailwind

Backend：
FastAPI

Database：
SQLite

AI：
DashScope Qwen
DashScope Qwen-VL

注意：
后续会接入 Qwen-VL 图片识别。
因此工程设计需要考虑：
- 图片上传
- 多模态接口
- AI JSON 输出
- 用户确认后保存

但没有明确 Phase 指令前不要实现。



------

# **FitAgent PRD v1.0**

## **基于多模态识别与长期记录的 AI 私人减脂教练 Agent**

## **1. 项目背景**

传统健身 App 需要用户手动查询热量、制定训练计划，使用成本较高。

FitAgent 希望通过大模型能力，构建一个 AI 私人健康助理：

- 理解用户个人目标
- 识别每日饮食
- 根据现有食材推荐方案
- 制定训练计划
- 根据长期记录动态调整建议

项目定位为 AI Agent Demo，重点展示：

- 多模态理解能力
- 个性化推荐能力
- 用户长期记忆能力
- AI 工具化任务处理流程

------

# **2. 用户场景**

目标用户：

希望减脂、健身，但是缺少专业指导的普通用户。

核心问题：

### **场景1：不知道吃了多少热量**

用户：

拍摄今天午餐照片

AI：

识别食物 → 估算营养 → 给减脂建议 → 保存记录

------

### **场景2：不知道怎么做减脂餐**

用户：

家里只有鸡蛋、鸡胸肉、西红柿

AI：

生成：

- 推荐菜品
- 制作步骤
- 热量
- 蛋白质
- 是否符合目标

------

### **场景3：不知道怎么训练**

用户：

输入：

- 身高
- 体重
- 目标
- 每周训练次数
- 健身条件

AI：

生成：

- 周训练计划
- 每日动作
- 组数次数
- 注意事项

------

### **场景4：需要长期调整**

用户：

最近三天没有运动，而且吃超了

Agent：

读取：

- 用户目标
- 饮食记录
- 训练记录

输出调整建议。

------

# **3. 技术架构**

## **Frontend**

技术：

React / Next.js
 Tailwind CSS

负责：

- 页面展示
- 图片上传
- 用户输入
- Dashboard

页面：

```
frontend/

Dashboard
FoodAnalyzer
MealPlanner
WorkoutPlan
AI Coach Chat
Profile
```

------

## **Backend**

技术：

FastAPI

职责：

- API 服务
- 调用 Qwen
- 调用 Qwen-VL
- 数据处理
- 用户记录管理

接口：

```
backend/

api/
 ├── user
 ├── food
 ├── workout
 └── agent
```

------

## **LLM**

模型：

DashScope Qwen

能力：

### **文本模型：**

负责：

- 饮食分析
- 菜谱生成
- 健身计划
- 总结反馈

### **视觉模型：**

负责：

图片 → 食物识别

流程：

```
用户上传图片

↓

FastAPI

↓

Qwen-VL

↓

结构化 JSON

↓

前端展示

↓

用户确认

↓

数据库保存
```

------

# **4. 数据库设计**

使用：

SQLite

原因：

- Demo 足够
- 无服务器依赖
- 方便展示

------

## **users**

用户信息

字段：

```
id

height

weight

age

goal

target_weight

training_level

diet_preference
```

------

## **food_logs**

饮食记录

字段：

```
id

user_id

food_name

calories

protein

carbs

fat

date
```

------

## **workout_plans**

字段：

```
id

user_id

plan

created_time
```

------

## **daily_logs**

字段：

```
id

user_id

summary

created_time
```

------

# **5. 功能模块**

# **Module 1 用户建档**

优先级：

P0

功能：

首次进入填写：

- 身高
- 当前体重
- 目标体重
- 健身经验
- 每周时间
- 饮食要求

保存用户长期画像。

------

# **Module 2 AI 食物识别**

优先级：

P0

两种输入：

## **图片上传**

用户上传照片

AI 输出：

```
{
food:
鸡胸肉饭,

calories:
550,

protein:
40g,

suggestion:
蛋白质充足，碳水适中
}
```

## **文本输入**

用户：

“两个鸡蛋，一碗米饭”

AI 同样分析。

------

# **Module 3 食材生成减脂餐**

优先级：

P0

输入：

已有食材

输出：

3 个方案：

例如：

方案 A：

鸡胸肉番茄炒蛋

包含：

- 做法
- 时间
- 热量
- 推荐原因

------

# **Module 4 健身计划生成**

优先级：

P0

输入：

用户 Profile

生成：

7 天计划：

例如：

Monday:

胸+三头

动作：

俯卧撑

4组*12次

------

# **Module 5 AI Coach Agent**

优先级：

P1

聊天入口。

不是普通聊天。

Agent 可读取：

tools:

```
get_user_profile()

get_food_history()

get_workout_plan()

save_user_record()
```

回答结合用户状态。

------

# **Module 6 Dashboard**

优先级：

P1

展示：

今日：

- 摄入 kcal
- 蛋白质
- 训练完成

AI 今日建议：

例如：

“今天蛋白质不足，晚餐建议增加30g蛋白”

------

# **Module 7 周总结报告**

优先级：

P2

AI 根据记录生成：

```
本周总结：

平均摄入：
1900 kcal

训练：
完成4/5

问题：
周末热量超标

下周调整：
减少碳水15%
```

------

# **6. 开发阶段**

## **Phase 1 基础工程**

目标：

跑通全链路。

完成：

- Next.js 页面
- FastAPI 服务
- 前后端请求
- SQLite 初始化

验收：

前端按钮调用 FastAPI 返回数据。

------

## **Phase 2 AI 文本能力**

完成：

- Qwen API
- 食物文本分析
- 食谱生成
- 健身计划

验收：

真实调用模型。

------

## **Phase 3 多模态**

完成：

- 图片上传
- Qwen-VL
- 食物识别

验收：

上传食物图片返回分析结果。

------

## **Phase 4 Agent + Memory**

完成：

- 用户记录
- 历史查询
- 个性化回答

验收：

AI 回答依赖历史数据。

------

# **7. 不做范围**

当前 Demo 不做：

❌ 登录注册
 ❌ 手机 App
 ❌ 支付
 ❌ 社区
 ❌ 精准医疗建议
 ❌ 模型训练

------

# **8. 最终作品集定位**

FitAgent：

基于 FastAPI + Qwen 多模态模型构建 AI 健康管理 Agent，实现食物图片识别、个性化饮食规划、训练计划生成以及长期用户记录分析。

核心亮点：

- Qwen-VL 多模态识别
- FastAPI AI 服务架构
- 用户长期 Memory
- Agent Tool 调用
- 个性化 Planning

------

下一步不要直接把这整篇丢 Cursor。

下一步应该是：

**Prompt 1：让 Cursor 初始化工程架构，只做 Phase 1。**

先确保前后端+数据库跑起来。不要让它碰 AI。