from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    credits = Column(Integer, default=100)  # 用户积分
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    tasks = relationship("Task", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class ServiceTag(Base):
    __tablename__ = "service_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    services = relationship("Service", back_populates="tag")

class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    tag_id = Column(Integer, ForeignKey("service_tags.id"))
    cost_credits = Column(Integer, nullable=False)  # 服务消耗积分
    is_active = Column(Boolean, default=True)
    endpoint = Column(String(200))  # 服务调用端点
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    tag = relationship("ServiceTag", back_populates="services")
    tasks = relationship("Task", back_populates="service")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    input_data = Column(Text)  # JSON格式的输入数据
    output_data = Column(Text)  # JSON格式的输出数据
    error_message = Column(Text)
    credits_used = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # 关系
    user = relationship("User", back_populates="tasks")
    service = relationship("Service", back_populates="tasks")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)  # 支付金额
    credits = Column(Integer, nullable=False)  # 获得积分
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String(50))  # 支付方式
    transaction_id = Column(String(100))  # 交易ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # 关系
    user = relationship("User", back_populates="payments")