// public/service-worker.js

const CACHE_NAME = 'daily-talks-cache-v1';
// Add URLs of essential static assets to cache during installation
const urlsToCache = [
  '/', // The main index.html
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png', // Assuming these exist now
  '/icons/icon-512.png'
];

// Install event: Cache essential static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting after install');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Cache addAll failed during install:', error);
        // Even if caching fails, let install proceed maybe? Or throw error?
        // For now, just log it. Some assets might be missing offline.
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
    })
  );
});

// Fetch event: Handle network requests
// Strategy: Network falling back to Cache for non-API requests
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // --- Always ignore non-GET requests ---
    if (event.request.method !== 'GET') {
        // console.log('[ServiceWorker] Ignoring non-GET request:', event.request.method, event.request.url);
        // Don't call event.respondWith - let browser handle normally
        return;
    }

    // --- Handle API requests separately (Network Only) ---
    if (requestUrl.pathname.startsWith('/api/')) {
        // console.log('[ServiceWorker] Handling API request (Network Only):', event.request.url);
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    // Network error fetching API - cannot serve from cache
                    console.error('[ServiceWorker] API fetch error:', error);
                    // Return a generic error response or let the browser handle the network error
                    // Returning undefined lets the browser show its default network error page/message
                    // Or return new Response(JSON.stringify({ message: 'Network error accessing API' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
                    return undefined;
                })
        );
        return; // Stop processing for API requests
    }

    // --- Handle other GET requests (App Shell, Statics, etc.) ---
    // Strategy: Network falling back to Cache
    // console.log('[ServiceWorker] Handling non-API GET request:', event.request.url);
    event.respondWith(
        fetch(event.request) // Try network first
            .then(networkResponse => {
                // Optional: Cache successful responses dynamically? Not for now.
                return networkResponse; // Return network response if successful
            })
            .catch(() => { // Network failed, try cache
                console.log('[ServiceWorker] Network fetch failed, trying cache for:', event.request.url);
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            console.log('[ServiceWorker] Serving from cache:', event.request.url);
                            return cachedResponse; // Serve from cache if found
                        }
                        // Not in cache either
                        console.log('[ServiceWorker] Resource not found in cache:', event.request.url);
                        // Return undefined to let the browser handle the failure (e.g., show its 404 or offline page)
                        return undefined;
                    })
                    // *** NEW: Catch errors specifically from caches.match() or its .then() ***
                    .catch(cacheError => {
                        console.error('[ServiceWorker] Cache match/processing error:', cacheError);
                        // Failed to even check cache properly, return undefined
                        return undefined;
                    });
            })
    );
});