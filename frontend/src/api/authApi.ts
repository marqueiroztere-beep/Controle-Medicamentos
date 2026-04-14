import { apiClient } from './client';
import type { LoginResponse, User } from '../types';

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  getMe: () =>
    apiClient.get<{ user: User }>('/auth/me'),

  updateMe: (data: { name?: string; email?: string }) =>
    apiClient.put<{ user: User }>('/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/password', { currentPassword, newPassword }),

  clearMyData: () =>
    apiClient.delete<{ message: string; deleted: { agenda_items: number; medications: number; patients: number; push_subscriptions: number } }>('/auth/my-data'),
};
