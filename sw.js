/**
 * ランログ v2 - Service Worker
 * 方式: ネットワークファースト(常に最新版を優先し、オフライン時のみキャッシュで起動)
 * 更新時は CACHE_NAME のバージョン番号を上げること
 */
const CACHE_NAME = "runlog-v2";
const ASSETS = ["./runlog.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

/* インストール時: 基本ファイルを事前キャッシュ */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

/* 有効化時: 旧バージョンのキャッシュを削除 */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 取得時: ネットワーク優先。成功したら同一オリジンのGETをキャッシュ更新、失敗時はキャッシュ */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // 地図タイル・GAS通信はキャッシュ対象外(常にネットワーク)
  if (url.origin !== location.origin) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
