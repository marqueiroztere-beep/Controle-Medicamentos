import { notificationsApi } from '../api/notificationsApi';
import { openDB } from 'idb';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Store the JWT token in IndexedDB so the Service Worker can access it.
 */
export async function storeTokenInIDB(token: string): Promise<void> {
  try {
    const db = await openDB('medcontrol-auth', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tokens')) {
          db.createObjectStore('tokens', { keyPath: 'key' });
        }
      },
    });
    await db.put('tokens', { key: 'jwt', value: token });
  } catch (err) {
    console.warn('Could not store token in IDB:', err);
  }
}

/**
 * Clear JWT from IndexedDB on logout.
 */
export async function clearTokenFromIDB(): Promise<void> {
  try {
    const db = await openDB('medcontrol-auth', 1);
    await db.delete('tokens', 'jwt');
  } catch { /* silent */ }
}

/**
 * Register service worker and subscribe to push notifications.
 * Returns true if successfully subscribed.
 */
export async function setupPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Push notifications not supported');
    return false;
  }

  try {
    // Get VAPID public key
    const keyRes = await notificationsApi.getVapidKey();
    const vapidKey = keyRes.data.publicKey;

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // Subscribe if not already
    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.info('Notification permission denied');
        return false;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
    }

    // Send subscription to server
    const sub = subscription.toJSON();
    await notificationsApi.subscribe({
      endpoint: sub.endpoint!,
      keys: {
        p256dh: sub.keys!.p256dh,
        auth:   sub.keys!.auth,
      },
      userAgent: navigator.userAgent,
    });

    console.info('Push notifications enabled');
    return true;
  } catch (err) {
    console.warn('Push notification setup failed:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function teardownPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await notificationsApi.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch { /* silent */ }
}

export function isNotificationsSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
