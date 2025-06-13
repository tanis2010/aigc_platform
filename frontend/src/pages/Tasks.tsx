import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message, Image, Select, DatePicker, Input } from 'antd';
import { EyeOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { taskService } from '../services/tasks';
import { Task, TaskStatus } from '../services/tasks';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks();
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      onOk: async () => {
        try {
          await taskService.deleteTask(taskId);
          message.success('任务删除成功');
          fetchTasks();
        } catch (error) {
          message.error('删除任务失败');
        }
      },
    });
  };

  const handleViewDetail = async (taskId: string) => {
    try {
      const response = await taskService.getTask(taskId);
      setSelectedTask(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取任务详情失败');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: number) => String(text).slice(0, 8) + '...',
    },
    {
      title: '服务名称',
      dataIndex: 'service_name',
      key: 'service_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    // 新增：积分消耗列
    {
      title: '消耗积分',
      dataIndex: 'credits_used',
      key: 'credits_used',
      width: 100,
      render: (credits: number) => `${credits} 积分`,
    },
    // 新增：处理时长列
    {
      title: '处理时长',
      key: 'duration',
      width: 120,
      render: (_: any, record: Task) => {
        if (record.started_at && record.completed_at) {
          const duration = new Date(record.completed_at).getTime() - new Date(record.started_at).getTime();
          return `${Math.round(duration / 1000)}秒`;
        }
        return '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    // 新增：结果预览列
    {
      title: '结果预览',
      key: 'preview',
      width: 100,
      render: (_: any, record: Task) => {
        if (record.status === 'completed' && record.result_data) {
          try {
            const resultData = typeof record.result_data === 'string' 
              ? JSON.parse(record.result_data) 
              : record.result_data;
            
            if (record.service_name === '图片年龄变换' && resultData.output_image_url) {
              return (
                <Image
                  src={resultData.output_image_url}
                  alt="结果预览"
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={{
                    src: resultData.output_image_url,
                  }}
                />
              );
            }
          } catch (e) {
            console.error('解析结果数据失败:', e);
          }
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.status === 'pending' || record.status === 'processing'}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>我的任务</h2>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Select
            placeholder="筛选状态"
            style={{ width: 120 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="pending">等待中</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
          </Select>
          
          <Search
            placeholder="搜索服务名称"
            style={{ width: 200 }}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            allowClear
          />
          
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={setDateRange}
          />
          
          <Button type="primary" onClick={fetchTasks} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedTask && (
          <div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <p><strong>任务ID:</strong> {selectedTask.id}</p>
                  <p><strong>服务名称:</strong> {selectedTask.service_name}</p>
                  <p><strong>状态:</strong> 
                    <Tag color={getStatusColor(selectedTask.status)}>
                      {getStatusText(selectedTask.status)}
                    </Tag>
                  </p>
                  <p><strong>消耗积分:</strong> {selectedTask.credits_used}</p>
                </div>
                <div>
                  <p><strong>创建时间:</strong> {new Date(selectedTask.created_at).toLocaleString()}</p>
                  {selectedTask.started_at && (
                    <p><strong>开始时间:</strong> {new Date(selectedTask.started_at).toLocaleString()}</p>
                  )}
                  {selectedTask.completed_at && (
                    <p><strong>完成时间:</strong> {new Date(selectedTask.completed_at).toLocaleString()}</p>
                  )}
                  {selectedTask.started_at && selectedTask.completed_at && (
                    <p><strong>处理时长:</strong> 
                      {Math.round((new Date(selectedTask.completed_at).getTime() - new Date(selectedTask.started_at).getTime()) / 1000)}秒
                    </p>
                  )}
                </div>
              </div>
              
              {selectedTask.error_message && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: 'red' }}>错误信息:</h4>
                  <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '10px', borderRadius: '4px' }}>
                    {selectedTask.error_message}
                  </div>
                </div>
              )}
              
              {selectedTask.input_data && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>输入参数:</h4>
                  <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, maxHeight: '200px', overflow: 'auto' }}>
                    {typeof selectedTask.input_data === 'string' 
                      ? selectedTask.input_data 
                      : JSON.stringify(selectedTask.input_data, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedTask.result_data && (
                <div>
                  <h4>处理结果:</h4>
                  {selectedTask.service_name === '图片年龄变换' && (() => {
                    try {
                      const resultData = typeof selectedTask.result_data === 'string' 
                        ? JSON.parse(selectedTask.result_data) 
                        : selectedTask.result_data;
                      
                      if (resultData.output_image_url) {
                        return (
                          <div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>原始图片路径:</strong> {resultData.image_path || '未知'}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>目标年龄:</strong> {resultData.target_age || '未知'}岁
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>输出图片:</strong>
                            </div>
                            <Image
                              src={resultData.output_image_url}
                              alt="处理结果"
                              style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8 }}
                            />
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                              <strong>文件路径:</strong> {resultData.output_image_url}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error('解析结果数据失败:', e);
                    }
                    return (
                      <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, maxHeight: '300px', overflow: 'auto' }}>
                        {typeof selectedTask.result_data === 'string' 
                          ? selectedTask.result_data 
                          : JSON.stringify(selectedTask.result_data, null, 2)}
                      </pre>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;