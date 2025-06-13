import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, message, Modal, Row, Col, Statistic } from 'antd';
import { CreditCardOutlined, ShoppingCartOutlined, HistoryOutlined } from '@ant-design/icons';
import { paymentsService } from '../services/payments';
import { useAuthStore } from '../stores/authStore';
import type { Payment, CreditPackage } from '../services/payments';

const Credits: React.FC = () => {
  const { user, updateUserCredits } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
    fetchCreditPackages();
  }, []);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const payments = await paymentsService.getPayments();
      setPayments(payments);
    } catch (error) {
      message.error('获取支付记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditPackages = async () => {
    try {
      const packages = await paymentsService.getCreditPackages();
      setCreditPackages(packages);
    } catch (error) {
      message.error('获取积分套餐失败');
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchaseLoading(packageId);
    try {
      const payment = await paymentsService.purchaseCreditPackage(parseInt(packageId));
      message.success('购买成功！积分已到账');
      // 假设购买成功后需要重新获取用户信息来更新积分
      // updateUserCredits(payment.credits);
      fetchPaymentHistory();
      setPurchaseModalVisible(false);
    } catch (error) {
      message.error('购买失败，请重试');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const showPurchaseModal = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setPurchaseModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  const paymentColumns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: number) => String(text).slice(0, 8) + '...',
    },
    {
      title: '套餐名称',
      dataIndex: 'package_name',
      key: 'package_name',
    },
    {
      title: '积分数量',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          +{credits}
        </span>
      ),
    },
    {
      title: '支付金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Statistic
              title="当前积分余额"
              value={user?.credits || 0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title="积分套餐"
            extra={
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => fetchCreditPackages()}
              >
                刷新套餐
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {creditPackages.map((pkg) => (
                <Col xs={24} sm={12} md={8} lg={6} key={pkg.id}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center' }}
                    actions={[
                      <Button
                        type="primary"
                        loading={purchaseLoading === pkg.id.toString()}
                        onClick={() => showPurchaseModal(pkg)}
                        block
                      >
                        购买
                      </Button>,
                    ]}
                  >
                    <div style={{ padding: '16px 0' }}>
                      <h3 style={{ margin: 0, color: '#1890ff' }}>{pkg.name}</h3>
                      <div style={{ margin: '16px 0' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                          {pkg.credits} 积分
                        </div>
                        <div style={{ fontSize: 20, color: '#f5222d' }}>
                          ¥{pkg.amount.toFixed(2)}
                        </div>
                      </div>
                      {pkg.bonus > 0 && (
                        <Tag color="red">赠送 {pkg.bonus} 积分</Tag>
                      )}
                      <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                        {pkg.description}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title="支付记录"
            extra={
              <Button
                icon={<HistoryOutlined />}
                onClick={fetchPaymentHistory}
                loading={loading}
              >
                刷新记录
              </Button>
            }
          >
            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认购买"
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPurchaseModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={purchaseLoading === selectedPackage?.id.toString()}
            onClick={() => selectedPackage && handlePurchase(selectedPackage.id.toString())}
          >
            确认购买
          </Button>,
        ]}
      >
        {selectedPackage && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3>{selectedPackage.name}</h3>
            <div style={{ margin: '16px 0' }}>
              <div style={{ fontSize: 18 }}>
                积分数量: <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedPackage.credits}</span>
              </div>
              {selectedPackage.bonus > 0 && (
                <div style={{ fontSize: 16, color: '#52c41a' }}>
                  赠送积分: +{selectedPackage.bonus}
                </div>
              )}
              <div style={{ fontSize: 20, color: '#f5222d', marginTop: 8 }}>
                支付金额: ¥{selectedPackage.amount.toFixed(2)}
              </div>
            </div>
            <div style={{ color: '#666', fontSize: 14 }}>
              {selectedPackage.description}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Credits;