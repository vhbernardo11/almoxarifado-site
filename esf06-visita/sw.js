const CACHE='esf06-shell-v39';
const ASSETS=[
'./','./index.html','./manifest.webmanifest?v=1','./styles.css?v=3','./theme-v39.css?v=39',
'./app.js?v=3','./patient-performance-v15.js?v=15','./patient-standalone-v22.js?v=23','./visit-standalone-v21.js?v=23','./frontend-stability-v16.js?v=33','./shell-v39.js?v=39',
'./planner-v32.js?v=32','./route-complete-guard.js?v=5','./route-smart.css?v=9','./route-actions-v24.css?v=31','./route-actions-v24.js?v=31','./route-click-v30.js?v=30','./route-history-v26.css?v=26','./route-history-v26.js?v=26',
'./home-referrals-v27.css?v=36','./home-referrals-v27.js?v=36','./data-drilldown-v11.css?v=36','./data-drilldown-v11.js?v=36','./reports-v14.css?v=14','./reports-v14.js?v=14','./route-geo-v38.js?v=38','./ops-v38.css?v=38','./ops-v38.js?v=38'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});