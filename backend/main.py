from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn

from database import get_db, engine
from models import Base
from routers import auth, users, services, tasks, payments
from config import settings

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIGC服务平台API",
    description="提供AI生成内容服务的后端API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(services.router, prefix="/api/services", tags=["服务"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务"])
app.include_router(payments.router, prefix="/api/payments", tags=["支付"])

@app.get("/")
async def root():
    return {"message": "AIGC服务平台API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)