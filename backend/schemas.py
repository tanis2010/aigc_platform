from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, TaskStatus, PaymentStatus

# 用户相关模式
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    credits: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

# 认证相关模式
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# 服务标签模式
class ServiceTagBase(BaseModel):
    name: str
    description: Optional[str] = None

class ServiceTagCreate(ServiceTagBase):
    pass

class ServiceTagResponse(ServiceTagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# 服务模式
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost_credits: int
    endpoint: Optional[str] = None

class ServiceCreate(ServiceBase):
    tag_id: int

class ServiceResponse(ServiceBase):
    id: int
    tag_id: int
    is_active: bool
    created_at: datetime
    tag: ServiceTagResponse
    
    class Config:
        from_attributes = True

# 任务模式
class TaskBase(BaseModel):
    service_id: int
    input_data: str

class TaskCreate(TaskBase):
    pass

class TaskResponse(BaseModel):
    id: int
    user_id: int
    service_id: int
    status: TaskStatus
    input_data: str
    output_data: Optional[str] = None
    error_message: Optional[str] = None
    credits_used: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    service: ServiceResponse
    
    class Config:
        from_attributes = True

# 图片年龄变换服务专用模式
class ImageAgeTransformRequest(BaseModel):
    target_age: int  # 5 或 70
    
class ImageAgeTransformResponse(BaseModel):
    task_id: int
    message: str

# 支付模式
class PaymentBase(BaseModel):
    amount: float
    credits: int
    payment_method: str

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    user_id: int
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# 通用响应模式
class MessageResponse(BaseModel):
    message: str

class ListResponse(BaseModel):
    items: List
    total: int
    page: int
    size: int