/* Service worker của "Một đời để sống".
 * Mục đích: cho phép cài game lên màn hình chính và mở lại khi mất mạng.
 * Chiến lược: mạng trước, bộ nhớ đệm sau. Có mạng thì luôn lấy bản mới nhất nên không bao giờ bị kẹt bản cũ;
 * mất mạng thì dùng bản đã tải lần trước. version.json không bao giờ được lưu đệm để biết có bản mới. */
const CACHE = 'mot-doi-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
/* Trang vừa tải xong gửi danh sách tài nguyên đã dùng để lần sau mở được cả khi mất mạng. */
self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const raw of event.data.urls.slice(0, 400)) {
      try {
        const url = new URL(raw, self.location.origin);
        if (url.origin !== self.location.origin || /version\.json$|sw\.js$|\.(ogg|mp3|mp4|webm)$/i.test(url.pathname)) continue;
        if (await cache.match(url.href)) continue;
        const res = await fetch(url.href);
        if (res.ok && res.type === 'basic') await cache.put(url.href, res);
      } catch (error) { /* bỏ qua tệp lỗi */ }
    }
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) return;
  if (req.headers.has('range')) return; // âm thanh/video cần Range, để trình duyệt tự xử lý
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (error) {
      const hit = await cache.match(req) || (req.mode === 'navigate' ? await cache.match('./index.html') || await cache.match('./') : undefined);
      if (hit) return hit;
      throw error;
    }
  })());
});
