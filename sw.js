// تطبيق دفتر المحاسبة — يحفظ ملفات البرنامج على الجهاز ليفتح بدون إنترنت
const CACHE = 'sahm-saas-test-v16';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // ملفات البرنامج: من الإنترنت أولًا (لتصل التحديثات)، ومن الجهاز عند انقطاع الاتصال
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
    return;
  }
  // مكتبات Firebase والخطوط: من الجهاز أولًا
  if (CDN.includes(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    })));
  }
  // طلبات قاعدة البيانات لا تمر من هنا — Firebase يدير الحفظ دون اتصال بنفسه
});
