import api from './api';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  credits: number;
  status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  amount: number;
  description: string;
  bonus: number;
}

export const paymentsService = {
  // 获取用户支付记录
  getPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/');
    return response.data;
  },

  // 创建支付订单
  createPayment: async (data: {
    amount: number;
    credits: number;
    payment_method: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  // 确认支付
  confirmPayment: async (paymentId: number): Promise<{ message: string }> => {
    const response = await api.post(`/payments/confirm/${paymentId}`);
    return response.data;
  },

  // 获取积分套餐
  getCreditPackages: async (): Promise<CreditPackage[]> => {
    const response = await api.get('/payments/packages');
    return response.data;
  },

  // 购买积分套餐
  purchaseCreditPackage: async (packageId: number): Promise<Payment> => {
    const response = await api.post(`/payments/package/${packageId}`);
    return response.data;
  },
};