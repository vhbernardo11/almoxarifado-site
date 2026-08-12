(()=>{
'use strict';
// Hotfix 12.1: o app principal chama fetch() com um objeto URL.
// O conditions-editor-v12 esperava string/Request e, por isso, não capturava person_id.
// Este wrapper normaliza URL -> string antes de delegar para o wrapper do editor.
const previousFetch=window.fetch.bind(window);
window.fetch=function(input,init){
  try{
    if(typeof URL!=='undefined' && input instanceof URL){
      return previousFetch(input.href,init);
    }
    if(input && typeof input==='object' && typeof input.href==='string' && typeof input.url!=='string'){
      return previousFetch(input.href,init);
    }
  }catch(_e){}
  return previousFetch(input,init);
};
window.__ACS_CONDITIONS_HOTFIX__='12.1';
})();
