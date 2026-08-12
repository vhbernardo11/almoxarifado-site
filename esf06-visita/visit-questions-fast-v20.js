(()=>{
'use strict';
const upstream=window.fetch.bind(window);
const CACHE_KEY='acs_visit_questions_v20';
const CACHE_AT='acs_visit_questions_v20_at';
const TTL=6*60*60*1000;
let memory=null;
let warming=null;

function urlOf(input){
  try{
    if(typeof input==='string') return input;
    if(input instanceof URL) return input.href;
    if(input?.url) return input.url;
    if(input?.href) return input.href;
  }catch{}
  return '';
}
function isQuestions(input){
  try{
    const s=urlOf(input);
    if(!s.includes('/acs-visita-api')) return false;
    return new URL(s,location.href).searchParams.get('api')==='questions';
  }catch{return false}
}
function makeResponse(text){
  return new Response(text,{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-acs-fast-questions':'v20'}});
}
function readCache(){
  if(memory) return memory;
  try{
    const text=sessionStorage.getItem(CACHE_KEY);
    const at=Number(sessionStorage.getItem(CACHE_AT)||0);
    if(text&&Date.now()-at<TTL){memory=text;return text}
  }catch{}
  return null;
}
function saveCache(text){
  try{
    const j=JSON.parse(text);
    if(!Array.isArray(j?.rows)||!j.rows.length) return;
    memory=text;
    sessionStorage.setItem(CACHE_KEY,text);
    sessionStorage.setItem(CACHE_AT,String(Date.now()));
    window.dispatchEvent(new CustomEvent('acs:questions-ready',{detail:{count:j.rows.length}}));
  }catch{}
}
async function warm(url){
  const hit=readCache();
  if(hit) return hit;
  if(warming) return warming;
  warming=(async()=>{
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),4500);
    try{
      const r=await upstream(url,{cache:'no-store',signal:ctl.signal});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const text=await r.text();
      saveCache(text);
      return readCache()||text;
    }catch(e){
      console.warn('[ACS v20] perguntas serão carregadas depois:',e);
      return null;
    }finally{
      clearTimeout(timer);
      warming=null;
    }
  })();
  return warming;
}

window.fetch=async function(input,init){
  if(!isQuestions(input)) return upstream(input,init);
  const hit=readCache();
  if(hit) return makeResponse(hit);

  const pending=warm(urlOf(input));
  const text=await Promise.race([
    pending,
    new Promise(resolve=>setTimeout(()=>resolve(null),120))
  ]);
  if(text) return makeResponse(text);

  // A entrevista nunca fica bloqueada pelas perguntas complementares.
  return makeResponse(JSON.stringify({rows:[],degraded:true,pending_questions:true}));
};

setTimeout(()=>{
  try{
    const k=localStorage.getItem('esf06_visit_key')||new URL(location.href).searchParams.get('k')||'';
    if(!k||readCache()) return;
    const u=new URL('https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-visita-api');
    u.searchParams.set('api','questions');u.searchParams.set('k',k);
    warm(u.href).catch(()=>{});
  }catch{}
},150);

window.ACSVisitQuestionsFast={
  refresh(){memory=null;try{sessionStorage.removeItem(CACHE_KEY);sessionStorage.removeItem(CACHE_AT)}catch{}},
  get ready(){return !!readCache()}
};
})();
