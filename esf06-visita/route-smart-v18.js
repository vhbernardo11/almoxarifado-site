(()=>{
'use strict';
const SMART='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-route-tools';
const key=()=>new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const seenInputDate=new WeakMap();
const lastAutoAt=new Map();
const lastResult=new Map();
let running=false,checkTimer=null,lastManualAt=0;

async function call(api,opts={}){
  const u=new URL(SMART);u.searchParams.set('api',api);u.searchParams.set('k',key());
  Object.entries(opts.params||{}).forEach(([a,b])=>u.searchParams.set(a,String(b)));
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),9000);
  try{
    const r=await fetch(u,{method:opts.method||'GET',headers:opts.body?{'content-type':'application/json'}:undefined,body:opts.body?JSON.stringify(opts.body):undefined,cache:'no-store',signal:ctl.signal});
    const j=await r.json().catch(()=>({error:'Falha de comunicação'}));
    if(!r.ok)throw new Error(j.error||`Erro ${r.status}`);return j;
  }catch(e){if(e?.name==='AbortError')throw new Error('O banco demorou para responder. Tente novamente em alguns segundos.');throw e}
  finally{clearTimeout(tm)}
}
function ctx(){const input=document.getElementById('route-date'),list=document.getElementById('route-list');return{input,list,date:input?.value||''}}
function host(list){return list?.closest('.card')||null}
function boxFor(list){const h=host(list);if(!h)return null;let b=h.querySelector('#v9-route-status');if(!b){b=document.createElement('div');b.id='v9-route-status';b.className='v9-route-status';list.before(b)}return b}
function loading(list,date){const b=boxFor(list);if(!b)return;b.className='v9-route-status';b.innerHTML=`<div class="v9-status-head"><span class="v9-orbit">◎</span><div><strong>Organizando o roteiro de ${esc(date.split('-').reverse().join('/'))}</strong><small>Uma única otimização: até 8 visitas, proximidade e prioridade.</small></div></div>`}
function markAuto(rows){const byId=new Map((rows||[]).map(x=>[String(x.id),x]));document.querySelectorAll('#route-list .route-item').forEach(card=>{const id=card.querySelector('[data-route-done]')?.dataset.routeDone,r=byId.get(String(id));card.querySelector('.v9-auto-note')?.remove();if(!r||!String(r.reason||'').startsWith('Roteiro inteligente:'))return;const n=document.createElement('div');n.className='v9-auto-note';n.innerHTML=`✨ <strong>Incluída pelo roteiro inteligente</strong><span>${esc(String(r.reason).replace('Roteiro inteligente:','').trim())}</span>`;const row=card.querySelector('.btn-row');(row||card).before(n)})}
function status(r,list){const b=boxFor(list);if(!b)return;const count=Number(r.count??r.rows?.length??0),target=Number(r.target||8),auto=(r.auto_added||[]).length,over=Number(r.over_target||0);let sub='Roteiro agrupado por rua e número da residência.';if(auto)sub=`${auto} ${auto===1?'visita incluída':'visitas incluídas'} automaticamente para completar o dia.`;if(over)sub=`Há ${over} visita${over===1?'':'s'} acima da meta; nenhuma foi apagada.`;b.className='v9-route-status'+(over?' warn':count===target?' ok':'');b.innerHTML=`<div class="v9-status-head"><span class="v9-orbit">${count===target?'✓':'◎'}</span><div><strong>Roteiro inteligente · ${count}/${target} visitas</strong><small>${esc(sub)}</small></div></div><div class="v9-status-actions"><span>📍 Ordem territorial por endereço</span><button type="button" data-v18-recalc>↻ Reorganizar</button></div>`;b.querySelector('[data-v18-recalc]').onclick=()=>optimize(true);markAuto(r.rows||[])}
function errorBox(list,msg){const b=boxFor(list);if(!b)return;b.className='v9-route-status warn';b.innerHTML=`<div class="v9-status-head"><span class="v9-orbit">!</span><div><strong>Banco temporariamente ocupado</strong><small>${esc(msg)}</small></div></div><div class="v9-status-actions"><span>As visitas atuais foram preservadas.</span><button type="button" data-v18-recalc>↻ Tentar novamente</button></div>`;b.querySelector('[data-v18-recalc]').onclick=()=>optimize(true)}
function refreshRoute(){const i=document.getElementById('route-date');if(i)i.dispatchEvent(new Event('change',{bubbles:true}))}
async function optimize(force=false){
  const {input,list,date}=ctx();if(!input||!list||!date||date<today()||running)return;
  const now=Date.now();
  if(!force){
    if(seenInputDate.get(input)===date)return;
    seenInputDate.set(input,date);
    const last=lastAutoAt.get(date)||0;
    if(now-last<12000){const r=lastResult.get(date);if(r)status(r,list);return}
    lastAutoAt.set(date,now);
  }else{
    if(now-lastManualAt<1800)return;lastManualAt=now;seenInputDate.set(input,date);
  }
  running=true;loading(list,date);
  try{
    const r=await call('optimize',{method:'POST',body:{date,target:8}});
    lastResult.set(date,r);lastAutoAt.set(date,Date.now());
    status(r,list);
    refreshRoute();
    setTimeout(()=>{const c=ctx();if(c.date===date&&c.list)status(r,c.list)},500);
  }catch(e){errorBox(list,e.message||'Não foi possível conectar ao banco de dados.');}
  finally{running=false}
}
function schedule(){clearTimeout(checkTimer);checkTimer=setTimeout(()=>{const {input,list,date}=ctx();if(!input||!list||!date)return;const last=lastAutoAt.get(date)||0;if(seenInputDate.get(input)!==date){if(Date.now()-last<12000){seenInputDate.set(input,date);const r=lastResult.get(date);if(r)status(r,list)}else optimize(false)}},220)}
const obs=new MutationObserver(()=>schedule());obs.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('change',e=>{if(e.target?.id==='route-date')schedule()});
setTimeout(schedule,650);
window.ESF06RouteOptimizer={optimize};
})();
