(()=>{'use strict';
let active=false,scheduled=false,suppressBaseClick=false;
const HIDE='pbf-filter-hidden';
function chipRow(){return [...document.querySelectorAll('.chips')].find(r=>{const t=r.textContent||'';return t.includes('Todas')&&t.includes('Sem visita')&&t.includes('Visitadas')})||null}
function ensureStyle(){if(document.getElementById('pbf-family-filter-style'))return;const s=document.createElement('style');s.id='pbf-family-filter-style';s.textContent=`.${HIDE}{display:none!important}`;document.head.appendChild(s)}
function clearHidden(){document.querySelectorAll('[data-family].'+HIDE).forEach(el=>el.classList.remove(HIDE))}
function apply(){scheduled=false;ensureStyle();const row=chipRow();if(!row){clearHidden();return}let b=row.querySelector('[data-pbf-filter]');if(!b){b=document.createElement('button');b.type='button';b.className='chip';b.dataset.pbfFilter='1';b.setAttribute('aria-label','Mostrar somente arrimos beneficiários do Bolsa Família');b.addEventListener('click',()=>{active=!active;if(active){const all=[...row.querySelectorAll('.chip')].find(x=>x!==b&&(x.textContent||'').trim()==='Todas');if(all&&!all.classList.contains('on')){suppressBaseClick=true;all.click();suppressBaseClick=false}}schedule()});const has=[...row.querySelectorAll('.chip')].find(x=>(x.textContent||'').trim()==='HAS');row.insertBefore(b,has||null)}const n=document.querySelectorAll('[data-family] [data-pbf-family]').length;b.textContent=n?`💳 Bolsa Família · ${n}`:'💳 Bolsa Família';b.classList.toggle('on',active);b.setAttribute('aria-pressed',active?'true':'false');if(!active){clearHidden();return}document.querySelectorAll('[data-family]').forEach(card=>card.classList.toggle(HIDE,!card.querySelector('[data-pbf-family]')))}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
document.addEventListener('click',e=>{if(suppressBaseClick||!active)return;const row=chipRow(),chip=e.target.closest?.('.chip');if(!row||!chip||!row.contains(chip)||chip.hasAttribute('data-pbf-filter'))return;active=false;schedule()},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',schedule,{once:true});
schedule();
})();
