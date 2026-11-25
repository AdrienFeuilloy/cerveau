// Service worker de Cerveau : l'appli s'ouvre même hors ligne.
// Réseau d'abord (les mises à jour arrivent tout de suite), le cache sert de secours.
// Les appels à l'API GitHub ne passent jamais par ici.
const CACHE = "cerveau-v2.4.2";
const SHELL = ["./", "./index.html", "./style.css", "./app.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./fonts/share-tech-mono.woff", "./fonts/orbitron.woff"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("cerveau-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Partage depuis une autre appli (« Partager → Cerveau ») : textes, liens et photos arrivent ici,
// sont gardés le temps d'ouvrir l'appli, qui les reprend dans « Capturer ».
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open("cerveau", 1); r.onupgradeneeded = () => { for (const s of ["share", "media", "pending"]) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function keepShare(req) {
  const fd = await req.formData();
  const files = fd.getAll("files").filter(f => f && typeof f !== "string" && f.size);
  const d = await idb();
  await new Promise((res, rej) => { const t = d.transaction("share", "readwrite"); t.objectStore("share").put({ title: fd.get("title") || "", text: fd.get("text") || "", url: fd.get("url") || "", files, at: Date.now() }, "last"); t.oncomplete = res; t.onerror = () => rej(t.error); });
  return Response.redirect(new URL("./?share=1", self.registration.scope).href, 303);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method === "POST" && new URL(req.url).pathname.endsWith("/share-target")) { e.respondWith(keepShare(req).catch(() => Response.redirect(new URL("./", self.registration.scope).href, 303))); return; }
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

// Notifications envoyées par l'automate GitHub (rappels, résumé du matin, rendez-vous)
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Cerveau", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Cerveau", { body: d.body || "", tag: d.tag || undefined, renotify: !!d.tag, icon: "icon-192.png", badge: "icon-192.png", data: { url: d.url || "./" }, vibrate: [60, 40, 60] }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); return c ? c.focus() : self.clients.openWindow(url); }));
});
