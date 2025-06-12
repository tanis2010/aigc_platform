# AIGC服务平台

一个提供AI生成内容服务的全栈平台，包含用户系统、积分管理和多种AIGC服务。

## 项目架构

### 前端 (Frontend)
- 技术栈：React + TypeScript + Ant Design
- 功能：用户注册登录、积分充值、服务浏览、任务管理

### 后端 (Backend)
- 技术栈：Python + FastAPI + SQLAlchemy + Redis
- 功能：用户认证、积分管理、任务队列、AIGC服务调用

### 数据库
- 主数据库：PostgreSQL
- 缓存：Redis
- 任务队列：Celery + Redis

## 核心功能

1. **用户系统**
   - 用户注册/登录
   - 个人信息管理
   - 积分充值和消费

2. **服务管理**
   - 服务标签分类
   - 服务检索和浏览
   - 服务调用页面

3. **任务系统**
   - 异步任务队列
   - 任务状态跟踪
   - 历史记录查看

4. **AIGC服务**
   - 图片年龄变换服务（示例）
   - 基于火山引擎API
   - 可扩展的服务架构

## 目录结构

```
aigc_platform/
├── frontend/          # React前端应用
├── backend/           # FastAPI后端应用
├── docker-compose.yml # 容器编排
├── requirements.txt   # Python依赖
└── README.md         # 项目说明
```

## 快速开始

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 前端启动
```bash
cd frontend
npm install
npm start
```

## 环境变量配置

创建 `.env` 文件配置以下变量：
- DATABASE_URL
- REDIS_URL
- VOLC_ACCESS_KEY
- VOLC_SECRET_KEY
- JWT_SECRET_KEY