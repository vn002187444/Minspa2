const CACHE_NAME = 'min-salon-cache-v3';
const STATIC_CACHE = 'min-salon-static-v3';
const OFFLINE_CACHE = 'min-salon-offline-v1';
const ASSETS_TO_CACHE = [
  '/manifest.json',
];
const OFFLINE_PAGE = '/offline';

const STATIC_EXTENSIONS = /\.(js|css|svg|ico|woff2?|png|jpg|jpeg|gif|webp)$/;

self.addEventListener('install', (e) => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
      caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_PAGE])),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== STATIC_CACHE && key !== OFFLINE_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  let url;
  try {
    url = new URL(e.request.url);
  } catch {
    e.respondWith(fetch(e.request));
    return;
  }

  // Pass-through for API, Supabase, WebSocket, Next.js static chunks
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/_next/') ||
    url.pathname.includes('supabase') ||
    url.pathname.includes('ws') ||
    e.request.headers.get('accept')?.includes('text/event-stream')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    e.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((response) => {
            if (response && response.status === 200) {
              cache.put(e.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Network-first for pages with iOS-safe timeout
  e.respondWith(
    Promise.race([
      fetch(e.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
    ]).catch(() => {
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (e.request.mode === 'navigate') {
          return caches.open(OFFLINE_CACHE).then((cache) => {
            return cache.match(OFFLINE_PAGE);
          });
        }
      });
    })
  );
});

// Background sync: retry failed queue items when online
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-queue') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'trigger-sync' });
        });
      })
    );
  }
});

// Capture native push notification from the server
self.addEventListener('push', (event) => {
  let data = { title: 'Min Nail & Hair', body: 'Có thông báo mới dành cho bạn!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Min Nail & Hair', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'open_url', title: 'Xem chi tiết' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle clicking on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find matching tab/window and focus it if open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf(urlToOpen) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

