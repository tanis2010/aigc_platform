from celery import Celery
from config import settings

# 创建Celery应用
celery = Celery(
    "aigc_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "tasks.image_age_transform",
    ]
)

# Celery配置
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30分钟超时
    task_soft_time_limit=25 * 60,  # 25分钟软超时
    worker_prefetch_multiplier=1,  # 每次只处理一个任务
    worker_max_tasks_per_child=1000,
)