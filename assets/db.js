/**
 * SeitanYum Backend v3
 * PUBLIC reads = raw.githubusercontent.com (no token, works for all visitors)
 * WRITES = GitHub API with admin token (sessionStorage, set once by admin)
 * Google Drive = large product image storage
 */
const SY = (() => {
  'use strict';
  function esc(s){if(typeof s!=='string')return String(s??'');return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}
  const STATUSES=['pending','paid','accepted','ready','cancelled'];
  function cleanOrder(o){return{num:esc((o.num||'').slice(0,20)),name:esc((o.name||'').slice(0,60)),status:STATUSES.includes(o.status)?o.status:'pending',items:(o.items||[]).map(i=>({id:parseInt(i.id)||0,name:esc((i.name||'').slice(0,80)),emoji:esc((i.emoji||'').slice(0,8)),qty:Math.max(1,Math.min(99,parseInt(i.qty)||1)),price:Math.max(0,parseInt(i.price)||0),unit:esc((i.unit||'').slice(0,30))})),total:Math.max(0,parseInt(o.total)||0),ts:parseInt(o.ts)||Date.now(),createdAt:o.createdAt||new Date().toISOString(),updatedAt:o.updatedAt||null};}

  // Config in sessionStorage (cleared on tab close)
  const CK='_sy_cfg';
  function _cfg(){try{return JSON.parse(sessionStorage.getItem(CK)||'{}');}catch{return{};}}
  function _ek(){let k=sessionStorage.getItem('_sy_ek');if(!k){k=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem('_sy_ek',k);}return k;}
  function _obf(s){const k=_ek();return btoa(Array.from(s,(c,i)=>String.fromCharCode(c.charCodeAt(0)^parseInt(k.slice((i%8)*2,(i%8)*2+2),16))).join(''));}
  function _unobf(s){try{const k=_ek(),d=atob(s);return Array.from(d,(c,i)=>String.fromCharCode(c.charCodeAt(0)^parseInt(k.slice((i%8)*2,(i%8)*2+2),16))).join('');}catch{return '';}}

  function isConfigured(){const c=_cfg();return !!(c.t&&c.o&&c.r);}
  function getPublicConfig(){const c=_cfg();return{owner:c.o,repo:c.r,branch:c.b||'main',configured:isConfigured()};}
  function saveConfig(token,owner,repo,branch='main'){sessionStorage.setItem(CK,JSON.stringify({t:_obf(token),o:owner,r:repo,b:branch}));_cache={};}
  function clearConfig(){sessionStorage.removeItem(CK);_cache={};}
  function _tok(){const c=_cfg();return c.t?_unobf(c.t):'';}

  const API='https://api.github.com';
  function _gh(){return{'Authorization':`Bearer ${_tok()}`,'Accept':'application/vnd.github.v3+json','X-GitHub-Api-Version':'2022-11-28'};}

  // PUBLIC read via raw CDN — no token, works for every visitor
  async function publicRead(path){
    const c=_cfg();if(!c.o||!c.r)return null;
    const r=await fetch(`https://raw.githubusercontent.com/${c.o}/${c.r}/${c.b||'main'}/${path}?_=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)return null;return r.json();
  }

  // Authed read (admin only, for getting SHA before writes)
  async function ghGet(path){
    const c=_cfg();
    const r=await fetch(`${API}/repos/${c.o}/${c.r}/contents/${path}`,{headers:_gh(),cache:'no-store'});
    if(r.status===404)return null;if(!r.ok)throw new Error(`GH ${r.status}`);
    const d=await r.json();return{content:JSON.parse(atob(d.content.replace(/\n/g,''))),sha:d.sha};
  }
  async function ghPut(path,content,message,sha=null){
    const c=_cfg();
    const body={message,content:btoa(unescape(encodeURIComponent(JSON.stringify(content,null,2)))),branch:c.b||'main'};
    if(sha)body.sha=sha;
    const r=await fetch(`${API}/repos/${c.o}/${c.r}/contents/${path}`,{method:'PUT',headers:{..._gh(),'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||`PUT ${r.status}`);}
    return r.json();
  }

  // Rate-limited write queue
  let _last=0,_q=[],_busy=false;
  async function enqueue(fn){return new Promise((res,rej)=>{_q.push({fn,res,rej});_drain();});}
  async function _drain(){if(_busy||!_q.length)return;_busy=true;while(_q.length){const gap=2500-(Date.now()-_last);if(gap>0)await new Promise(r=>setTimeout(r,gap));const{fn,res,rej}=_q.shift();try{res(await fn());_last=Date.now();}catch(e){rej(e);}}_busy=false;}

  let _cache={};const TTL=8000;
  async function cached(file){const n=Date.now();if(_cache[file]&&n-_cache[file].ts<TTL)return _cache[file].d;const d=await publicRead(`data/${file}`);_cache[file]={d,ts:n};return d;}
  async function write(file,content,msg){return enqueue(async()=>{let sha=null;try{const c=await ghGet(`data/${file}`);if(c)sha=c.sha;}catch{};const res=await ghPut(`data/${file}`,content,msg,sha);_cache[file]={d:content,ts:Date.now()};return res;});}

  const LS={
    orders:()=>{try{return JSON.parse(localStorage.getItem('sy_orders')||'[]');}catch{return[];}},
    setO:o=>localStorage.setItem('sy_orders',JSON.stringify(o)),
    prods:()=>{try{return JSON.parse(localStorage.getItem('sy_products')||'null');}catch{return null;}},
    setP:p=>localStorage.setItem('sy_products',JSON.stringify(p)),
    settings:()=>{try{return JSON.parse(localStorage.getItem('sy_settings')||'null');}catch{return null;}},
    setS:s=>localStorage.setItem('sy_settings',JSON.stringify(s)),
  };

  const DP=[
    {id:1,emoji:'🍗',name:'Classic Seitan Strips',cat:'ready',tag:'Bestseller',desc:'Marinated wheat-gluten strips with smoky seasoning. Tender, chewy, satisfying.',price:2800,unit:'per pack',macros:['25g protein','Low fat','Soy-free'],driveId:null},
    {id:2,emoji:'🌯',name:'Seitan Wrap',cat:'ready',tag:'Ready to eat',desc:'Seitan strips, fresh greens, and tangy herb sauce in a whole-wheat wrap.',price:1800,unit:'each',macros:['18g protein','High fibre'],driveId:null},
    {id:3,emoji:'🍱',name:'Protein Bowl',cat:'high-protein',tag:'High Protein',desc:'Seitan over spiced rice with roasted vegetables and rich herb sauce.',price:3200,unit:'per bowl',macros:['30g protein','Balanced'],driveId:null},
    {id:4,emoji:'🥘',name:'Seitan Stew Pack',cat:'family',tag:'Family Size',desc:'Slow-cooked seitan in rich tomato-herb stew — feeds 2–3.',price:5500,unit:'family pack',macros:['60g protein','2–3 servings'],driveId:null},
    {id:5,emoji:'🍢',name:'Spicy Skewers',cat:'grilled',tag:'Grilled',desc:'Seitan cubes in suya-spice blend, grilled hot. 4 skewers.',price:2200,unit:'4 skewers',macros:['22g protein','Spicy'],driveId:null},
    {id:6,emoji:'🍔',name:'Seitan Burger',cat:'ready',tag:'New',desc:'Thick seitan patty, caramelised onion, lettuce, house sauce in brioche bun.',price:2600,unit:'each',macros:['26g protein','Filling'],driveId:null},
  ];
  const DS={bank:{name:'First Bank Nigeria',acct:'3145678902',acctName:'SeitanYum Ltd'},storeName:'SeitanYum',adminPass:'sy2025'};

  // Google Drive helpers
  const DRIVE={
    imgUrl(id){return id?`https://drive.google.com/thumbnail?id=${id}&sz=w600`:null;},
    async uploadImage(file,name,accessToken){
      const meta=JSON.stringify({name,mimeType:file.type});
      const form=new FormData();
      form.append('metadata',new Blob([meta],{type:'application/json'}));
      form.append('file',file);
      const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`},body:form});
      if(!r.ok)throw new Error(`Drive upload ${r.status}`);
      const d=await r.json();
      // make public
      await fetch(`https://www.googleapis.com/drive/v3/files/${d.id}/permissions`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({role:'reader',type:'anyone'})});
      return d.id;
    },
    getAccessToken(clientId){
      return new Promise((res,rej)=>{
        if(!window.google?.accounts?.oauth2){rej(new Error('Google Identity Services not loaded'));return;}
        google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'https://www.googleapis.com/auth/drive.file',callback:t=>{if(t.error)rej(new Error(t.error));else res(t.access_token);}}).requestAccessToken();
      });
    }
  };

  // Public API
  async function getOrders(){try{const d=await cached('orders.json');if(d){LS.setO(d);return d.map(cleanOrder);}}catch{}return LS.orders().map(cleanOrder);}
  async function saveOrders(orders){const c=orders.map(cleanOrder);LS.setO(c);if(!isConfigured())return{local:true};return write('orders.json',c,`📦 Orders — ${new Date().toISOString()}`);}
  async function addOrder(o){const orders=await getOrders();const c=cleanOrder(o);if(orders.find(x=>x.num===c.num))c.num+=`_${Date.now()}`;orders.push(c);return saveOrders(orders);}
  async function updateStatus(num,status){if(!STATUSES.includes(status))throw new Error('Bad status');const orders=await getOrders();const i=orders.findIndex(o=>o.num===esc(num));if(i===-1)throw new Error('Not found');orders[i].status=status;orders[i].updatedAt=new Date().toISOString();return saveOrders(orders);}
  async function deleteOrder(num){return saveOrders((await getOrders()).filter(o=>o.num!==esc(num)));}
  async function getProducts(){try{const d=await cached('products.json');if(d){LS.setP(d);return d;}}catch{}return LS.prods()||DP;}
  async function saveProducts(p){LS.setP(p);if(!isConfigured())return{local:true};return write('products.json',p,`🍽️ Menu — ${new Date().toISOString()}`);}
  async function getSettings(){try{const d=await cached('settings.json');if(d){LS.setS(d);return d;}}catch{}return LS.settings()||DS;}
  async function saveSettings(s){LS.setS(s);if(!isConfigured())return{local:true};return write('settings.json',s,`⚙️ Settings — ${new Date().toISOString()}`);}
  async function testConnection(){const c=_cfg();const r=await fetch(`${API}/repos/${c.o}/${c.r}`,{headers:_gh()});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
  async function initRepo(){for(const[f,d,m]of[['orders.json',[],`🚀 Init`],['products.json',DP,`🚀 Init`],['settings.json',DS,`🚀 Init`]]){const ex=await ghGet(`data/${f}`).catch(()=>null);if(!ex)await ghPut(`data/${f}`,d,m);}return true;}
  function bustCache(){_cache={};}

  return{esc,cleanOrder,isConfigured,getPublicConfig,saveConfig,clearConfig,bustCache,getOrders,saveOrders,addOrder,updateStatus,deleteOrder,getProducts,saveProducts,getSettings,saveSettings,testConnection,initRepo,DRIVE,DP,DS};
})();
window.SY=SY;
