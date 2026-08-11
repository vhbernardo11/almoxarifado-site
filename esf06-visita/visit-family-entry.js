(()=>{
'use strict';
const API='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-visita-api';
const key=localStorage.getItem('esf06_visit_key')||new URL(location.href).searchParams.get('k')||'';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').toLowerCase().replace(/\s+/g,' ').trim();
async function api(name,params={}){const u=new URL(API);u.searchParams.set('api',name);u.searchParams.set('k',key);Object.entries(params).forEach(([a,b])=>u.searchParams.set(a,String(b)));const r=await fetch(u,{cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Erro');return j}
async function openFromDetail(btn){
  const stage=btn.closest('#stage')||document;
  const name=stage.querySelector('.detail-name')?.textContent?.trim()||'';
  const address=(stage.querySelector('.notice.info')?.textContent||'').replace(/^📍\s*/,'').trim();
  if(!name)return;
  const parts=norm(name).split(' ').filter(x=>x.length>2),q=parts.slice(0,2).join(' ')||norm(name);
  const rows=(await api('patients',{q,group:'all',limit:30})).rows||[];
  const target=rows.find(r=>norm(r.full_name)===norm(name))||rows[0];
  if(!target)throw new Error('Paciente não localizado no cadastro.');
  window.ESF06FamilyVisit?.openVisit(target.id,{source:'Ficha do paciente',reason:'Visita domiciliar',address,patientName:name});
}
window.addEventListener('click',e=>{
  const b=e.target.closest?.('#person-visit');
  if(!b||document.querySelector('.vf-overlay'))return;
  e.preventDefault();e.stopImmediatePropagation();
  openFromDetail(b).catch(err=>{const d=document.createElement('div');d.className='vf-toast err';d.textContent=err.message||'Não foi possível abrir a visita.';document.body.appendChild(d);setTimeout(()=>d.remove(),3500)});
},true);
})();