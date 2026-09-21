// Minimal Service Worker for PWA WebAPK compliance
const CACHE_NAME = 'kids-tablet-lock-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser fetch normally, with fallback if needed
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
