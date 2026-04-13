import { apiClient } from './client';
import type { AgendaItem } from '../types';

export const agendaApi = {
  getToday: (patientId?: string) =>
    apiClient.get<{ items: AgendaItem[] }>('/agenda/today', {
      params: patientId !== undefined ? { patient_id: patientId } : undefined,
    }),

  getByDate: (date: string, patientId?: string) =>
    apiClient.get<{ date: string; items: AgendaItem[] }>('/agenda', {
      params: { date, ...(patientId !== undefined ? { patient_id: patientId } : {}) },
    }),

  getByRange: (from: string, to: string, patientId?: string) =>
    apiClient.get<{ from: string; to: string; items: AgendaItem[] }>('/agenda/range', {
      params: { from, to, ...(patientId !== undefined ? { patient_id: patientId } : {}) },
    }),
};
