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
from volcengine.visual.VisualService import VisualService
from volcengine.const import Const
import logging
import io
from PIL import Image

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
    print("access_key:" + settings.volc_access_key)
    print("access_key:" + settings.volc_secret_key)
    visual_service.set_ak(settings.volc_access_key)
    visual_service.set_sk(settings.volc_secret_key)    
    
    return visual_service

def process_images_to_base64(files):
    """
    将图片文件处理并转换为base64字符串列表
    :param files: 图片文件路径列表
    :return: base64编码的字符串列表
    """ 
    binary_data_base64 = []
    for file in files:
        # 读取本地图片文件并转换为base64字符串
        with open(file, 'rb') as image_file:
            binary_data = image_file.read()
            # 读取图片并转换为PIL对象
            img = Image.open(image_file)
            # 获取原始尺寸
            width, height = img.size
            # 计算缩放比例
            scale = min(1024/width, 1024/height, 1.0)
            # 计算新的尺寸
            new_width = int(width * scale)
            new_height = int(height * scale)
            # 如果需要缩放，则调整图片大小
            if scale < 1.0:
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                # 将调整后的图片转换为字节流
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format=img.format or 'PNG')
                binary_data = img_byte_arr.getvalue()
            

            # 转换为base64编码
            base64_data = base64.b64encode(binary_data)
            # 转换为字符串
            base64_str = base64_data.decode('utf-8')
            binary_data_base64.append(base64_str)

    return binary_data_base64

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
        
        # 调用火山引擎API
        try:
            visual_service = get_volc_client()
            
            # 使用新的调用方式
            files = [image_path]
            binary_data_base64 = process_images_to_base64(files)
            
            form = {
                "req_key": "all_age_generation",
                "target_age": target_age ,
                "binary_data_base64":binary_data_base64
                }

            resp = visual_service.cv_process(form)
            
            if resp.get("code") == 10000:  # 成功
                # 从响应中获取图片base64数据
                binary_data_base64_result = resp["data"]["binary_data_base64"][0]
                
                # 检查响应是否包含base64数据
                if "base64," in binary_data_base64_result:
                    # 提取base64数据
                    base64_data = binary_data_base64_result.split("base64,")[1]
                    # 解码base64数据
                    image_data = base64.b64decode(base64_data)
                else:
                    # 直接使用响应内容
                    image_data = binary_data_base64_result
                
                # 将字符串解码为二进制数据
                binary_data = base64.b64decode(image_data)
                # 将二进制数据转换为图片
                image = Image.open(io.BytesIO(binary_data))
                
                # 保存图片到输出目录
                output_filename = f"result_{task_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
                output_path = os.path.join("outputs", output_filename)
                
                # 确保输出目录存在
                os.makedirs("outputs", exist_ok=True)
                
                # 保存图片
                image.save(output_path)
                logger.info(f"图片已保存至: {output_path}")
                
                result_data = {
                    "result_image_path": output_path,
                    "result_image_base64": binary_data_base64_result,
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