// Service Worker der Website (PWA, offline ab v0.10.0). NICHT Teil des Ein-Datei-Builds
// (steht absichtlich nicht in tests/dateien.js); build.py kopiert ihn nach dist/sw.js.
// Gespeichert werden NUR die App-Dateien (Seite, Manifest, Symbole) – nie Eingaben.
// Seite: erst Netz (immer die neueste Fassung), ohne Netz die gespeicherte Kopie.
// Symbole/Manifest: erst Speicher, sonst Netz.
const CACHE = 'abschluss-0.11.1';
const DATEIEN = ['./', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/logo.svg'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys()
        .then(namen => Promise.all(namen.filter(n => n.startsWith('abschluss-') && n !== CACHE).map(n => caches.delete(n))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    if (req.mode === 'navigate') {
        e.respondWith(fetch(req)
            .then(antwort => {
                if (antwort.ok) {
                    const kopie = antwort.clone();
                    caches.open(CACHE).then(c => c.put('./', kopie));
                }
                return antwort;
            })
            .catch(() => caches.match('./')));
        return;
    }
    e.respondWith(caches.match(req).then(t => t || fetch(req)));
});
