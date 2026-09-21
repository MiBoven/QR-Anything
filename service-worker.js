const CACHE_NAME = 'qr-anything-v0.1.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './vendor/qr-code-styling/qr-code-styling.js',
  './vendor/jsqr/jsQR.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Stale-while-revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
