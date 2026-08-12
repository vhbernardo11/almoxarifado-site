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
})();
