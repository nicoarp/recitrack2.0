import { apiClient } from '@/lib/api/client';

export const batchesService = {
  async createBatch(data: {
    facilityId: string;
    materialType: string;
  }) {
    const { data: response } = await apiClient.post('/batches', data);
    return response;
  },

  async addItems(batchId: string, data: {
    depositIds: string[];
  }) {
    const { data: response } = await apiClient.post(`/batches/${batchId}/items`, data);
    return response;
  },

  async weighBatch(batchId: string, data: {
    grossWeight: number;
    tareWeight: number;
  }) {
    const { data: response } = await apiClient.post(`/batches/${batchId}/weigh`, data);
    return response;
  },

  async closeBatch(batchId: string) {
    const { data: response } = await apiClient.post(`/batches/${batchId}/close`);
    return response;
  },

  async getOpenBatches(facilityId?: string) {
    const params = facilityId ? { facilityId } : {};
    const { data } = await apiClient.get('/batches/open', { params });
    return data;
  },
};