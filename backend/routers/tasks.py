from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from datetime import datetime
from database import get_db
from models import Task, Service, User, TaskStatus
from schemas import TaskResponse, TaskCreate, ImageAgeTransformRequest, ImageAgeTransformResponse, MessageResponse, HairStyleResponse
from auth import get_current_active_user
from tasks.image_age_transform import process_image_age_transform
from config import settings

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_user_tasks(
    status: Optional[TaskStatus] = Query(None, description="按状态筛选"),
    limit: int = Query(20, description="返回数量限制"),
    offset: int = Query(0, description="偏移量"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户任务列表"""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == status)
    
    tasks = query.order_by(Task.created_at.desc()).offset(offset).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取单个任务详情"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    return task

@router.post("/image-age-transform", response_model=ImageAgeTransformResponse)
async def create_image_age_transform_task(
    target_age: int = Form(..., description="目标年龄：5或70"),
    image: UploadFile = File(..., description="上传的图片文件"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建图片年龄变换任务"""
    # 验证目标年龄
    if target_age not in [5, 70]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="目标年龄只能是5岁或70岁"
        )
    
    # 验证文件类型
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持图片文件"
        )
    
    # 验证文件大小
    if image.size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {settings.max_file_size // (1024*1024)}MB"
        )
    
    # 获取服务信息
    service = db.query(Service).filter(Service.name == "图片年龄变换").first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )
    
    # 检查用户积分
    if current_user.credits < service.cost_credits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="积分不足"
        )
    
    # 保存上传的文件
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_extension = os.path.splitext(image.filename)[1]
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user.id}{file_extension}"
    file_path = os.path.join(settings.upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    # 创建任务
    input_data = {
        "image_path": file_path,
        "target_age": target_age,
        "original_filename": image.filename
    }
    
    task = Task(
        user_id=current_user.id,
        service_id=service.id,
        input_data=json.dumps(input_data),
        credits_used=service.cost_credits
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # 扣除用户积分
    current_user.credits -= service.cost_credits
    db.commit()
    
    # 异步处理任务
    process_image_age_transform.delay(task.id)
    
    return {
        "task_id": task.id,
        "message": "任务已创建，正在处理中..."
    }

@router.post("/hair-style", response_model=HairStyleResponse)
async def create_hair_style_task(
    hair_style: str = Form(..., description="发型类型"),
    add_watermark: bool = Form(..., description="是否添加水印"),
    image: UploadFile = File(..., description="上传的图片文件"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建发型编辑任务"""
    # 验证发型类型
    valid_styles = ["101", "201", "301", "401", "501"]
    if hair_style not in valid_styles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的发型类型"
        )
    
    # 验证文件类型
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持图片文件"
        )
    
    # 验证文件大小
    if image.size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {settings.max_file_size // (1024*1024)}MB"
        )
    
    # 获取服务信息
    service = db.query(Service).filter(Service.name == "发型编辑").first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )
    
    # 检查用户积分
    if current_user.credits < service.cost_credits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="积分不足"
        )
    
    # 保存上传的文件
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_extension = os.path.splitext(image.filename)[1]
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user.id}{file_extension}"
    file_path = os.path.join(settings.upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        content = await image.read()
        buffer.write(content)
    
    # 创建任务
    input_data = {
        "image_path": file_path,
        "hair_style": hair_style,
        "add_watermark": add_watermark,
        "original_filename": image.filename
    }
    
    task = Task(
        user_id=current_user.id,
        service_id=service.id,
        input_data=json.dumps(input_data),
        credits_used=service.cost_credits
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # 扣除用户积分
    current_user.credits -= service.cost_credits
    db.commit()
    
    # TODO: 异步处理任务
    # process_hair_style.delay(task.id)
    
    return {
        "task_id": task.id,
        "message": "任务已创建，正在处理中..."
    }

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建通用任务"""
    # 获取服务信息
    service = db.query(Service).filter(Service.id == task_data.service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )
    
    # 检查用户积分
    if current_user.credits < service.cost_credits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="积分不足"
        )
    
    # 创建任务
    task = Task(
        user_id=current_user.id,
        service_id=service.id,
        input_data=task_data.input_data,
        credits_used=service.cost_credits
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # 扣除用户积分
    current_user.credits -= service.cost_credits
    db.commit()
    
    return task

@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除任务"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    # 只能删除已完成或失败的任务
    if task.status in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无法删除正在处理的任务"
        )
    
    db.delete(task)
    db.commit()
    
    return {"message": "任务已删除"}