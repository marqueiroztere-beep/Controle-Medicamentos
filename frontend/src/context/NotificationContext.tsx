import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  setupPushNotifications,
  teardownPushNotifications,
  storeTokenInIDB,
  clearTokenFromIDB,
  isNotificationsSupported,
  getNotificationPermission,
} from '../utils/notificationUtils';

interface NotificationContextValue {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isEnabled: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  isSupported: false,
  permission: 'default',
  isEnabled: false,
  enable: async () => false,
  disable: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [isEnabled, setIsEnabled]   = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const isSupported = isNotificationsSupported();

  // Sync token to IDB whenever it changes
  useEffect(() => {
    if (token) {
      storeTokenInIDB(token);
    } else {
      clearTokenFromIDB();
    }
  }, [token]);

  // Auto-setup on login if previously granted
  useEffect(() => {
    if (!isAuthenticated || !isSupported) return;

    const perm = getNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      setupPushNotifications().then(ok => setIsEnabled(ok));
    }
  }, [isAuthenticated, isSupported]);

  async function enable() {
    const ok = await setupPushNotifications();
    setIsEnabled(ok);
    setPermission(getNotificationPermission());
    return ok;
  }

  async function disable() {
    await teardownPushNotifications();
    setIsEnabled(false);
  }

  return (
    <NotificationContext.Provider value={{ isSupported, permission, isEnabled, enable, disable }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
