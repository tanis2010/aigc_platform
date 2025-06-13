from sqlalchemy.orm import sessionmaker
from database import engine
from models import Base, ServiceTag, Service, User
from auth import get_password_hash
from config import settings

# 创建数据库会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_database():
    """初始化数据库"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 创建服务标签
        tags_data = [
            {"name": "图像处理", "description": "各种图像处理和编辑服务"},
            {"name": "文本生成", "description": "AI文本生成和编辑服务"},
            {"name": "语音处理", "description": "语音识别和合成服务"},
            {"name": "视频处理", "description": "视频编辑和生成服务"},
        ]
        
        for tag_data in tags_data:
            existing_tag = db.query(ServiceTag).filter(ServiceTag.name == tag_data["name"]).first()
            if not existing_tag:
                tag = ServiceTag(**tag_data)
                db.add(tag)
        
        db.commit()
        
        # 获取图像处理标签
        image_tag = db.query(ServiceTag).filter(ServiceTag.name == "图像处理").first()
        
        # 创建服务
        services_data = [
            {
                "name": "图片年龄变换",
                "description": "将人脸图片变换为指定年龄（5岁或70岁）",
                "tag_id": image_tag.id,
                "cost_credits": settings.image_age_transform_cost,
                "endpoint": "/api/tasks/image-age-transform"
            },
            {
                "name": "发型编辑",
                "description": "支持对人像的发型进行加刘海、变长发、增发量等操作。目前发型编辑主要支持单人照，发质&发量中部分能力为轻度调节，效果不显著。",
                "tag_id": image_tag.id,
                "cost_credits": settings.hari_style_cost,
                "endpoint": "/api/tasks/hair_style"
            },
        ]
        
        for service_data in services_data:
            existing_service = db.query(Service).filter(Service.name == service_data["name"]).first()
            if not existing_service:
                service = Service(**service_data)
                db.add(service)
        
        db.commit()
        
        # 创建管理员用户
        admin_username = "admin"
        existing_admin = db.query(User).filter(User.username == admin_username).first()
        if not existing_admin:
            admin_user = User(
                username=admin_username,
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                credits=10000
            )
            db.add(admin_user)
            db.commit()
            print(f"管理员用户已创建: {admin_username} / admin123")
        
        # 创建测试用户
        test_username = "testuser"
        existing_test = db.query(User).filter(User.username == test_username).first()
        if not existing_test:
            test_user = User(
                username=test_username,
                email="test@example.com",
                hashed_password=get_password_hash("test123"),
                credits=settings.default_credits
            )
            db.add(test_user)
            db.commit()
            print(f"测试用户已创建: {test_username} / test123")
        
        print("数据库初始化完成！")
        
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()