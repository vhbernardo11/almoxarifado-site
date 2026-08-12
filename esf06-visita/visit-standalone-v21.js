(()=>{
'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function activeId(){try{return window.ACSPatientFast?.activePersonId||window.__ACS_ACTIVE_PERSON_ID||sessionStorage.getItem('acs_active_person_id')||''}catch{return''}}
function openStandalone(id,button){
  if(!UUID.test(String(id||'')))return false;
  const card=button?.closest?.('.route-item,.patient,.card');
  const agenda=card?.querySelector?.('[data-route-done]')?.dataset?.routeDone||'';
  const reason=card?.querySelector?.('.route-reason')?.textContent?.trim()||'';
  const u=new URL('../acs-visita-campo/',location.href);
  u.searchParams.set('person',id);
  if(agenda&&UUID.test(agenda))u.searchParams.set('agenda',agenda);
  if(reason)u.searchParams.set('reason',reason);
  u.searchParams.set('source',agenda?'Roteiro do dia':'Gestão ACS 360');
  location.assign(u.href);
  return true;
}
window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-route-visit],[data-due-visit],[data-visit],#person-visit');
  if(!b)return;
  const id=b.dataset?.routeVisit||b.dataset?.dueVisit||b.dataset?.visit||activeId();
  if(!UUID.test(String(id||'')))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  document.getElementById('loading')?.classList.add('hidden');
  document.getElementById('vf-loader')?.remove();
  openStandalone(id,b);
},true);
window.__ACS_STANDALONE_VISIT__='21';
})();