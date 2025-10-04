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
  }, options?: { signal?: AbortSignal }) {
    const { data: response } = await apiClient.post('/deposits', data, {
      signal: options?.signal,
    });
    return response;
  },

  async validateDeposit(
    depositId: string,
    data: {
      originalMaterial: string;
      correctedMaterial?: string;
      observations?: string;
    },
    options?: { signal?: AbortSignal }
  ) {
    const { data: response } = await apiClient.post(`/deposits/${depositId}/validate`, data, {
      signal: options?.signal,
    });
    return response;
  },

  async getPendingValidation(facilityId?: string, options?: { signal?: AbortSignal }) {
    const params = facilityId ? { facilityId } : {};
    const { data } = await apiClient.get('/deposits/pending-validation', { params, signal: options?.signal });
    return data;
  },

  async getValidatedDeposits(facilityId?: string, materialType?: string, options?: { signal?: AbortSignal }) {
    const params: Record<string, string> = {};
    if (facilityId) params.facilityId = facilityId;
    if (materialType) params.materialType = materialType;
    
    const { data } = await apiClient.get('/deposits/validated', { params, signal: options?.signal });
    return data;
  },

  async getMyDeposits(params?: { 
  limit?: number; 
  page?: number; 
  status?: string; 
  materialType?: string; 
  from?: string; 
  to?: string;
  signal?: AbortSignal;
}) {
  const { signal, ...queryParams } = params || {};
  const { data } = await apiClient.get('/deposits/my-deposits', { 
    params: queryParams,
    signal 
  });
    // Backend puede responder { deposits, stats } o un array directo.
    if (Array.isArray(data)) return { deposits: data, stats: null, pagination: null };
  return data;
},

  async getMyDepositsWithStats(options?: { signal?: AbortSignal }): Promise<{ deposits: Deposit[]; stats: { total: number; created: number; validated: number; batched: number } }> {
    const { data } = await apiClient.get('/deposits/my-deposits', {
      signal: options?.signal,
    });
    if (Array.isArray(data)) {
      return {
        deposits: data as Deposit[],
        stats: {
          total: (data as Deposit[]).length,
          created: 0,
          validated: 0,
          batched: 0,
        },
      };
    }
    return data as { deposits: Deposit[]; stats: { total: number; created: number; validated: number; batched: number } };
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/deposits/${id}`);
    return data;
  },

  async uploadImage(depositId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post(`/deposits/${depositId}/images`, formData);
    return data;
  },

  // Método helper para crear depósito (adaptador para las nuevas páginas)
  async create(depositData: CreateDepositDto) {
    return this.createDeposit({
      ...depositData,
      photos: []
    });
  }
};