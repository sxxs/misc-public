const SW_VERSION = '1.2.0';

self.addEventListener('install', (event) => {
    console.log(`[SW ${SW_VERSION}] Installing`);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log(`[SW ${SW_VERSION}] Activated`);
    event.waitUntil(self.clients.claim());
});

// Network-First: Always load from network, no caching
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            console.warn(`[SW] Network request failed: ${event.request.url}`);
            return new Response('Offline', { status: 503 });
        })
    );
});
