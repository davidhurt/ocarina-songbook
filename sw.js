// Offline cache for the Ocarina Songbook.
const CACHE = "songbook-v1";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first for the page (so updates arrive), cache first for everything else (fonts, icons).
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate";
  e.respondWith(
    isPage
      ? fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
          .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
      : caches.match(req).then(hit => hit || fetch(req).then(r => {
          if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return r;
        }))
  );
});
