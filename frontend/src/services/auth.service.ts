import { apiClient } from '@/lib/api/client';
import { LoginResponse } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<LoginResponse> {
    const { data: response } = await apiClient.post('/auth/register', data);
    return response;
  },

  async getProfile() {
    const { data } = await apiClient.get('/users/profile');
    return data;
  },
};