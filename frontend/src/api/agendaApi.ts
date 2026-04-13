import { apiClient } from './client';
import type { AgendaItem } from '../types';

export const agendaApi = {
  getToday: () =>
    apiClient.get<{ items: AgendaItem[] }>('/agenda/today'),

  getByDate: (date: string) =>
    apiClient.get<{ date: string; items: AgendaItem[] }>('/agenda', { params: { date } }),

  getByRange: (from: string, to: string) =>
    apiClient.get<{ from: string; to: string; items: AgendaItem[] }>('/agenda/range', { params: { from, to } }),
};
