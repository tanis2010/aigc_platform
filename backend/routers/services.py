from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
from models import Service, ServiceTag, User
from schemas import ServiceResponse, ServiceTagResponse, ServiceCreate, ServiceTagCreate
from auth import get_current_active_user

router = APIRouter()

# 服务标签相关路由
@router.get("/tags", response_model=List[ServiceTagResponse])
async def get_service_tags(db: Session = Depends(get_db)):
    """获取所有服务标签"""
    tags = db.query(ServiceTag).all()
    return tags

@router.post("/tags", response_model=ServiceTagResponse)
async def create_service_tag(
    tag_data: ServiceTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建服务标签（管理员功能）"""
    # 检查标签名是否已存在
    if db.query(ServiceTag).filter(ServiceTag.name == tag_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签名已存在"
        )
    
    db_tag = ServiceTag(**tag_data.dict())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag

# 服务相关路由
@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    tag_id: Optional[int] = Query(None, description="按标签ID筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    active_only: bool = Query(True, description="只显示活跃服务"),
    db: Session = Depends(get_db)
):
    """获取服务列表"""
    query = db.query(Service)
    
    # 按标签筛选
    if tag_id:
        query = query.filter(Service.tag_id == tag_id)
    
    # 按关键词搜索
    if search:
        query = query.filter(
            or_(
                Service.name.ilike(f"%{search}%"),
                Service.description.ilike(f"%{search}%")
            )
        )
    
    # 只显示活跃服务
    if active_only:
        query = query.filter(Service.is_active == True)
    
    services = query.all()
    return services

@router.get("/image-age-transform", response_model=ServiceResponse)
async def get_image_age_transform_service(db: Session = Depends(get_db)):
    """获取图片年龄变换服务信息"""
    service = db.query(Service).filter(Service.name == "图片年龄变换").first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )
    return service

@router.get("/popular", response_model=List[ServiceResponse])
async def get_popular_services(
    limit: int = Query(10, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """获取热门服务（按使用次数排序）"""
    # 这里可以根据任务数量来排序，暂时返回前N个活跃服务
    services = db.query(Service).filter(Service.is_active == True).limit(limit).all()
    return services

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新服务（管理员功能）"""
    # 检查标签是否存在
    tag = db.query(ServiceTag).filter(ServiceTag.id == service_data.tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务标签不存在"
        )
    
    db_service = Service(**service_data.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    return db_service

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    """获取单个服务详情"""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )
    return service