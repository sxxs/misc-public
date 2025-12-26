const SW_VERSION = '2.4.2';

self.addEventListener('install', (event) => {
    console.log(`[SW ${SW_VERSION}] Installing`);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log(`[SW ${SW_VERSION}] Activated`);
    event.waitUntil(self.clients.claim());
});

// Network-First: Immer vom Netzwerk laden, kein Caching
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // Fallback nur bei Netzwerkfehler
            console.warn(`[SW] Network request failed: ${event.request.url}`);
            return new Response('Offline', { status: 503 });
        })
    );
});
