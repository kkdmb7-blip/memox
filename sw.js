// ── 포르투나 Service Worker ──────────────────────────────────
const CACHE_NAME = 'fortuna-cache-1.7.0';
// self.registration.scope 기반 상대경로 (GitHub Pages 서브경로 대응)
const BASE = self.registration.scope;
const STATIC_ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json', BASE + 'icon.svg'];

// ── INSTALL: 정적 자원 캐시 (개별 add로 하나 실패해도 나머지 캐시) ─
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: 이전 캐시 정리 ─────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: 요청 전략 분기 ────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // 외부 API (Supabase, Anthropic, OpenAI 등) → Network Only
  if (!url.origin.includes(self.location.hostname)) {
    e.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // 정적 자원 → Cache First, 없으면 네트워크 후 캐시 갱신
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

// ── BACKGROUND SYNC: 오프라인 중 실패한 채팅 재전송 ──────────
self.addEventListener('sync', e => {
  if (e.tag === 'chat-retry') {
    e.waitUntil(retryChatMessages());
  }
});

async function retryChatMessages() {
  const db = await openDB();
  const pending = await getAllPending(db);
  for (const item of pending) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      if (res.ok) await deleteItem(db, item.id);
    } catch (_) {
      // 다음 sync 때 재시도
    }
  }
}

// ── IndexedDB helper (오프라인 큐) ───────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fortuna-queue', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

function deleteItem(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    const req = tx.objectStore('pending').delete(id);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}

// ── 백그라운드 Keep-Alive (Periodic Sync) ────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'keep-alive') {
    e.waitUntil(Promise.resolve());
  }
});

// ── PUSH 알림 (향후 확장용) ──────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || '포르투나', {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'fortuna-push',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tag = e.notification.tag;
  const targetUrl = (tag === 'fortuna-daily') ? '/?daily=1' : '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      // 이미 열린 창이 있으면 포커스 + 메시지
      const existing = cs.find(w => w.url.includes(self.location.hostname) && 'focus' in w);
      if (existing) {
        existing.focus();
        if (tag === 'fortuna-daily') existing.postMessage({ type: 'OPEN_DAILY_CARD' });
        return;
      }
      // 닫혀있으면 ?daily=1 파라미터로 새로 열기
      return clients.openWindow(targetUrl);
    })
  );
});
