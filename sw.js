// Service worker de Cerveau : l'appli s'ouvre même hors ligne.
// Réseau d'abord (les mises à jour arrivent tout de suite), le cache sert de secours.
// Les appels à l'API GitHub ne passent jamais par ici.
const CACHE = "cerveau-v1.1.0";
const SHELL = ["./", "./index.html", "./style.css", "./app.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("cerveau-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const key = url.origin + url.pathname;
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return res; })
      .catch(() => caches.match(key).then(hit => hit || (req.mode === "navigate" ? caches.match(new URL("./", self.registration.scope).href) : Response.error())))
  );
});
