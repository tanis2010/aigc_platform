import React, { useState, useCallback } from 'react';
import {
  Card,
  Upload,
  Button,
  Select,
  Typography,
  message,
  Space,
  Alert,
  Image,
  Divider,
  Switch,
} from 'antd';
import {
  InboxOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { tasksService } from '../../services/tasks';
import type { UploadProps } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const HairStyle: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateCredits } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedHairStyle, setSelectedHairStyle] = useState<string>('101');
  const [addWatermark, setAddWatermark] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const serviceCost = 15; // 服务消耗积分

  const handleFileChange = useCallback((info: any) => {
    const { file } = info;
    if (file.status === 'removed') {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    const originFile = file.originFileObj || file;
    if (originFile instanceof File) {
      setSelectedFile(originFile);
      
      // 创建预览URL
      const url = URL.createObjectURL(originFile);
      setPreviewUrl(url);
    }
  }, []);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过10MB！');
      return false;
    }

    return false; // 阻止自动上传
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      message.error('请先上传图片！');
      return;
    }

    if (!user || user.credits < serviceCost) {
      message.error('积分不足，请先充值！');
      return;
    }

    setLoading(true);
    try {
      // 这里需要在tasksService中添加createHairStyleTask方法
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('hair_style', selectedHairStyle);
      formData.append('add_watermark', addWatermark.toString());

      const response = await tasksService.createHairStyleTask(
        selectedFile,
        selectedHairStyle,
        addWatermark
      );
      
      message.success(response.message);
      
      // 更新用户积分
      updateCredits(user.credits - serviceCost);
      
      // 跳转到任务页面
      navigate('/tasks');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '提交任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/services')}
            >
              返回服务中心
            </Button>
          </Space>
          <Title level={2} style={{ margin: '16px 0 0' }}>
            发型编辑
          </Title>
          <Paragraph style={{ margin: '8px 0 0', fontSize: 16 }}>
            上传人像照片，AI将为您生成指定发型的效果
          </Paragraph>
        </div>
      </div>

      <div className="container">
        <Card>
          <Alert
            message="服务说明"
            description={
              <div>
                <p>• 支持JPG、PNG等常见图片格式</p>
                <p>• 图片大小不超过10MB</p>
                <p>• 建议上传清晰的正面人脸照片</p>
                <p>• 消耗积分：{serviceCost} 积分</p>
                <p>• 当前积分：{user?.credits || 0} 积分</p>
              </div>
            }
            type="info"
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>1. 上传图片</Title>
            <Dragger
              name="image"
              multiple={false}
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              showUploadList={false}
              style={{ marginBottom: 16 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个文件上传，严禁上传违法或不当内容
              </p>
            </Dragger>

            {previewUrl && (
              <div style={{ textAlign: 'center' }}>
                <Text strong>预览图片：</Text>
                <div style={{ marginTop: 8 }}>
                  <Image
                    src={previewUrl}
                    alt="预览"
                    style={{ maxWidth: 300, maxHeight: 300 }}
                  />
                </div>
              </div>
            )}
          </div>

          <Divider />

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>2. 选择发型</Title>
            <Select
              value={selectedHairStyle}
              onChange={(value) => setSelectedHairStyle(value)}
              style={{ width: 300 }}
              size="large"
            >
              <Option value="101">刘海（默认）</Option>
              <Option value="201">长发</Option>
              <Option value="301">刘海加长发</Option>
              <Option value="401">中程度增发</Option>
              <Option value="402">轻程度增发</Option>
              <Option value="403">重程度增发</Option>
              <Option value="502">轻程度卷发</Option>
              <Option value="503">重程度卷发</Option>
              <Option value="603">短发</Option>
              <Option value="801">金发</Option>
              <Option value="901">直发</Option>
              <Option value="1001">头发去油</Option>
              <Option value="1101">补发际线</Option>
              <Option value="1201">头发柔顺</Option>
              <Option value="1301">补发缝</Option>
            </Select>
          </div>

          <Divider />

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>3. 水印设置</Title>
            <Space>
              <Switch
                checked={addWatermark}
                onChange={(checked) => setAddWatermark(checked)}
              />
              <Text>添加水印（可帮助识别AI生成内容）</Text>
            </Space>
          </div>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={loading}
              onClick={handleSubmit}
              disabled={!selectedFile || !user || user.credits < serviceCost}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                minWidth: 200,
              }}
            >
              {loading ? '处理中...' : `提交任务 (${serviceCost} 积分)`}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HairStyle;