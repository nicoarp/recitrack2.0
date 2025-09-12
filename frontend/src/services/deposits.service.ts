import { apiClient } from '@/lib/api/client';
import { Deposit } from '@/types';

export const depositsService = {
  async createDeposit(data: {
    qrCodeId: string;
    collectionPointId?: string;
    materialType: string;
    estimatedWeight: number;
    photos: string[];
    observations?: string;
  }) {
    const { data: response } = await apiClient.post('/deposits', data);
    return response;
  },

  async validateDeposit(
    depositId: string,
    data: {
      originalMaterial: string;
      correctedMaterial?: string;
      observations?: string;
    }
  ) {
    const { data: response } = await apiClient.post(`/deposits/${depositId}/validate`, data);
    return response;
  },

  async getPendingValidation(facilityId?: string) {
    const params = facilityId ? { facilityId } : {};
    const { data } = await apiClient.get('/deposits/pending-validation', { params });
    return data;
  },

  async getValidatedDeposits(facilityId?: string, materialType?: string) {
    const params: any = {};
    if (facilityId) params.facilityId = facilityId;
    if (materialType) params.materialType = materialType;
    
    const { data } = await apiClient.get('/deposits/validated', { params });
    return data;
  },

  async getMyDeposits(): Promise<Deposit[]> {
    const { data } = await apiClient.get('/deposits/my-deposits');
    return data;
  },
};