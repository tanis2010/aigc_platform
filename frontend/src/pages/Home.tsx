import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Statistic, Space } from 'antd';
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  CreditCardOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { servicesService, Service } from '../services/services';
import { tasksService, Task } from '../services/tasks';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [services, tasksResponse] = await Promise.all([
          servicesService.getPopularServices(3),
          tasksService.getTasks({ limit: 3 }),
        ]);
        setPopularServices(services);
        setRecentTasks(tasksResponse.data);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    {
      title: '浏览服务',
      description: '探索各种AI生成内容服务',
      icon: <AppstoreOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      action: () => navigate('/services'),
    },
    {
      title: '我的任务',
      description: '查看任务进度和历史记录',
      icon: <UnorderedListOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      action: () => navigate('/tasks'),
    },
    {
      title: '积分充值',
      description: '购买积分以使用更多服务',
      icon: <CreditCardOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      action: () => navigate('/credits'),
    },
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <div className="page-header">
        <div className="container">
          <Row align="middle">
            <Col flex="auto">
              <Title level={2} style={{ margin: 0 }}>
                欢迎回来，{user?.username}！
              </Title>
              <Paragraph style={{ margin: '8px 0 0', fontSize: 16 }}>
                探索强大的AI生成内容服务，释放创意无限可能
              </Paragraph>
            </Col>
            <Col>
              <div className="credits-display">
                <div className="credits-number">{user?.credits || 0}</div>
                <div className="credits-label">可用积分</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="container">
        {/* 统计信息 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="当前积分"
                value={user?.credits || 0}
                prefix={<CreditCardOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="历史任务"
                value={recentTasks.length}
                prefix={<UnorderedListOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="可用服务"
                value={popularServices.length}
                prefix={<RocketOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 快捷操作 */}
        <Card title="快捷操作" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card
                  hoverable
                  onClick={action.action}
                  style={{ textAlign: 'center', height: '100%' }}
                >
                  <Space direction="vertical" size="middle">
                    {action.icon}
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {action.title}
                      </Title>
                      <Paragraph style={{ margin: '8px 0 0', color: '#666' }}>
                        {action.description}
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 热门服务 */}
        <Card title="热门服务" extra={<Button type="link" onClick={() => navigate('/services')}>查看全部</Button>}>
          <Row gutter={[16, 16]}>
            {popularServices.map((service) => (
              <Col xs={24} sm={12} lg={8} key={service.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => {
                    if (service.name === '图片年龄变换') {
                      navigate('/services/image-age-transform');
                    }
                  }}
                >
                  <Card.Meta
                    title={service.name}
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                          {service.description}
                        </Paragraph>
                        <div style={{ marginTop: 8, color: '#1890ff', fontWeight: 'bold' }}>
                          {service.cost_credits} 积分
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default Home;