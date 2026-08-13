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

const ps=document.createElement('script');ps.src='./planner-v32.js?v=34';ps.defer=true;document.head.appendChild(ps);
const st=document.createElement('style');st.textContent='.pv32-tabs{display:grid;grid-template-columns:repeat(4,1fr);background:#fff}.pv32-tabs button{border:0;background:#fff;padding:14px 6px;font-weight:800;color:#6b7890}.pv32-tabs button.on{color:#079887;border-bottom:3px solid #079887}.pv32-card,.pv32-family,.pv32-route{background:#fff;border:1px solid #dfe6ee;border-radius:18px;padding:15px;margin-bottom:13px}.pv32-card-title{font-size:19px;font-weight:900;margin-bottom:12px}.pv32-loading,.pv32-empty,.pv32-info{padding:16px;border-radius:14px;background:#f5f7fa;color:#6c798c}.pv32-smart{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border:1px solid #bfe8e2;background:#f1fffc;border-radius:16px;margin:12px 0}.pv32-smart strong,.pv32-smart small,.pv32-family strong,.pv32-family small,.pv32-route strong,.pv32-route small{display:block}.pv32-smart small,.pv32-family small,.pv32-route small{color:#6b788b;margin-top:4px}.pv32-preview{border:1px solid #d7e0e8;border-radius:16px;padding:13px;margin:12px 0}.pv32-preview-head,.pv32-row,.pv32-family{display:flex;justify-content:space-between;gap:12px}.pv32-suggestion{display:flex;gap:10px;padding:11px 0;border-top:1px solid #e8edf2}.pv32-reasons,.pv32-flagline{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pv32-reasons span,.pv32-flagline span,.pv32-origin{font-size:12px;padding:5px 8px;border-radius:999px;background:#edf5f3;color:#176f63}.pv32-origin{display:inline-block;margin-top:8px}.pv32-route{display:flex;gap:12px}.pv32-order{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#e7f6f3;color:#087f70;font-weight:900}.pv32-route-main{flex:1}.pv32-route-actions,.pv32-actions-top,.pv32-mini-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.pv32-route-actions .btn{flex:1 1 120px}.pv32-insert,.pv32-date{width:100%;box-sizing:border-box;margin-bottom:10px}.pv32-insert{padding:12px;border:1px solid #6ddacb;background:#ecfffb;color:#087f70;border-radius:14px}.pv32-date{padding:12px;border:1px solid #d7e0e8;border-radius:14px}.pv32-cal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.pv32-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.pv32-cal-grid>b{text-align:center;font-size:12px;color:#7b8798}.pv32-day{min-height:44px;border:1px solid #e0e6ed;background:#fff;border-radius:10px}.pv32-day.sel{background:#e9f9f6;color:#087f70;font-weight:900}.pv32-day.today{border-color:#0aa391}.pv32-day i{font-style:normal;font-size:0;margin-left:4px}.pv32-day i:after{content:"•";font-size:12px;color:#0aa391}.pv32-section-label{font-size:12px;font-weight:900;color:#7b8798;margin:17px 0 7px}.pv32-row{padding:11px 0;border-top:1px solid #e8edf2}.pv32-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.pv32-chips button{border:1px solid #d7e0e8;background:#fff;border-radius:999px;padding:8px 11px;font-weight:800}.pv32-chips button.on{background:#e6f7f4;color:#087f70}.pv32-back{position:fixed;inset:0;z-index:99999;background:rgba(5,16,34,.52);display:flex;align-items:center;justify-content:center;padding:16px}.pv32-modal{width:min(100%,520px);max-height:88vh;overflow:auto;background:#fff;border-radius:22px;padding:20px;position:relative}.pv32-modal input,.pv32-modal select,.pv32-modal textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #d9e1e8;border-radius:12px}.pv32-modal label{display:block;font-weight:800;margin:11px 0 5px}.pv32-close{position:absolute;right:13px;top:12px;border:0;border-radius:50%;width:34px;height:34px}.pv32-person{display:block;width:100%;text-align:left;border:1px solid #e1e7ed;background:#fff;border-radius:11px;padding:10px;margin:6px 0}.pv32-results{max-height:250px;overflow:auto}.pv32-picked{padding:10px;background:#eaf8f5;border-radius:11px;margin:9px 0}.pv32-toast{position:fixed;left:18px;right:18px;bottom:92px;z-index:100000;background:#0f766e;color:#fff;padding:12px 15px;border-radius:13px;font-weight:800}.pv32-toast.err{background:#b42318}.pv32-toast.warn{background:#9a6700}.btn.warn{background:#fff7eb!important;color:#9a5a00!important}.btn.danger{background:#fff1f1!important;color:#b42318!important}.block{width:100%}@media(max-width:620px){.pv32-smart,.pv32-family,.pv32-row{flex-direction:column}.pv32-tabs button{font-size:12px}}';document.head.appendChild(st);
})();