(()=>{
'use strict';
const previousFetch=window.fetch.bind(window);
const Q_CACHE='acs_visit_questions_v19';
const Q_AT='acs_visit_questions_v19_at';
const TTL=6*60*60*1000;
let warmPromise=null,loaderTimer=null;

function urlOf(input){try{if(typeof input==='string')return input;if(input instanceof URL)return input.href;if(input?.url)return input.url;if(input?.href)return input.href}catch{}return''}
function isQuestions(input){try{const s=urlOf(input);if(!s.includes('/acs-visita-api'))return false;const u=new URL(s,location.href);return u.searchParams.get('api')==='questions'}catch{return false}}
function jsonResponse(text,status=200){return new Response(text,{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-acs-question-cache':'v19'}})}
function cachedQuestions(){try{const text=sessionStorage.getItem(Q_CACHE),at=Number(sessionStorage.getItem(Q_AT)||0);if(text&&Date.now()-at<TTL)return text}catch{}return null}
function saveQuestions(text){try{const j=JSON.parse(text);if(Array.isArray(j?.rows)&&j.rows.length){sessionStorage.setItem(Q_CACHE,text);sessionStorage.setItem(Q_AT,String(Date.now()))}}catch{}}
function xhrGet(url,timeout=4200){return new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET',url,true);x.timeout=timeout;x.setRequestHeader('accept','application/json');x.onload=()=>{if(x.status>=200&&x.status<300)resolve(x.responseText);else reject(new Error('HTTP '+x.status))};x.onerror=()=>reject(new Error('Falha de rede'));x.ontimeout=()=>reject(new Error('Tempo excedido'));x.send()})}
async function loadQuestions(url){const cached=cachedQuestions();if(cached)return cached;if(warmPromise)return warmPromise;warmPromise=(async()=>{try{const text=await xhrGet(url);saveQuestions(text);return text}catch(e){console.warn('[ACS v19] perguntas em modo degradado:',e);return JSON.stringify({rows:[],degraded:true})}finally{warmPromise=null}})();return warmPromise}
window.fetch=async function(input,init){if(isQuestions(input)){const text=await loadQuestions(urlOf(input));return jsonResponse(text,200)}return previousFetch(input,init)};

function clearMain(){document.getElementById('loading')?.classList.add('hidden')}
function settle(){
 const visit=document.querySelector('.vf-overlay');
 if(visit){clearMain();document.getElementById('vf-loader')?.remove();document.getElementById('ev-loader')?.remove();if(loaderTimer){clearTimeout(loaderTimer);loaderTimer=null};return}
 const l=document.getElementById('vf-loader');
 if(l&&!loaderTimer){loaderTimer=setTimeout(()=>{loaderTimer=null;if(document.getElementById('vf-loader')&&!document.querySelector('.vf-overlay')){document.getElementById('vf-loader')?.remove();clearMain();const root=document.getElementById('toasts')||document.body,d=document.createElement('div');d.className='toast warn';d.textContent='A abertura da visita foi interrompida porque demorou demais. Toque em Iniciar visita novamente.';root.appendChild(d);setTimeout(()=>d.remove(),4200)}},7000)}
}
new MutationObserver(settle).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
setInterval(settle,900);
setTimeout(()=>{
 try{const key=localStorage.getItem('esf06_visit_key')||'';if(!key)return;const u=new URL('https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-visita-api');u.searchParams.set('api','questions');u.searchParams.set('k',key);loadQuestions(u.href).catch(()=>{})}catch{}
},1000);
window.__ACS_VISIT_UNBLOCK__='19';
})();
