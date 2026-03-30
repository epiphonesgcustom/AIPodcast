// Increment this version number every time you update the app files.
// This forces the service worker to fetch fresh versions from the server.
const CACHE = 'podcast-gen-v6';

const SHELL = [
  '/AIPodcast/podcast-generator.html',
  '/AIPodcast/manifest.json',
  '/AIPodcast/icons/icon-192.png',
  '/AIPodcast/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
