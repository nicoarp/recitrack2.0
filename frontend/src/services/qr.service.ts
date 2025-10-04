import { apiClient } from '@/lib/api/client';

export const qrService = {
  async generateQRCodes(quantity: number, options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.post('/qr-codes/generate', { quantity }, {
      signal: options?.signal,
    });
    return data;
  },

  async getQRCode(code: string, options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get(`/qr-codes/${code}`, {
      signal: options?.signal,
    });
    return data;
  },

  async getMyQRCodes(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/qr-codes/my-codes', {
      signal: options?.signal,
    });
    return data;
  },
};
