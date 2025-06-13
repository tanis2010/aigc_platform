import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Avatar, Upload, Modal } from 'antd';
import { UserOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import type { UploadProps } from 'antd';

interface UserForm {
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
}

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        phone: user.phone || '',
      });
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user, form]);

  const handleSubmit = async (values: UserForm) => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateUser(values);
      updateUser(updatedUser);
      message.success('个人信息更新成功');
      setEditing(false);
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        phone: user.phone || '',
      });
    }
    setEditing(false);
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    action: '/api/upload/avatar',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
        setAvatarUrl(info.file.response.url);
      } else if (info.file.status === 'error') {
        message.error('头像上传失败');
      }
    },
  };

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title="个人资料"
        extra={
          !editing ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              编辑资料
            </Button>
          ) : null
        }
      >
        <div style={{ display: 'flex', marginBottom: 24 }}>
          <div style={{ marginRight: 24 }}>
            <Avatar
              size={100}
              src={avatarUrl}
              icon={<UserOutlined />}
            />
            {editing && (
              <div style={{ marginTop: 8 }}>
                <Upload {...uploadProps} showUploadList={false}>
                  <Button size="small" icon={<UploadOutlined />}>
                    更换头像
                  </Button>
                </Upload>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={!editing}
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                label="姓名"
                name="full_name"
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>

              {editing && (
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{ marginRight: 8 }}
                  >
                    保存
                  </Button>
                  <Button onClick={handleCancel}>
                    取消
                  </Button>
                </Form.Item>
              )}
            </Form>
          </div>
        </div>
      </Card>

      <Card title="账户信息" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p><strong>用户ID:</strong> {user.id}</p>
            <p><strong>注册时间:</strong> {new Date(user.created_at).toLocaleString()}</p>
            <p><strong>当前积分:</strong> <span style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>{user.credits}</span></p>
          </div>
        </div>
      </Card>

      <Card title="安全设置" style={{ marginTop: 24 }}>
        <div>
          <Button type="default" style={{ marginRight: 8 }}>
            修改密码
          </Button>
          <Button type="default">
            绑定手机
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;