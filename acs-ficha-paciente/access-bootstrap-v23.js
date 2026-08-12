(()=>{
'use strict';
try{
  const u=new URL(location.href);
  const k=u.searchParams.get('k')||'';
  if(k){
    localStorage.setItem('esf06_visit_key',k);
    sessionStorage.setItem('esf06_visit_key',k);
    u.searchParams.delete('k');
    history.replaceState({},'',u.pathname+(u.search?u.search:'')+(u.hash||''));
  }else{
    const saved=localStorage.getItem('esf06_visit_key')||sessionStorage.getItem('esf06_visit_key')||'';
    if(saved&&!localStorage.getItem('esf06_visit_key'))localStorage.setItem('esf06_visit_key',saved);
  }
  window.__ACS_ACCESS_READY__=!!localStorage.getItem('esf06_visit_key');
}catch(_e){window.__ACS_ACCESS_READY__=false;}
})();