"use strict";
const CACHE="crissalyn-web-release-20261104-v2";
const ASSETS=["./","./index.html","./styles.css","./elite.css","./security.js","./app.js","./icon.svg","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./manifest.webmanifest"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("crissalyn-elite-")&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html"))));
});
