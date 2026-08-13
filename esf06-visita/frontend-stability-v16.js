(()=>{
'use strict';
const MAX_WAIT=8000;
const timers=new WeakMap();
function toast(msg,type='warn'){
  const root=document.getElementById('toasts')||document.body;
  const d=document.createElement('div');
  d.className='toast '+type;
  d.textContent=msg;
  root.appendChild(d);
  setTimeout(()=>d.remove(),4200);
}
function clearMain(){document.getElementById('loading')?.classList.add('hidden')}
function clearVisit(){document.getElementById('vf-loader')?.remove();document.getElementById('ev-loader')?.remove()}
function settle(){
  if(document.querySelector('.detail-name')) clearMain();
  if(document.querySelector('.vf-overlay')){document.getElementById('vf-loader')?.remove();clearMain()}
  if(document.querySelector('.ev-overlay')){document.getElementById('ev-loader')?.remove();clearMain()}
}
function arm(el){
  if(!el||timers.has(el))return;
  const t=setTimeout(()=>{
    timers.delete(el);
    if(!document.documentElement.contains(el))return;
    if(el.id==='loading')el.classList.add('hidden');else el.remove();
    const ready=!!document.querySelector('.detail-name,.vf-overlay,.ev-overlay');
    if(!ready)toast('O carregamento demorou além do esperado e foi interrompido. Tente abrir novamente.','warn');
  },MAX_WAIT);
  timers.set(el,t);
}
function scan(){
  settle();
  const main=document.getElementById('loading');
  if(main&&!main.classList.contains('hidden'))arm(main);
  arm(document.getElementById('vf-loader'));
  arm(document.getElementById('ev-loader'));
}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('pageshow',()=>{clearMain();clearVisit();setTimeout(scan,0)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(scan,0)});
window.addEventListener('error',()=>setTimeout(scan,0));
window.addEventListener('unhandledrejection',()=>setTimeout(scan,0));
setInterval(settle,1200);
scan();
window.ACSFrontendStability={scan,settle,clearLoaders:()=>{clearMain();clearVisit()}};

const ps=document.createElement('script');ps.src='./planner-v32.js?v=32';ps.defer=true;document.head.appendChild(ps);
const st=document.createElement('style');st.textContent='.pv32-tabs{display:grid;grid-template-columns:repeat(4,1fr);background:#fff}.pv32-tabs button{border:0;background:#fff;padding:14px 6px;font-weight:800;color:#6b7890}.pv32-tabs button.on{color:#079887;border-bottom:3px solid #079887}.pv32-card,.pv32-family,.pv32-route{background:#fff;border:1px solid #dfe6ee;border-radius:18px;padding:15px;margin-bottom:13px}.pv32-card-title{font-size:19px;font-weight:900;margin-bottom:12px}.pv32-loading,.pv32-empty,.pv32-info{padding:16px;border-radius:14px;background:#f5f7fa;color:#6c798c}.pv32-smart{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border:1px solid #bfe8e2;background:#f1fffc;border-radius:16px;margin:12px 0}.pv32-smart strong,.pv32-smart small,.pv32-family strong,.pv32-family small,.pv32-route strong,.pv32-route small{display:block}.pv32-smart small,.pv32-family small,.pv32-route small{color:#6b788b;margin-top:4px}.pv32-preview{border:1px solid #d7e0e8;border-radius:16px;padding:13px;margin:12px 0}.pv32-preview-head,.pv32-row,.pv32-family{display:flex;justify-content:space-between;gap:12px}.pv32-suggestion{display:flex;gap:10px;padding:11px 0;border-top:1px solid #e8edf2}.pv32-reasons,.pv32-flagline{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pv32-reasons span,.pv32-flagline span,.pv32-origin{font-size:12px;padding:5px 8px;border-radius:999px;background:#edf5f3;color:#176f63}.pv32-origin{display:inline-block;margin-top:8px}.pv32-route{display:flex;gap:12px}.pv32-order{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#e7f6f3;color:#087f70;font-weight:900}.pv32-route-main{flex:1}.pv32-route-actions,.pv32-actions-top,.pv32-mini-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.pv32-route-actions .btn{flex:1 1 120px}.pv32-insert,.pv32-date{width:100%;box-sizing:border-box;margin-bottom:10px}.pv32-insert{padding:12px;border:1px solid #6ddacb;background:#ecfffb;color:#087f70;border-radius:14px}.pv32-date{padding:12px;border:1px solid #d7e0e8;border-radius:14px}.pv32-cal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.pv32-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.pv32-cal-grid>b{text-align:center;font-size:12px;color:#7b8798}.pv32-day{min-height:44px;border:1px solid #e0e6ed;background:#fff;border-radius:10px}.pv32-day.sel{background:#e9f9f6;color:#087f70;font-weight:900}.pv32-day.today{border-color:#0aa391}.pv32-day i{font-style:normal;font-size:0;margin-left:4px}.pv32-day i:after{content:"•";font-size:12px;color:#0aa391}.pv32-section-label{font-size:12px;font-weight:900;color:#7b8798;margin:17px 0 7px}.pv32-row{padding:11px 0;border-top:1px solid #e8edf2}.pv32-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.pv32-chips button{border:1px solid #d7e0e8;background:#fff;border-radius:999px;padding:8px 11px;font-weight:800}.pv32-chips button.on{background:#e6f7f4;color:#087f70}.pv32-back{position:fixed;inset:0;z-index:99999;background:rgba(5,16,34,.52);display:flex;align-items:center;justify-content:center;padding:16px}.pv32-modal{width:min(100%,520px);max-height:88vh;overflow:auto;background:#fff;border-radius:22px;padding:20px;position:relative}.pv32-modal input,.pv32-modal select,.pv32-modal textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #d9e1e8;border-radius:12px}.pv32-modal label{display:block;font-weight:800;margin:11px 0 5px}.pv32-close{position:absolute;right:13px;top:12px;border:0;border-radius:50%;width:34px;height:34px}.pv32-person{display:block;width:100%;text-align:left;border:1px solid #e1e7ed;background:#fff;border-radius:11px;padding:10px;margin:6px 0}.pv32-results{max-height:250px;overflow:auto}.pv32-picked{padding:10px;background:#eaf8f5;border-radius:11px;margin:9px 0}.pv32-toast{position:fixed;left:18px;right:18px;bottom:92px;z-index:100000;background:#0f766e;color:#fff;padding:12px 15px;border-radius:13px;font-weight:800}.pv32-toast.err{background:#b42318}.pv32-toast.warn{background:#9a6700}.btn.warn{background:#fff7eb!important;color:#9a5a00!important}.btn.danger{background:#fff1f1!important;color:#b42318!important}.block{width:100%}@media(max-width:620px){.pv32-smart,.pv32-family,.pv32-row{flex-direction:column}.pv32-tabs button{font-size:12px}}';document.head.appendChild(st);
})();

(()=>{'use strict';
const HOME='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-home-suggestions';
const PLAN='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-planner-v32';
const key=()=>new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=v=>String(v||'').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase());
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
async function call(base,api,opts={}){const u=new URL(base);u.searchParams.set('api',api);u.searchParams.set('k',key());Object.entries(opts.params||{}).forEach(([k,v])=>u.searchParams.set(k,String(v)));const r=await fetch(u,{method:opts.method||'GET',headers:opts.body?{'content-type':'application/json'}:undefined,body:opts.body?JSON.stringify(opts.body):undefined,cache:'no-store'}),j=await r.json().catch(()=>({error:'Falha'}));if(!r.ok)throw new Error(j.error||'Erro');return j}
function plan(personId,reason){const b=document.createElement('div');b.className='pv32-back';b.innerHTML=`<div class="pv32-modal"><button class="pv32-close" data-close>×</button><h3>Agendar visita de encaminhamento</h3><label>Data</label><input id="pv32-ref-date" type="date" value="${today()}"><label>Motivo</label><input id="pv32-ref-reason" value="${esc(reason||'Encaminhamento')}"><button class="btn teal block" id="pv32-ref-save">Adicionar ao roteiro</button></div>`;document.body.appendChild(b);const close=()=>b.remove();b.querySelector('[data-close]').onclick=close;b.onclick=e=>{if(e.target===b)close()};b.querySelector('#pv32-ref-save').onclick=async()=>{try{await call(PLAN,'agenda_add',{method:'POST',body:{person_id:personId,date:b.querySelector('#pv32-ref-date').value,reason:b.querySelector('#pv32-ref-reason').value,priority:'atencao',origin:'referral'}});close();alert('Visita de encaminhamento adicionada por você.')}catch(e){alert(e.message)}}}
let busy=false,last=0;
async function patch(){if(busy||Date.now()-last<1800)return;const root=document.querySelector('#pv32-body');if(!root||!document.querySelector('[data-pv32-tab="calendar"].on')||root.querySelector('#pv32-undated'))return;busy=true;last=Date.now();try{const r=await call(HOME,'referrals'),rows=(r.rows||[]).filter(x=>!x.due_date&&!x.appointment_at);if(!rows.length)return;const box=document.createElement('div');box.id='pv32-undated';box.className='pv32-card';box.innerHTML=`<div class="pv32-card-title">📌 Pendências e encaminhamentos sem data</div><div class="pv32-info">Não entram no roteiro sozinhos. Só viram visita quando você tocar em Agendar visita.</div>${rows.map(x=>`<div class="pv32-row"><div><strong>${esc(title(x.full_name||x.person_name||'Pessoa não vinculada'))}</strong><small>${esc(x.title||'Pendência')}</small>${x.notes?`<small>${esc(x.notes)}</small>`:''}</div>${x.person_id?`<button class="btn teal" data-ref-plan="${x.person_id}" data-reason="${esc(x.title||'Encaminhamento')}">Agendar visita</button>`:'<span class="pv32-origin">Não vinculado</span>'}</div>`).join('')}`;root.appendChild(box);box.querySelectorAll('[data-ref-plan]').forEach(b=>b.onclick=()=>plan(b.dataset.refPlan,b.dataset.reason))}catch(e){}finally{busy=false}}
new MutationObserver(()=>setTimeout(patch,90)).observe(document.documentElement,{childList:true,subtree:true});setTimeout(patch,1000);
})();