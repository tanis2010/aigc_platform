import api from './api';

export interface ServiceTag {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  tag_id: number;
  cost_credits: number;
  is_active: boolean;
  endpoint?: string;
  created_at: string;
  tag: ServiceTag;
}

export const servicesService = {
  // 获取所有服务标签
  getTags: async (): Promise<ServiceTag[]> => {
    const response = await api.get('/services/tags');
    return response.data;
  },

  // 获取服务列表
  getServices: async (params?: {
    tag_id?: number;
    search?: string;
    active_only?: boolean;
  }): Promise<Service[]> => {
    const response = await api.get('/services/', { params });
    return response.data;
  },

  // 获取单个服务详情
  getService: async (id: number): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // 获取图片年龄变换服务
  getImageAgeTransformService: async (): Promise<Service> => {
    const response = await api.get('/services/image-age-transform');
    return response.data;
  },

  // 获取热门服务
  getPopularServices: async (limit = 10): Promise<Service[]> => {
    const response = await api.get('/services/popular', {
      params: { limit }
    });
    return response.data;
  },
};