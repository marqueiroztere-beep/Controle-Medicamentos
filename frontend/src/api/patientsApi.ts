import { apiClient } from './client';
import type { Patient, PatientFormData } from '../types';

export const patientsApi = {
  list: () =>
    apiClient.get<{ patients: Patient[] }>('/patients'),

  create: (data: Partial<PatientFormData>) =>
    apiClient.post<{ patient: Patient }>('/patients', data),

  update: (id: number, data: Partial<PatientFormData>) =>
    apiClient.put<{ patient: Patient }>(`/patients/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/patients/${id}`),
};
