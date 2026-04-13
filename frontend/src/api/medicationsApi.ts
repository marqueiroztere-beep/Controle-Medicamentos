import { apiClient } from './client';
import type { Medication, MedicationFormData } from '../types';

export const medicationsApi = {
  list: (includeDeleted = false) =>
    apiClient.get<{ medications: Medication[] }>('/medications', {
      params: includeDeleted ? { include: 'deleted' } : undefined,
    }),

  get: (id: number) =>
    apiClient.get<{ medication: Medication }>(`/medications/${id}`),

  create: (data: Partial<MedicationFormData>) =>
    apiClient.post<{ medication: Medication }>('/medications', data),

  update: (id: number, data: Partial<MedicationFormData>) =>
    apiClient.put<{ medication: Medication }>(`/medications/${id}`, data),

  updateStatus: (id: number, status: string) =>
    apiClient.patch<{ medication: Medication }>(`/medications/${id}/status`, { status }),

  delete: (id: number) =>
    apiClient.delete(`/medications/${id}`),

  getInfo: (name: string) =>
    apiClient.get<{ name: string; summary: string }>('/medications/info', { params: { name } }),
};
