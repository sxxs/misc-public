const SW_VERSION = '0.1.0';

self.addEventListener('install', (event) => {
    console.log(`[SW ${SW_VERSION}] Installing`);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log(`[SW ${SW_VERSION}] Activated`);
    event.waitUntil(self.clients.claim());
});

// Network-First: Immer vom Netzwerk laden
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});
