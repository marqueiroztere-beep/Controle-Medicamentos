import { apiClient } from './client';
import type { HistoryResponse } from '../types';

export const dosesApi = {
  take: (agendaItemId: number, note?: string) =>
    apiClient.post(`/doses/${agendaItemId}/take`, { note }),

  skip: (agendaItemId: number, note?: string) =>
    apiClient.post(`/doses/${agendaItemId}/skip`, { note }),

  postpone: (agendaItemId: number, postpone_to: string, note?: string) =>
    apiClient.post(`/doses/${agendaItemId}/postpone`, { postpone_to, note }),

  getHistory: (params: {
    medication_id?: number;
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<HistoryResponse>('/doses/history', { params }),
};
