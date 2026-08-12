(()=>{
'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function accessKey(){try{return new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||''}catch{return''}}
function go(id){
  if(!UUID.test(String(id||'')))return false;
  document.getElementById('loading')?.classList.add('hidden');
  const u=new URL('../acs-ficha-paciente/',location.href);
  u.searchParams.set('person',id);
  const k=accessKey();
  if(k)u.searchParams.set('k',k);
  location.assign(u.href);
  return true;
}
window.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-person]');
  if(!b)return;
  const id=b.dataset.person;
  if(!UUID.test(String(id||'')))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  go(id);
},true);
window.__ACS_STANDALONE_PATIENT__='23';
})();