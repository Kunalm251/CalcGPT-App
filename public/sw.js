const CACHE_NAME = "ai-math-calculator-v1";

// Critical app shell resources to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Service Worker Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching application shell");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor: Caching & Offline Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or non-HTTP(S) schemes (e.g. chrome-extension, data:)
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Handle API Requests: Network-First with Offline JSON fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response, cache a clone if GET endpoint
          return networkResponse;
        })
        .catch(() => {
          // Return offline JSON response for AI endpoints when network fails
          return new Response(
            JSON.stringify({
              error: "Offline mode active. Basic calculations and scientific tools function offline, but AI network requests require an active internet connection.",
              offline: true,
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
    return;
  }

  // Handle HTML Page Navigation Requests (Network First -> Cache Fallback -> Index HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const indexFallback = await caches.match("/index.html");
          if (indexFallback) {
            return indexFallback;
          }
          return new Response("Offline - AI Math Calculator", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts) - Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Silently absorb network fetch failure if cached asset is available
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
