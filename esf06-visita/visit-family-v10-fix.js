(()=>{
'use strict';
const API='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-visita-api';
const rawFetch=window.fetch.bind(window),checked=new Set();
const key=()=>localStorage.getItem('esf06_visit_key')||new URL(location.href).searchParams.get('k')||'';
const birthDays=v=>{if(!v)return null;const b=new Date(String(v).slice(0,10)+'T12:00:00'),n=new Date();n.setHours(12,0,0,0);return Math.floor((n-b)/86400000)};
async function person(id){const u=new URL(API);u.searchParams.set('api','person');u.searchParams.set('id',id);u.searchParams.set('k',key());const r=await rawFetch(u,{cache:'no-store'});if(!r.ok)return null;return (await r.json()).person||null}
async function correctAutoNewborn(){for(const b of document.querySelectorAll('[data-vf-chip="follow"][data-value="Recém-nascido"].on')){const id=b.dataset.member;if(!id||checked.has(id))continue;checked.add(id);const p=await person(id).catch(()=>null),d=birthDays(p?.birth_date);if(d!=null&&d>28&&document.body.contains(b)&&b.classList.contains('on'))b.click()}}
const obs=new MutationObserver(()=>setTimeout(correctAutoNewborn,30));obs.observe(document.documentElement,{childList:true,subtree:true});
window.fetch=async function(input,init={}){try{const url=typeof input==='string'?input:input?.url||'';if((init.method||'GET').toUpperCase()==='POST'&&url.includes('acs-visita-api')&&url.includes('api=save_form')&&init.body){const body=JSON.parse(init.body),off=body?.answers?.official_visit;if(off?.motives?.includes('Visita periódica'))off.outcome=body.visit_result;if(Array.isArray(off?.followup)&&off.followup.includes('Recém-nascido')&&body.person_id){const p=await person(body.person_id).catch(()=>null),d=birthDays(p?.birth_date);if(d!=null&&d>28)off.followup=off.followup.filter(x=>x!=='Recém-nascido')}init={...init,body:JSON.stringify(body)}}}catch(e){console.warn('Ajuste neonatal/familiar não aplicado',e)}return rawFetch(input,init)};
})();
