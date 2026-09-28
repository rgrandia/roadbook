/**
 * Minimal, dependency-free service worker for offline app-shell caching.
 *
 * Deliberately NOT a precache-manifest / Workbox setup: this project's build
 * runs on Turbopack (both `next dev` and `next build`), and next-pwa-style
 * plugins hook into Next's Webpack config - their Turbopack compatibility is
 * unproven, and a silently-broken production build is worse than a simpler
 * service worker. Instead this uses runtime caching (stale-while-revalidate)
 * for same-origin GET requests: it never needs to know Next's hashed chunk
 * filenames ahead of time, so it's correct regardless of build tool, and it
 * naturally becomes useful once someone has actually loaded the app once.
 *
 * Deliberately does NOT touch cross-origin requests (e.g. the map's
 * OpenStreetMap tiles) - those are left to the network as normal.
 */

const CACHE_NAME = "roadbook-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
