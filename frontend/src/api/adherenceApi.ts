import { apiClient } from './client';
import type { AdherenceResponse, AdherenceStats, DailyAdherence, Medication } from '../types';

export const adherenceApi = {
  getGlobal: (params?: { from?: string; to?: string }) =>
    apiClient.get<AdherenceResponse>('/adherence', { params }),

  getMedication: (medicationId: number, params?: { from?: string; to?: string }) =>
    apiClient.get<{ medication: Medication; stats: AdherenceStats; daily: DailyAdherence[] }>(
      `/adherence/${medicationId}`,
      { params }
    ),
};
