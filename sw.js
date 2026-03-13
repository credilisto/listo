const CACHE_NAME = 'credilisto-v2';
const ASSETS = ['/index.html', '/admin.html', '/gestionar.html', '/logocredi.png', '/image1.png', '/image2.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});