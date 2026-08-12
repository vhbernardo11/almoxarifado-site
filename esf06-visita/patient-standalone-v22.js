(()=>{
'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function go(id){if(!UUID.test(String(id||'')))return false;document.getElementById('loading')?.classList.add('hidden');const u=new URL('../acs-ficha-paciente/',location.href);u.searchParams.set('person',id);location.assign(u.href);return true}
window.addEventListener('click',e=>{const b=e.target.closest?.('[data-person]');if(!b)return;const id=b.dataset.person;if(!UUID.test(String(id||'')))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();go(id)},true);
window.__ACS_STANDALONE_PATIENT__='22';
})();