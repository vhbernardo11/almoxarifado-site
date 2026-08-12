(()=>{
'use strict';
const FAST='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-patient-fast';
const previousFetch=window.fetch.bind(window);
let cache=null,cacheAt=0,cachePromise=null;
const TTL=5*60*1000;
const key=()=>localStorage.getItem('esf06_visit_key')||new URL(location.href).searchParams.get('k')||'';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const years=b=>{if(!b)return null;const d=new Date(String(b).slice(0,10)+'T12:00:00'),n=new Date();let a=n.getFullYear()-d.getFullYear();const m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))a--;return a};
const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function urlString(input){try{if(typeof input==='string')return input;if(input instanceof URL)return input.href;if(input?.url)return input.url;if(input?.href)return input.href}catch{}return''}
function matchesGroup(r,group){if(group==='children'){const a=years(r.birth_date);return a!==null&&a<2}if(group==='pregnant')return !!r.flags?.gestante;return true}
function filterRows(rows,u){const q=norm(u.searchParams.get('q')||''),group=u.searchParams.get('group')||'all',limit=Math.min(120,Math.max(1,Number(u.searchParams.get('limit')||80)));return rows.filter(r=>matchesGroup(r,group)&&(!q||norm(`${r.full_name||''} ${r.cpf||''} ${r.cns||''} ${r.family_code||''} ${r.street||''} ${r.number||''}`).includes(q))).slice(0,limit)}
async function fastGet(api,params={}){const u=new URL(FAST);u.searchParams.set('api',api);u.searchParams.set('k',key());Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));const c=new AbortController(),to=setTimeout(()=>c.abort(),8000);try{const r=await previousFetch(u,{cache:'no-store',signal:c.signal});if(!r.ok){let msg='Falha ao carregar dados';try{msg=(await r.json()).error||msg}catch{}throw new Error(msg)}return await r.json()}finally{clearTimeout(to)}}
async function loadAll(force=false){if(!force&&cache&&Date.now()-cacheAt<TTL)return cache;if(cachePromise)return cachePromise;cachePromise=(async()=>{const j=await fastGet('list');cache=j.rows||[];cacheAt=Date.now();try{sessionStorage.setItem('acs_patient_cache_at',String(cacheAt))}catch{}return cache})();try{return await cachePromise}finally{cachePromise=null}}
window.fetch=async function(input,init){const s=urlString(input);if(s.includes('/acs-visita-api')){try{const u=new URL(s),api=u.searchParams.get('api');if(api==='patients')return response({rows:filterRows(await loadAll(),u)});if(api==='person'){const id=u.searchParams.get('id')||'';if(id){window.__ACS_ACTIVE_PERSON_ID=id;try{sessionStorage.setItem('acs_active_person_id',id)}catch{}}const j=await fastGet('detail',{id});return response(j)}}catch(e){console.warn('[ACS Fast] usando API principal como contingência:',e)}}return previousFetch(input,init)};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-person],[data-visit],[data-due-visit],[data-route-visit]');const id=b?.dataset?.person||b?.dataset?.visit||b?.dataset?.dueVisit||b?.dataset?.routeVisit;if(id&&/^[0-9a-f-]{36}$/i.test(id)){window.__ACS_ACTIVE_PERSON_ID=id;try{sessionStorage.setItem('acs_active_person_id',id)}catch{}}},true);
setTimeout(()=>{if(key())loadAll().catch(()=>{})},700);
window.ACSPatientFast={refresh:()=>loadAll(true),clear:()=>{cache=null;cacheAt=0},get activePersonId(){return window.__ACS_ACTIVE_PERSON_ID||sessionStorage.getItem('acs_active_person_id')||null}};
})();
