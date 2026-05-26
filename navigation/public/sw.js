const TILE_CACHE = "osm-tile-cache-v3";

// Install
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== TILE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();

});

// Fetch handler
self.addEventListener("fetch", (event) => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only intercept OSM tiles
  if (url.hostname === "tile.openstreetmap.org") {

    event.respondWith(

      caches.open(TILE_CACHE).then(async (cache) => {

        // 1️⃣ Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {

          // 2️⃣ Fetch from network
          const networkResponse = await fetch(request);

          if (networkResponse && networkResponse.status === 200) {

            // 3️⃣ Store in cache
            cache.put(request, networkResponse.clone());

          }

          return networkResponse;

        } catch (error) {

          // 4️⃣ Offline fallback
          const fallback = await cache.match(request);

          if (fallback) return fallback;

          return new Response("Tile unavailable offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });

        }

      })

    );

  }

});