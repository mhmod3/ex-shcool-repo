/*
 * Service worker لبوابة الطالب (النسخة الثابتة).
 * الهدف: تثبيت PWA صحيح وتشغيل الصفحة دون انترنت — البيانات كلها
 * fixtures داخل الصفحة فلا حاجة لأي منطق شبكة معقد.
 * استراتيجية cache-first للأصول نفس الأصل، مع تنظيف caches القديمة.
 */
var CACHE = "madrasati-portal-v1";
var ASSETS = [
    "./",
    "./index.html",
    "./css/app.css",
    "./js/app.js",
    "./manifest.webmanifest",
    "./images/icon-32.png",
    "./images/icon-192.png",
    "./images/icon-512.png",
    "./images/logo.png",
];

self.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(ASSETS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (e) {
    var req = e.request;
    if (req.method !== "GET") return;
    var url = new URL(req.url);
    if (url.origin !== location.origin) return; // الخطوط من Google Fonts تُترك للشبكة
    e.respondWith(
        caches.match(req, { ignoreSearch: true }).then(function (hit) {
            if (hit) return hit;
            return fetch(req).then(function (res) {
                if (res.ok && res.type === "basic") {
                    var copy = res.clone();
                    caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
                }
                return res;
            }).catch(function () {
                // fallback لتنقل بلا اتصال
                if (req.mode === "navigate") return caches.match("./index.html");
            });
        })
    );
});
