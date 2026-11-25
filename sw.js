const V='sobrevoo-v1', TILES='sobrevoo-tiles-v1', MAXT=600;
const SHELL=['./','manifest.webmanifest','icon-192.png','icon-512.png'];
const LIBS=[
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&display=swap'
];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(V);
    await c.addAll(SHELL);
    await Promise.all(LIBS.map(async u=>{try{const r=await fetch(u,{mode:'no-cors'});await c.put(u,r);}catch(_){}}));
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k!==V&&k!==TILES) await caches.delete(k);
    await self.clients.claim();
  })());
});
async function trim(c){const k=await c.keys(); if(k.length>MAXT) for(const r of k.slice(0,k.length-MAXT)) await c.delete(r);}
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  // mosaicos do mapa (satélite e relevo): usa o salvo, senão baixa e guarda
  if(/arcgisonline\.com|elevation-tiles-prod/.test(url.host)){
    e.respondWith((async()=>{
      const c=await caches.open(TILES), hit=await c.match(req);
      if(hit) return hit;
      try{const r=await fetch(req); if(r&&(r.ok||r.type==='opaque')){c.put(req,r.clone()).then(()=>trim(c));} return r;}
      catch(err){return hit||Response.error();}
    })());
    return;
  }
  // página: tenta a internet primeiro (pega atualização), senão usa a salva
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{const r=await fetch(req); const c=await caches.open(V); c.put('./',r.clone()); return r;}
      catch(err){return (await caches.match('./'))||(await caches.match(req))||Response.error();}
    })());
    return;
  }
  // bibliotecas e arquivos do app: usa o salvo e atualiza em segundo plano
  e.respondWith((async()=>{
    const c=await caches.open(V), hit=await c.match(req);
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}).catch(()=>hit);
    return hit||net;
  })());
});
