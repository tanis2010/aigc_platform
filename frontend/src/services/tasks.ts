import api from './api';
import { Service } from './services';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  id: string;
  user_id: number;
  service_id: number;
  service_name: string;
  status: TaskStatus;
  input_data: any;
  result_data?: any;
  error_message?: string;
  credits_used: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  service?: Service;
}

export interface ImageAgeTransformResponse {
  task_id: number;
  message: string;
}

export const taskService = {
  // 获取用户任务列表
  getTasks: async (params?: {
    status?: TaskStatus;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/tasks/', { params });
    return response;
  },

  // 获取单个任务详情
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response;
  },

  // 创建图片年龄变换任务
  createImageAgeTransformTask: async (
    image: File,
    targetAge: number
  ): Promise<ImageAgeTransformResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('target_age', targetAge.toString());

    const response = await api.post('/tasks/image-age-transform', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 删除任务
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export const tasksService = taskService;