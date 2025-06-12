from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserResponse, UserUpdate, MessageResponse
from auth import get_current_active_user, get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    # 更新邮箱
    if user_update.email:
        # 检查邮箱是否已被其他用户使用
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被其他用户使用"
            )
        current_user.email = user_update.email
    
    # 更新密码
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/credits", response_model=dict)
async def get_user_credits(current_user: User = Depends(get_current_active_user)):
    """获取用户积分"""
    return {"credits": current_user.credits}

@router.post("/credits/add", response_model=MessageResponse)
async def add_credits(
    credits: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """添加积分（管理员功能或测试用）"""
    if credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="积分数量必须大于0"
        )
    
    current_user.credits += credits
    db.commit()
    
    return {"message": f"成功添加 {credits} 积分，当前积分: {current_user.credits}"}