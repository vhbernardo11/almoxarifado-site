(()=>{'use strict';
if(window.__ESF06_REGUA_SCHEDULE_R10__)return;window.__ESF06_REGUA_SCHEDULE_R10__=true;
const BASE='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/';
const ACCESS=new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(s||'—')};
const addDays=(s,n)=>{const d=new Date(`${s}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};

const style=document.createElement('style');style.id='visit-regua-schedule-r10-style';style.textContent=`
.regua-card-actions{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex:0 0 auto}.regua-card-actions .regua-status{margin-left:0}.regua-schedule-btn{width:46px;height:46px;min-width:46px;border:0;border-radius:50%;background:#ffd817;color:#3e3600;display:grid;place-items:center;font-size:21px;font-weight:1000;box-shadow:0 5px 15px rgba(165,132,0,.28);cursor:pointer}.regua-schedule-btn:active{transform:scale(.95)}.regua-schedule-btn.is-scheduled{box-shadow:0 0 0 3px #49a97c,0 5px 15px rgba(33,138,93,.22)}.regua-scheduled-note{margin-top:8px;padding:8px 10px;border-radius:11px;background:#eef9f3;color:#246d4f;font-size:11px;font-weight:850;line-height:1.4}.regua-sched-back{position:fixed;inset:0;z-index:950;background:#071a31cc;display:flex;align-items:flex-end;justify-content:center;padding:12px}.regua-sched-modal{width:min(100%,520px);background:#fff;border-radius:23px;padding:18px;box-shadow:0 24px 70px #0019}.regua-sched-title{display:flex;align-items:flex-start;gap:10px}.regua-sched-title h3{margin:0;font-size:20px}.regua-sched-title p{margin:5px 0 0;color:#708096;font-size:12px;line-height:1.4}.regua-sched-close{margin-left:auto;border:0;border-radius:50%;width:42px;height:42px;background:#eef2f6;color:#526176;font-size:21px}.regua-sched-modal label{display:block;margin:14px 0 5px;font-size:12px;font-weight:900;color:#526176}.regua-sched-modal input[type=date]{width:100%;border:1px solid #d9e1e9;border-radius:14px;padding:12px;background:#fff;min-height:48px;font:inherit}.regua-sched-quick{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.regua-sched-chip{border:1px solid #dfe6ed;background:#f7f9fb;color:#435268;border-radius:999px;padding:8px 10px;font-size:11px;font-weight:900}.regua-sched-info{margin-top:12px;padding:10px 11px;border-radius:13px;background:#fff8dc;color:#745c00;font-size:12px;line-height:1.45}.regua-sched-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin-top:15px}.regua-sched-actions button{border:0;border-radius:14px;padding:12px;font-weight:950;min-height:48px}.regua-sched-cancel{background:#eef2f6;color:#526176}.regua-sched-save{background:#ffd817;color:#3e3600}.regua-sched-save:disabled{opacity:.55}.regua-sched-msg{margin-top:10px;font-size:12px;font-weight:850;line-height:1.4}.regua-sched-msg.ok{color:#216c4e}.regua-sched-msg.err{color:#a52f35}
@media(min-width:720px){.regua-sched-back{align-items:center}}@media(max-width:520px){.regua-card-head{align-items:flex-start}.regua-schedule-btn{width:44px;height:44px;min-width:44px}.regua-sched-actions{grid-template-columns:1fr}}
`;document.head.appendChild(style);

let regua=null,schedules=new Map(),loading=null,decorateTimer=0;
function itemKey(name,family){return `${String(name||'').trim().toUpperCase()}|${String(family||'').trim()}`}
async function loadMaps(force=false){
 if(!ACCESS)throw new Error('Chave de acesso não encontrada');
 if(loading&&!force)return loading;
 loading=(async()=>{
   const [a,b]=await Promise.all([
     fetch(`${BASE}acs-visit-regua?api=list&k=${encodeURIComponent(ACCESS)}`,{cache:'no-store'}),
     fetch(`${BASE}acs-visit-schedule?k=${encodeURIComponent(ACCESS)}`,{cache:'no-store'})
   ]);
   const j=await a.json().catch(()=>({})),s=await b.json().catch(()=>({}));
   if(!a.ok)throw new Error(j.error||'Falha ao carregar régua');
   if(!b.ok)throw new Error(s.error||'Falha ao carregar agenda');
   regua=j;schedules=new Map();
   for(const x of (s.items||[])){const id=String(x.person_id||'');if(id&&!schedules.has(id))schedules.set(id,x)}
   return j;
 })();
 try{return await loading}finally{loading=null}
}
function findItem(card){
 if(!regua)return null;
 const name=(card.querySelector('.regua-name')?.textContent||'').trim().toUpperCase();
 const meta=card.querySelector('.regua-meta')?.textContent||'';
 const fm=meta.match(/Família\s+([^\s·]+)/i),family=fm?fm[1].trim():'';
 const items=(regua.items||[]).filter(x=>String(x.full_name||'').trim().toUpperCase()===name);
 if(items.length===1)return items[0];
 return items.find(x=>String(x.family_code||'').trim()===family)||items[0]||null;
}
function reasonFor(item){const labels=[...new Set((item.tracks||[]).map(t=>String(t.label||'').trim()).filter(Boolean))];return `Régua ACS: ${labels.join(' + ')||'acompanhamento programado'}`.slice(0,300)}
function renderScheduled(card,item){
 const s=schedules.get(String(item.person_id));let n=card.querySelector('.regua-scheduled-note');
 if(!s){if(n)n.remove();return}
 if(!n){n=document.createElement('div');n.className='regua-scheduled-note';const head=card.querySelector('.regua-card-head');head?.insertAdjacentElement('afterend',n)}
 n.textContent=`📅 Visita agendada para ${fmt(s.scheduled_date)}.`;
 const b=card.querySelector('.regua-schedule-btn');if(b){b.classList.add('is-scheduled');b.textContent='📅';b.title=`Agendada para ${fmt(s.scheduled_date)} — toque para reagendar`;b.setAttribute('aria-label',`Visita agendada para ${fmt(s.scheduled_date)}. Toque para reagendar`)}
}
function decorate(){
 if(!regua)return;
 document.querySelectorAll('.regua-card:not([data-regua-schedule-ready])').forEach(card=>{
   const item=findItem(card);if(!item)return;
   card.dataset.reguaScheduleReady='1';
   const head=card.querySelector('.regua-card-head'),status=card.querySelector('.regua-status');if(!head||!status)return;
   let actions=document.createElement('div');actions.className='regua-card-actions';status.replaceWith(actions);actions.appendChild(status);
   const b=document.createElement('button');b.type='button';b.className='regua-schedule-btn';b.textContent='📅';b.title='Agendar visita';b.setAttribute('aria-label',`Agendar visita para ${item.full_name}`);b.onclick=e=>{e.stopPropagation();openSchedule(item,card,b)};actions.appendChild(b);renderScheduled(card,item);
 });
}
function scheduleDecorate(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,40)}
async function openSchedule(item,card,button){
 const today=regua?.today||new Date().toISOString().slice(0,10),current=schedules.get(String(item.person_id));
 const suggested=current?.scheduled_date||(item.next_due&&item.next_due>=today?item.next_due:today);
 const back=document.createElement('div');back.className='regua-sched-back';
 const due=item.next_due?fmt(item.next_due):'sem prazo fixo';
 back.innerHTML=`<section class="regua-sched-modal"><div class="regua-sched-title"><div><h3>Agendar visita</h3><p>${esc(item.full_name)}<br>Família ${esc(item.family_code||'—')} · ${esc(item.address||'Endereço não informado')}</p></div><button type="button" class="regua-sched-close" aria-label="Fechar">×</button></div><label>Data da visita</label><input type="date" data-regua-sched-date min="${esc(today)}" value="${esc(suggested)}"><div class="regua-sched-quick"><button type="button" class="regua-sched-chip" data-date="${esc(today)}">Hoje</button><button type="button" class="regua-sched-chip" data-date="${esc(addDays(today,1))}">Amanhã</button>${item.next_due&&item.next_due>=today?`<button type="button" class="regua-sched-chip" data-date="${esc(item.next_due)}">Prazo sugerido</button>`:''}</div><div class="regua-sched-info">Próximo marco da régua: <b>${esc(due)}</b><br>${esc(reasonFor(item))}</div><div class="regua-sched-msg" data-msg></div><div class="regua-sched-actions"><button type="button" class="regua-sched-cancel">Cancelar</button><button type="button" class="regua-sched-save">${current?'Reagendar':'Agendar visita'}</button></div></section>`;
 document.body.appendChild(back);
 const close=()=>back.remove();back.querySelector('.regua-sched-close').onclick=close;back.querySelector('.regua-sched-cancel').onclick=close;back.onclick=e=>{if(e.target===back)close()};
 const input=back.querySelector('[data-regua-sched-date]'),msg=back.querySelector('[data-msg]'),save=back.querySelector('.regua-sched-save');
 back.querySelectorAll('[data-date]').forEach(x=>x.onclick=()=>{input.value=x.dataset.date});
 save.onclick=async()=>{
   const date=input.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){msg.className='regua-sched-msg err';msg.textContent='Escolha uma data válida.';return}
   save.disabled=true;save.textContent='Salvando…';msg.textContent='';
   try{
     const r=await fetch(`${BASE}acs-visit-schedule?k=${encodeURIComponent(ACCESS)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({person_id:item.person_id,scheduled_date:date,reason:reasonFor(item)})});
     const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Não foi possível agendar');
     schedules.set(String(item.person_id),j.item||{person_id:item.person_id,scheduled_date:date});renderScheduled(card,item);
     document.querySelectorAll('.regua-card[data-regua-schedule-ready]').forEach(c=>{const x=findItem(c);if(x&&String(x.person_id)===String(item.person_id))renderScheduled(c,x)});
     msg.className='regua-sched-msg ok';msg.textContent=j.message||`Visita agendada para ${fmt(date)}.`;save.textContent='Salvo ✓';setTimeout(close,650);
   }catch(e){msg.className='regua-sched-msg err';msg.textContent=e.message||String(e);save.disabled=false;save.textContent=current?'Reagendar':'Agendar visita'}
 };
}
const obs=new MutationObserver(scheduleDecorate);obs.observe(document.body,{childList:true,subtree:true});
loadMaps().then(()=>{decorate()}).catch(e=>console.warn('regua-schedule',e));
})();