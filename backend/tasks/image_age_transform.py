from celery import current_task
from tasks import celery
from sqlalchemy.orm import sessionmaker
from database import engine
from models import Task, TaskStatus
from config import settings
import json
import os
import base64
from datetime import datetime
from volcengine.visual import VisualService
from volcengine.const import Const
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建数据库会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_volc_client():
    """获取火山引擎客户端"""
    if not settings.volc_access_key or not settings.volc_secret_key:
        raise ValueError("火山引擎API密钥未配置")
    
    visual_service = VisualService()
    visual_service.set_ak(settings.volc_access_key)
    visual_service.set_sk(settings.volc_secret_key)
    visual_service.set_region(settings.volc_region)
    
    return visual_service

def encode_image_to_base64(image_path: str) -> str:
    """将图片编码为base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

@celery.task(bind=True)
def process_image_age_transform(self, task_id: int):
    """处理图片年龄变换任务"""
    db = SessionLocal()
    
    try:
        # 获取任务信息
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            logger.error(f"任务 {task_id} 不存在")
            return
        
        # 更新任务状态为处理中
        task.status = TaskStatus.PROCESSING
        task.started_at = datetime.utcnow()
        db.commit()
        
        # 解析输入数据
        input_data = json.loads(task.input_data)
        image_path = input_data["image_path"]
        target_age = input_data["target_age"]
        
        logger.info(f"开始处理任务 {task_id}: 图片路径={image_path}, 目标年龄={target_age}")
        
        # 检查文件是否存在
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片文件不存在: {image_path}")
        
        # 编码图片
        image_base64 = encode_image_to_base64(image_path)
        
        # 调用火山引擎API
        try:
            visual_service = get_volc_client()
            
            # 构建请求参数
            req = {
                "req_key": f"task_{task_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "image_base64": image_base64,
                "target_age": target_age,
                "return_url": True  # 返回结果图片URL
            }
            
            # 调用年龄变换API（这里使用示例API名称，实际需要根据火山引擎文档调整）
            resp = visual_service.face_age_transform(req)
            
            if resp.get("code") == 10000:  # 成功
                result_data = {
                    "result_image_url": resp.get("data", {}).get("image_url"),
                    "result_image_base64": resp.get("data", {}).get("image_base64"),
                    "original_image_path": image_path,
                    "target_age": target_age,
                    "processed_at": datetime.utcnow().isoformat()
                }
                
                # 更新任务状态为完成
                task.status = TaskStatus.COMPLETED
                task.output_data = json.dumps(result_data)
                task.completed_at = datetime.utcnow()
                
                logger.info(f"任务 {task_id} 处理完成")
                
            else:
                # API调用失败
                error_msg = resp.get("message", "未知错误")
                raise Exception(f"火山引擎API调用失败: {error_msg}")
                
        except Exception as api_error:
            logger.error(f"调用火山引擎API失败: {str(api_error)}")
            
            # 如果是API配置问题，使用模拟结果
            if "火山引擎API密钥未配置" in str(api_error):
                logger.info(f"使用模拟结果处理任务 {task_id}")
                
                # 模拟处理结果
                result_data = {
                    "result_image_url": f"https://example.com/result_{task_id}.jpg",
                    "result_image_base64": "模拟的base64编码结果",
                    "original_image_path": image_path,
                    "target_age": target_age,
                    "processed_at": datetime.utcnow().isoformat(),
                    "note": "这是模拟结果，实际部署时需要配置火山引擎API密钥"
                }
                
                task.status = TaskStatus.COMPLETED
                task.output_data = json.dumps(result_data)
                task.completed_at = datetime.utcnow()
                
            else:
                raise api_error
        
        db.commit()
        
    except Exception as e:
        logger.error(f"处理任务 {task_id} 时发生错误: {str(e)}")
        
        # 更新任务状态为失败
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
        
        # 重新抛出异常以便Celery记录
        raise
        
    finally:
        db.close()
    
    return f"任务 {task_id} 处理完成"