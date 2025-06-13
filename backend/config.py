import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 数据库配置
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/aigc_platform")
    
    # Redis配置
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # JWT配置
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    
    # 火山引擎配置
    volc_access_key: Optional[str] = os.getenv("VOLC_ACCESS_KEY")
    volc_secret_key: Optional[str] = os.getenv("VOLC_SECRET_KEY")
    volc_region: str = os.getenv("VOLC_REGION", "cn-north-1")
    
    # 文件上传配置
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # 任务队列配置 - 使用环境变量，fallback到localhost
    celery_broker_url: str = os.getenv("REDIS_URL", "redis://localhost:6379") + "/0"
    celery_result_backend: str = os.getenv("REDIS_URL", "redis://localhost:6379") + "/0"
    
    # 积分配置
    default_credits: int = 100  # 新用户默认积分
    image_age_transform_cost: int = 10  # 图片年龄变换服务消耗积分
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()