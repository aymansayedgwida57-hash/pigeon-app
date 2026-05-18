const CACHE_NAME = 'pigeon-app-v1';
const urlsToCache = [
  '/',
  '/pigeon-app-admin-v2.html',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap'
];

// تثبيت السيرفس ووركر
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache opened');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// استرجاع الملفات - network first ثم cache
self.addEventListener('fetch', event => {
  // تجاهل طلبات Firebase (محتاجة اتصال دايماً)
  if (event.request.url.includes('firestore') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com/identitytoolkit') ||
      event.request.url.includes('anthropic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // حفظ نسخة في الكاش
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // لو فيه مشكلة في الاتصال، استخدم الكاش
        return caches.match(event.request);
      })
  );
});
