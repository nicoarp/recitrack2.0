import { apiClient } from '@/lib/api/client';

export const metricsService = {
  async getMyMetrics() {
    const { data } = await apiClient.get('/metrics/my-metrics');
    return data;
  },

  async getCollectorMetrics(collectorId: string) {
    const { data } = await apiClient.get(`/metrics/collector/${collectorId}`);
    return data;
  },

  async getFacilityMetrics(
    facilityId: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    const { data } = await apiClient.get(`/metrics/facility/${facilityId}`, { params });
    return data;
  },

  async getGlobalMetrics() {
    const { data } = await apiClient.get('/metrics/global');
    return data;
  },
};