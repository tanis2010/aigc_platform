import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Empty,
  Spin,
} from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { servicesService, Service, ServiceTag } from '../services/services';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [tags, setTags] = useState<ServiceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, tagsData] = await Promise.all([
          servicesService.getServices(),
          servicesService.getTags(),
        ]);
        setServices(servicesData);
        setTags(tagsData);
      } catch (error) {
        console.error('获取服务数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const servicesData = await servicesService.getServices({
        search: searchText || undefined,
        tag_id: selectedTag,
      });
      setServices(servicesData);
    } catch (error) {
      console.error('搜索服务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    if (service.name === '图片年龄变换') {
      navigate('/services/image-age-transform');
    } else if (service.name === '发型编辑') {
      navigate('/services/hair_style');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <Title level={2} style={{ margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            服务中心
          </Title>
          <Paragraph style={{ margin: '8px 0 0', fontSize: 16 }}>
            探索各种AI生成内容服务，释放创意潜能
          </Paragraph>
        </div>
      </div>

      <div className="container">
        {/* 搜索和筛选 */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Search
                placeholder="搜索服务名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                enterButton
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Select
                placeholder="选择服务标签"
                style={{ width: '100%' }}
                allowClear
                value={selectedTag}
                onChange={(value) => {
                  setSelectedTag(value);
                  // 自动搜索
                  setTimeout(() => handleSearch(), 100);
                }}
              >
                {tags.map((tag) => (
                  <Option key={tag.id} value={tag.id}>
                    {tag.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 服务列表 */}
        <Spin spinning={loading}>
          {services.length === 0 ? (
            <Empty description="暂无服务" />
          ) : (
            <Row gutter={[16, 16]}>
              {services.map((service) => (
                <Col xs={24} sm={12} lg={8} key={service.id}>
                  <Card
                    hoverable
                    className="service-card"
                    onClick={() => handleServiceClick(service)}
                    actions={[
                      <Button type="primary" size="small">
                        立即使用
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          {service.name}
                          <Tag color="blue">{service.tag.name}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 3 }} style={{ margin: '8px 0' }}>
                            {service.description}
                          </Paragraph>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: 16,
                            }}
                          >
                            <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 16 }}>
                              {service.cost_credits} 积分
                            </span>
                            <Tag color={service.is_active ? 'green' : 'red'}>
                              {service.is_active ? '可用' : '维护中'}
                            </Tag>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Services;