(()=>{
'use strict';
if(window.__ESF06_FAMILY_CARDS_V43__)return;window.__ESF06_FAMILY_CARDS_V43__=true;
const API='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-patient-fast';
const key=()=>new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||'';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let rows=null,promise=null,timer=null;
async function load(){if(rows)return rows;if(promise)return promise;promise=(async()=>{const u=new URL(API);u.searchParams.set('api','list');u.searchParams.set('k',key());u.searchParams.set('_',Date.now());const r=await fetch(u,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Falha ao carregar famílias');rows=j.rows||[];return rows})();try{return await promise}finally{promise=null}}
function age(p){if(Number.isFinite(Number(p.age)))return Number(p.age);if(!p.birth_date)return null;const b=new Date(String(p.birth_date).slice(0,10)+'T12:00:00'),n=new Date();let a=n.getFullYear()-b.getFullYear();const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a}
function yes(o,...keys){for(const k of keys){if(o?.[k]===true)return true}return false}
function markers(p){const f=p.flags||{},a=age(p),m=[];
 if(yes(f,'hipertenso','has','HAS'))m.push(['HAS','has']);
 if(yes(f,'diabetico','diabetes','dm'))m.push(['Diabetes','dm']);
 if(yes(f,'acamado'))m.push(['Acamado','high']);
 if(yes(f,'domiciliado'))m.push(['Domiciliado','high']);
 if(a!==null&&a>=65)m.push([a>=80?`${a} anos · 80+`:`${a} anos · 65+`,'age']);
 if(yes(f,'gestante'))m.push(['Gestante','preg']);
 if(yes(f,'puerpera'))m.push(['Puérpera','preg']);
 if(yes(f,'oncologia','oncologico'))m.push(['Oncologia','onc']);
 if(yes(f,'saudeMental','saude_mental'))m.push(['Saúde mental','mental']);
 if(a!==null&&a<2)m.push(['< 2 anos','child']);
 return m;
}
function isArrimo(p){return p.role==='responsavel'||(p.responsible_name&&norm(p.full_name)===norm(p.responsible_name))}
function css(){if(document.getElementById('fam43-style'))return;const s=document.createElement('style');s.id='fam43-style';s.textContent=`
.patient.fam43{position:relative;overflow:hidden;transition:.15s ease;border-width:1px!important}.patient.fam43:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px}.patient.fam43.fam43-visited{border-color:#93d7c6!important;background:linear-gradient(90deg,#effcf7 0,#fff 23%)!important}.patient.fam43.fam43-visited:before{background:#0a9b80}.patient.fam43.fam43-due{border-color:#efb6b6!important;background:linear-gradient(90deg,#fff3f3 0,#fff 23%)!important}.patient.fam43.fam43-due:before{background:#d64d4d}.patient.fam43.fam43-arrimo{box-shadow:0 5px 18px rgba(13,40,64,.07)}
.fam43-statusline{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 3px}.fam43-arrimo-badge,.fam43-visit-badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900}.fam43-arrimo-badge{background:#e8f2ff;color:#1d5f9d}.fam43-visit-badge.ok{background:#dff7ef;color:#087864}.fam43-visit-badge.due{background:#ffe3e3;color:#a92e2e}.fam43-markers{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 1px}.fam43-marker{border-radius:999px;padding:5px 8px;font-size:12px;font-weight:850;background:#eef2f6;color:#435168}.fam43-marker.has{background:#fff1d7;color:#805000}.fam43-marker.dm{background:#e8f0ff;color:#315c9d}.fam43-marker.high{background:#ffe6e6;color:#9b3030}.fam43-marker.age{background:#eeeaff;color:#6548a7}.fam43-marker.preg{background:#ffe8f4;color:#9c396f}.fam43-marker.onc{background:#f3e8ff;color:#7044a0}.fam43-marker.mental{background:#e5f5ff;color:#216b92}.fam43-marker.child{background:#e5fbf4;color:#17745f}.fam43-family-risk{font-size:11px;color:#68778a;margin-top:6px;font-weight:750}
@media(max-width:620px){.patient.fam43{padding-left:18px!important}}
`;document.head.appendChild(s)}
function decorateCard(card,p){if(!card||!p)return;card.classList.add('fam43');card.classList.toggle('fam43-visited',!!p.family_visited_month);card.classList.toggle('fam43-due',!p.family_visited_month);const arr=isArrimo(p);card.classList.toggle('fam43-arrimo',arr);
 const main=card.querySelector('.patient-main');if(!main)return;
 main.querySelector('.fam43-statusline')?.remove();main.querySelector('.fam43-markers')?.remove();main.querySelector('.fam43-family-risk')?.remove();
 const name=main.querySelector('.patient-name');if(name){const line=document.createElement('div');line.className='fam43-statusline';line.innerHTML=`${arr?'<span class="fam43-arrimo-badge">🏠 ARRIMO</span>':''}<span class="fam43-visit-badge ${p.family_visited_month?'ok':'due'}">${p.family_visited_month?'✓ Família visitada no mês':'● Família sem visita no mês'}</span>`;name.after(line)}
 const ms=markers(p);if(ms.length){const d=document.createElement('div');d.className='fam43-markers';d.innerHTML=ms.map(([label,c])=>`<span class="fam43-marker ${c}">${label}</span>`).join('');const tagline=main.querySelector('.tagline');(tagline||main.querySelector('.meta')||name)?.after(d)}
 if(p.family_risk){const r=document.createElement('div');r.className='fam43-family-risk';r.textContent='Risco familiar: '+p.family_risk;const actions=main.querySelector('.patient-actions');(actions||main).before(r)}
}
async function paint(){const list=document.getElementById('patient-list');if(!list||!document.body.classList.contains('v39-patients'))return;try{css();const all=await load(),map=new Map(all.map(x=>[String(x.id),x]));list.querySelectorAll('.patient').forEach(card=>{const id=card.querySelector('[data-person]')?.dataset.person||card.querySelector('[data-visit]')?.dataset.visit;if(id)decorateCard(card,map.get(String(id)))})}catch(e){console.warn('family-cards-v43',e)}}
function schedule(){clearTimeout(timer);timer=setTimeout(paint,80)}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});document.addEventListener('input',e=>{if(e.target?.id==='patient-search')setTimeout(schedule,280)});window.addEventListener('pageshow',schedule);setTimeout(schedule,450);setInterval(schedule,1800);
})();
