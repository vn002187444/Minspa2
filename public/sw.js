const CACHE_NAME = 'min-salon-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Parse request to see if it qualifies for caching
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  let url;
  try {
    url = new URL(e.request.url);
  } catch (err) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Pass-through strategy to avoid breaking Supabase or any live network/auth APIs
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('supabase') ||
    url.pathname.includes('_next') ||
    url.pathname.includes('ws') ||
    e.request.headers.get('accept')?.includes('text/event-stream')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-First strategy with fallback to Cache for regular pages and static resources
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Serve offline page for navigation requests
          if (e.request.mode === 'navigate') {
            return caches.open(CACHE_NAME).then((cache) => {
              return cache.match('/offline');
            });
          }
        });
      })
  );
});

// Capture native push notification from the server
self.addEventListener('push', (event) => {
  let data = { title: 'Min Nail & Hair', body: 'Có thông báo mới dành cho bạn!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Min Nail & Hair', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/badge.png',
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

