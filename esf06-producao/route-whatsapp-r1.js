(()=>{'use strict';
const FN='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-patient-fast';
const ACCESS=new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||'';
const contacts=new Map();
let loaded=false,loading=false;

function digits(v){return String(v||'').replace(/\D/g,'')}
function waNumber(v){let d=digits(v);if(!d)return'';if(d.startsWith('55')&&(d.length===12||d.length===13))return d;if(d.length===10||d.length===11)return'55'+d;return''}
function pretty(v){let d=digits(v);if(d.startsWith('55')&&d.length>=12)d=d.slice(2);if(d.length===11)return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;if(d.length===10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return String(v||'')}
function isConfirmed(row){const f=row&&row.flags&&typeof row.flags==='object'?row.flags:{};return f.whatsapp_confirmed===true||String(f.whatsapp_confirmed||'').toLowerCase()==='true'}
function confirmedPhone(row){const f=row&&row.flags&&typeof row.flags==='object'?row.flags:{};return f.whatsapp_phone||row.phone||''}

function style(){
  if(document.getElementById('route-wa-r1-style'))return;
  const s=document.createElement('style');
  s.id='route-wa-r1-style';
  s.textContent=`
.route-head{align-items:flex-start!important}
.route-wa-btn{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;flex:0 0 38px!important;margin-left:4px!important;border:0!important;border-radius:12px!important;background:#25D366!important;color:#fff!important;display:grid!important;place-items:center!important;text-decoration:none!important;box-shadow:0 4px 12px rgba(37,211,102,.24)!important;align-self:flex-start!important;line-height:1!important}
.route-wa-btn svg{width:21px!important;height:21px!important;display:block!important;fill:currentColor!important}
.route-wa-btn:active{transform:scale(.95)}
.route-wa-btn:focus-visible{outline:3px solid #8bb4ff!important;outline-offset:2px!important}
@media(max-width:520px){.route-wa-btn{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;flex-basis:36px!important;border-radius:11px!important}.route-wa-btn svg{width:20px!important;height:20px!important}}
`;
  document.head.appendChild(s);
}

function loadContacts(rows){
  contacts.clear();
  for(const row of rows||[]){
    if(!row||!row.id||!isConfirmed(row))continue;
    const raw=confirmedPhone(row),num=waNumber(raw);
    if(!num)continue;
    contacts.set(String(row.id),{num,raw,name:row.full_name||'Paciente'});
  }
}

function icon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.78 11.78 0 0 0 12.11 0C5.6 0 .3 5.3.3 11.82c0 2.08.54 4.11 1.57 5.9L.2 24l6.43-1.69a11.8 11.8 0 0 0 5.48 1.4h.01c6.51 0 11.81-5.3 11.81-11.82 0-3.16-1.21-6.12-3.41-8.41ZM12.12 21.7h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.82 1 1.02-3.72-.24-.38a9.79 9.79 0 0 1-1.51-5.2c0-5.41 4.4-9.81 9.82-9.81 2.62 0 5.08 1.02 6.93 2.88a9.73 9.73 0 0 1 2.87 6.94c0 5.4-4.4 9.8-9.71 9.87Zm5.38-7.35c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47a8.95 8.95 0 0 1-1.65-2.05c-.17-.3-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.06 4.48.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z"/></svg>'}

function enhance(){
  if(!loaded)return;
  style();
  document.querySelectorAll('.route:not(.completed)').forEach(card=>{
    if(card.querySelector('[data-route-wa]'))return;
    const visit=card.querySelector('[data-rvisit]');
    if(!visit)return;
    const pid=String(visit.getAttribute('data-rvisit')||'');
    const info=contacts.get(pid);
    if(!info)return;
    const head=card.querySelector('.route-head');
    if(!head)return;
    const a=document.createElement('a');
    a.className='route-wa-btn';
    a.dataset.routeWa=pid;
    a.href='https://wa.me/'+info.num;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.setAttribute('aria-label',`Abrir WhatsApp confirmado de ${info.name} no número ${pretty(info.raw)}`);
    a.title=`WhatsApp confirmado · ${pretty(info.raw)}`;
    a.innerHTML=icon();
    a.addEventListener('click',e=>e.stopPropagation());
    a.addEventListener('keydown',e=>e.stopPropagation());
    head.appendChild(a);
  });
}

async function load(){
  if(loading||loaded||!ACCESS)return;
  loading=true;
  try{
    const u=new URL(FN);
    u.searchParams.set('api','list');
    u.searchParams.set('k',ACCESS);
    u.searchParams.set('_',Date.now());
    const r=await fetch(u,{cache:'no-store'}),j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Falha ao carregar contatos');
    loadContacts(j.rows||[]);
    loaded=true;
    enhance();
  }catch(e){console.warn('WhatsApp do roteiro indisponível',e)}finally{loading=false}
}

let tick=false;
const obs=new MutationObserver(()=>{
  if(tick)return;
  tick=true;
  requestAnimationFrame(()=>{tick=false;if(loaded)enhance()});
});
obs.observe(document.documentElement,{childList:true,subtree:true});
style();
setTimeout(load,200);
window.addEventListener('load',()=>{enhance();if(!loaded)load()},{once:true});
})();
