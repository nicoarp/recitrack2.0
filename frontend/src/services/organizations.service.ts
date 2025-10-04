import { apiClient } from '@/lib/api/client';

export const organizationsService = {
  async getOrganizations(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/organizations', {
      signal: options?.signal,
    });
    return data;
  },

  async getCollectionPoints(options?: { signal?: AbortSignal }) {
    const { data } = await apiClient.get('/collection-points', {
      signal: options?.signal,
    });
    return data;
  },

  async getFacilities(organizationId?: string, options?: { signal?: AbortSignal }) {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;

    const { data } = await apiClient.get('/organizations/facilities', {
      params,
      signal: options?.signal,
    });
    return data;
  },
};
