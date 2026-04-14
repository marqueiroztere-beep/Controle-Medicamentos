// Service Worker — MedControl Push Notifications
const CACHE_NAME = 'medcontrol-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle push notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MedControl', body: event.data.text() };
  }

  // Detect iOS — it doesn't support actions or requireInteraction
  const isIOS = /iPhone|iPad|iPod/.test(self.navigator?.userAgent || '');

  const options = {
    body:    payload.body || 'Hora de tomar seu medicamento',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/badge-72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag:     `dose-${payload.agendaItemId || Date.now()}`,
    renotify: true,
    requireInteraction: !isIOS,  // iOS ignores this, avoid issues
    data: {
      agendaItemId: payload.agendaItemId,
      apiUrl: payload.apiUrl || '',
      url: '/',
    },
    // iOS doesn't support notification actions — only show on other platforms
    ...(!isIOS && {
      actions: [
        { action: 'take',     title: 'Tomei agora' },
        { action: 'postpone', title: 'Adiar 15min' },
      ],
    }),
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Hora do remédio!', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const { agendaItemId } = notification.data || {};

  notification.close();

  const apiUrl = (notification.data && notification.data.apiUrl) || '';

  if (action === 'take' && agendaItemId) {
    // POST take action from SW — token read from IndexedDB
    event.waitUntil(
      getTokenFromIDB().then(token => {
        if (!token) return;
        return fetch(`${apiUrl}/api/doses/${agendaItemId}/take`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note: 'Registrado via notificação' }),
        });
      })
    );
  } else if (action === 'postpone' && agendaItemId) {
    event.waitUntil(
      getTokenFromIDB().then(token => {
        if (!token) return;
        const postponeTo = new Date(Date.now() + 15 * 60 * 1000);
        const iso = postponeTo.toISOString().slice(0, 19);
        return fetch(`${apiUrl}/api/doses/${agendaItemId}/postpone`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postpone_to: iso, note: 'Adiado via notificação' }),
        });
      })
    );
  }

  // Focus app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Read JWT from IndexedDB (set by the app on login)
async function getTokenFromIDB() {
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('medcontrol-auth', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
      req.onupgradeneeded = e => {
        e.target.result.createObjectStore('tokens', { keyPath: 'key' });
      };
    });

    return await new Promise((resolve) => {
      const tx   = db.transaction('tokens', 'readonly');
      const store = tx.objectStore('tokens');
      const req  = store.get('jwt');
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror   = () => resolve(null);
    });
  } catch {
    return null;
  }
}
