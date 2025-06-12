from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Payment, User, PaymentStatus
from schemas import PaymentCreate, PaymentResponse, MessageResponse
from auth import get_current_active_user
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[PaymentResponse])
async def get_user_payments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户支付记录"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return payments

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建支付订单"""
    # 验证支付金额
    if payment_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付金额必须大于0"
        )
    
    # 验证积分数量
    if payment_data.credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="积分数量必须大于0"
        )
    
    # 生成交易ID
    transaction_id = f"PAY_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8].upper()}"
    
    # 创建支付记录
    payment = Payment(
        user_id=current_user.id,
        amount=payment_data.amount,
        credits=payment_data.credits,
        payment_method=payment_data.payment_method,
        transaction_id=transaction_id,
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment

@router.post("/confirm/{payment_id}", response_model=MessageResponse)
async def confirm_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """确认支付（模拟支付成功）"""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="支付记录不存在"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付状态不正确"
        )
    
    # 更新支付状态
    payment.status = PaymentStatus.SUCCESS
    payment.completed_at = datetime.utcnow()
    
    # 增加用户积分
    current_user.credits += payment.credits
    
    db.commit()
    
    return {
        "message": f"支付成功！获得 {payment.credits} 积分，当前积分: {current_user.credits}"
    }

@router.get("/packages", response_model=List[dict])
async def get_credit_packages():
    """获取积分充值套餐"""
    packages = [
        {
            "id": 1,
            "name": "基础套餐",
            "credits": 100,
            "amount": 10.0,
            "description": "适合轻度使用",
            "bonus": 0
        },
        {
            "id": 2,
            "name": "标准套餐",
            "credits": 500,
            "amount": 45.0,
            "description": "最受欢迎的选择",
            "bonus": 50
        },
        {
            "id": 3,
            "name": "高级套餐",
            "credits": 1000,
            "amount": 80.0,
            "description": "适合重度使用",
            "bonus": 200
        },
        {
            "id": 4,
            "name": "企业套餐",
            "credits": 5000,
            "amount": 350.0,
            "description": "企业级服务",
            "bonus": 1500
        }
    ]
    
    return packages

@router.post("/package/{package_id}", response_model=PaymentResponse)
async def purchase_credit_package(
    package_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """购买积分套餐"""
    # 获取套餐信息
    packages = {
        1: {"credits": 100, "amount": 10.0, "bonus": 0},
        2: {"credits": 500, "amount": 45.0, "bonus": 50},
        3: {"credits": 1000, "amount": 80.0, "bonus": 200},
        4: {"credits": 5000, "amount": 350.0, "bonus": 1500}
    }
    
    if package_id not in packages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="套餐不存在"
        )
    
    package = packages[package_id]
    total_credits = package["credits"] + package["bonus"]
    
    # 创建支付记录
    payment_data = PaymentCreate(
        amount=package["amount"],
        credits=total_credits,
        payment_method="package"
    )
    
    # 生成交易ID
    transaction_id = f"PKG_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8].upper()}"
    
    payment = Payment(
        user_id=current_user.id,
        amount=payment_data.amount,
        credits=payment_data.credits,
        payment_method=payment_data.payment_method,
        transaction_id=transaction_id,
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment