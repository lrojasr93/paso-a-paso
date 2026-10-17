/* Paso a Paso — funciona sin internet una vez abierta */
const CACHE = 'pasoapaso-v3';
const ARCHIVOS = [
  './', 'index.html', 'familia.html', 'css/styles.css', 'manifest.webmanifest',
  'js/core.js', 'js/sim.js',
  'js/lecciones/nivel1-toques.js', 'js/lecciones/nivel2-llamadas.js',
  'js/lecciones/nivel3-whatsapp.js', 'js/lecciones/nivel4-estafas.js', 'js/lecciones/nivel5-banco.js', 'js/lecciones/proximamente.js',
  'icons/icono.svg', 'icons/icono-180.png', 'icons/icono-192.png', 'icons/icono-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (para recibir mejoras), y si no hay internet, lo guardado
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request))
  );
});
