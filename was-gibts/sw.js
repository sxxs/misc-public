const C="wasgibts-2";
const FILES=["./","./index.html","./dishes.json","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
/* Network-first: Änderungen an dishes.json und index.html kommen so beim
   nächsten Laden mit Netz automatisch an; offline liefert der Cache. */
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));}
    return res;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>{
    if(r)return r;
    if(e.request.mode==="navigate")return caches.match("./index.html");
    return Response.error();
  })));
});
