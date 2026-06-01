// Service Worker для PWA
const CACHE_NAME = 'log-entropy-v1.0.1';

// Файлы для кеширования (убираем все внешние ссылки, оставляем только локальные)
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './user.html',
  './admin.html',
  './archive.html',
  './error-log.html',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кеширование файлов');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((err) => {
        console.error('[SW] Ошибка кеширования:', err);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Удаление старого кеша:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Перехват fetch-запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Пропускаем запросы к внешним API
  if (url.hostname !== location.hostname) {
    return;
  }
  
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('[SW] Ошибка:', error);
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Офлайн-режим: контент недоступен', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});