import { apiClient } from './client';
import type { PushSubscriptionPayload } from '../types';

export const notificationsApi = {
  getVapidKey: () =>
    apiClient.get<{ publicKey: string }>('/notifications/vapid-key'),

  subscribe: (subscription: PushSubscriptionPayload) =>
    apiClient.post('/notifications/subscribe', subscription),

  unsubscribe: (endpoint: string) =>
    apiClient.delete('/notifications/subscribe', { data: { endpoint } }),
};
