/**
 * TURA service worker.
 *
 * The app is the sort of thing you open in a valley with no signal, so offline
 * is a requirement rather than a nicety. Four caching strategies:
 *
 *   app shell      precached on install, so a cold start works offline
 *   build assets   cache-first — /_next/static filenames are content-hashed
 *   navigations    network-first, falling back to cache, then /offline
 *   map tiles      cache-first with a bounded cache, so revisited areas render
 *
 * Bump CACHE_VERSION to invalidate everything on the next deploy.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `tura-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `tura-assets-${CACHE_VERSION}`;
const PAGE_CACHE = `tura-pages-${CACHE_VERSION}`;
const TILE_CACHE = `tura-tiles-${CACHE_VERSION}`;

const CURRENT_CACHES = new Set([
  SHELL_CACHE,
  ASSET_CACHE,
  PAGE_CACHE,
  TILE_CACHE,
]);

/** Roughly a county's worth of terrain at planning zoom levels. */
const MAX_TILES = 900;

const SHELL_URLS = [
  "/",
  "/calendar",
  "/budget",
  "/journal",
  "/book",
  "/roulette",
  "/stats",
  "/settings",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const TILE_HOSTS = [
  "tile.opentopomap.org",
  "server.arcgisonline.com",
  "tile-cyclosm.openstreetmap.fr",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one unreachable URL cannot fail the whole install.
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("tura-") && !CURRENT_CACHES.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never interfere with anything that changes state on the server.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (TILE_HOSTS.some((host) => url.hostname.endsWith(host))) {
    event.respondWith(tileStrategy(request));
    return;
  }

  // Leave every other cross-origin request alone.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // RSC payloads and everything else same-origin: fresh when possible.
  event.respondWith(networkFirst(request, PAGE_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function navigationStrategy(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await caches.match(request, { ignoreSearch: true }));
    if (cached) return cached;

    const offline = await caches.match("/offline");
    if (offline) return offline;

    return new Response(
      "<!doctype html><meta charset=utf-8><title>Offline</title><p>TURA is offline and this page has not been visited before.",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    // Tile servers do not send CORS headers on every route; an opaque response
    // still renders in a canvas-free raster layer and is worth caching.
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
      void trimTileCache();
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

/** Oldest-first eviction; Cache Storage preserves insertion order. */
async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  const excess = keys.length - MAX_TILES;
  if (excess <= 0) return;

  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}
