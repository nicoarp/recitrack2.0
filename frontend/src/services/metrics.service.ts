import { apiClient } from '@/lib/api/client';

export const metricsService = {
  // Tus métodos existentes
  async getMyMetrics(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/metrics/my-metrics', {
      signal: options?.signal,
    });
    return data;
  },

  async getCollectorMetrics(collectorId: string, options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get(`/metrics/collector/${collectorId}`, {
      signal: options?.signal,
    });
    return data;
  },

  async getFacilityMetrics(
    facilityId: string,
    dateFrom?: string,
    dateTo?: string
  ,
    options?: { signal?: AbortSignal }
  ) {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    const { data } = await apiClient.get(`/metrics/facility/${facilityId}`, { params, signal: options?.signal });
    return data;
  },

  async getGlobalMetrics(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/metrics/global', {
      signal: options?.signal,
    });
    return data;
  },

  // NUEVOS MÉTODOS PARA EL DASHBOARD
  async getDashboardMetrics(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/metrics/dashboard', {
      signal: options?.signal,
    });
    return data;
  },

  async getCollectorStats(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/metrics/collector/stats', {
      signal: options?.signal,
    });
    return data;
  },

  async getMaterialBreakdown(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/metrics/materials', {
      signal: options?.signal,
    });
    return data;
  },
};
