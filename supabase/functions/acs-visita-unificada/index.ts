import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

const db = postgres(Deno.env.get("SUPABASE_DB_URL")!, {prepare:false, max:2, idle_timeout:10});
const ALLOWED = "https://vhbernardo11.github.io";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function headers(origin:string|null) {
  const h = new Headers({
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "vary":"Origin",
    "access-control-allow-methods":"GET,POST,OPTIONS",
    "access-control-allow-headers":"content-type,authorization"
  });
  if(origin===ALLOWED) h.set("access-control-allow-origin", ALLOWED);
  return h;
}
function reply(data:unknown,status=200,origin:string|null=null){
  return new Response(JSON.stringify(data),{status,headers:headers(origin)});
}
async function hashToken(token:string){
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}
const norm=(x:unknown)=>x==null?null:String(x);
function goodDate(s:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+"T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
  if(req.method==="GET")return reply({ok:true,service:"acs-visita-unificada",version:1,mode:"family_atomic",official_esus:false},200,origin);
  if(req.method!=="POST")return reply({error:"Método não permitido"},405,origin);
  const bearer=req.headers.get("authorization")||"";
  const token=bearer.startsWith("Bearer ")?bearer.slice(7).trim():"";
  if(token.length<24 || token.length>256)return reply({error:"Acesso pessoal necessário"},401,origin);
  try{
    const tokenHash=await hashToken(token);
    const [actor]=await db<any[]>`select l.user_id from private.acs_visit_access_links l
      join public.acs_profiles p on p.id=l.user_id
      where l.token_hash=${tokenHash} and l.active=true and p.active=true limit 1`;
    if(!actor)return reply({error:"Acesso inválido ou revogado"},401,origin);
    const b=await req.json().catch(()=>null);
    const id=String(b?.group_id||"");
    const personId=String(b?.person_id||"");
    const date=String(b?.visit_date||"");
    const time=b?.visit_time==null?null:String(b.visit_time);
    const ids=Array.isArray(b?.member_ids)?Array.from(new Set(b.member_ids.map(String))):[];
    const agenda=b?.agenda_item_id?String(b.agenda_item_id):null;
    const notes=b?.general_notes==null?null:String(b.general_notes);
    const sig=b?.signature_data==null?null:String(b.signature_data);
    const signer=b?.signer_name==null?null:String(b.signer_name);
    if(!UUID.test(id)||!UUID.test(personId)||!goodDate(date)||!ids.length||ids.length>30||ids.some(i=>!UUID.test(i))||!ids.includes(personId))return reply({error:"Dados da visita ou participantes inválidos"},400,origin);
    if(time!==null&&!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time))return reply({error:"Hora inválida"},400,origin);
    if(agenda!==null&&!UUID.test(agenda))return reply({error:"Agenda inválida"},400,origin);
    if(notes&&notes.length>10000)return reply({error:"Observações excedem o limite"},400,origin);
    if(signer&&signer.length>150)return reply({error:"Identificação de assinatura muito longa"},400,origin);
    if(sig&&(!sig.startsWith("data:image/png;base64,")||sig.length>1200000))return reply({error:"Assinatura inválida"},400,origin);
    const response=await db.begin(async tx=>{
      const [primary]=await tx<any[]>`select p.id,p.family_id,p.full_name,f.family_code,f.active_roster
        from public.acs_people p join public.acs_families f on f.id=p.family_id
        where p.id=${personId}::uuid and p.active=true limit 1`;
      if(!primary||!primary.active_roster)return {status:404,error:"Pessoa ou família ativa não localizada"};
      const familyId=String(primary.family_id);
      const participants=await tx<any[]>`select id,full_name from public.acs_people
        where family_id=${familyId}::uuid and active=true and id in ${tx(ids)}`;
      if(participants.length!==ids.length)return {status:422,error:"Um ou mais participantes não pertencem à família ativa"};
      if(agenda){
        const [a]=await tx<any[]>`select id from public.acs_agenda_items
          where id=${agenda}::uuid and family_id=${familyId}::uuid and scheduled_date=${date}::date and status='pendente'`;
        if(!a)return {status:422,error:"Agendamento não corresponde à família e data"};
      }
      await tx`select pg_advisory_xact_lock(hashtext(${familyId}),hashtext(${date}))`;
      const [saved]=await tx<any[]>`select g.id,g.status,vf.id form_id,vf.visit_id
        from public.acs_visit_groups g
        left join public.acs_visit_forms vf on vf.group_id=g.id
        where g.id=${id}::uuid limit 1`;
      if(saved){
        if(saved.status==="completed"&&saved.visit_id)return {ok:true,replayed:true,group_id:saved.id,form_id:saved.form_id,visit_id:saved.visit_id,official:false};
        return {status:409,code:"incomplete_group",error:"Registro existente e incompleto: requer conferência antes de repetir"};
      }
      const [other]=await tx<any[]>`select id from public.acs_visit_groups
        where family_id=${familyId}::uuid and visit_date=${date}::date
        and visit_scope='familia_periodica' and status='completed' limit 1`;
      if(other)return {status:409,code:"duplicate_same_day",error:"Já existe visita familiar concluída nesta data",existing_group_id:other.id};
      const formId=crypto.randomUUID();
      const visitId=crypto.randomUUID();
      const attendance=participants.map((p:any)=>({id:p.id,name:p.full_name}));
      const answers={
        visit_scope:"family",official_visit:{outcome:"Visita realizada",motives:["Visita periódica"],active_search:[],followup:[],measurements:{}},
        family_periodic_present:attendance,selected_family_members:ids,general_notes:notes,
        visit_group_id:id,standalone_visit_version:"acs360-unified-v1"
      };
      await tx`insert into public.acs_visit_groups
        (id,family_id,primary_person_id,agenda_item_id,visit_date,visit_time,visit_scope,source,general_notes,signer_name,signature_data,signed_at,status,created_by)
        values (${id}::uuid,${familyId}::uuid,${personId}::uuid,${agenda}::uuid,
        ${date}::date,${time}::time,'familia_periodica','ACS360 visita unificada v1',
        ${notes},${signer},${sig},${sig?new Date().toISOString():null}::timestamptz,'completed',${actor.user_id}::uuid)`;
      for(const mid of ids){
        await tx`insert into public.acs_visit_group_members(group_id,person_id,is_primary)
          values (${id}::uuid,${mid}::uuid,${mid===personId})`;
      }
      await tx`insert into public.acs_visits
        (id,legacy_key,family_id,person_id,family_code,patient_name,visit_date,visit_time,status,visit_type,notes,official,source,created_by,updated_by)
        values (${visitId}::uuid,${"manual:questionario:"+formId},
        ${familyId}::uuid,${personId}::uuid,${primary.family_code},${primary.full_name},
        ${date}::date,${time}::time,'realizada','domiciliar',
        ${notes||"Visita periódica familiar"},false,'ACS360 visita unificada',${actor.user_id}::uuid,${actor.user_id}::uuid)`;
      await tx`insert into public.acs_visit_forms
        (id,group_id,family_id,person_id,visit_id,patient_name,family_code,visit_date,visit_time,visit_result,status,answers,questionnaire_snapshot,signer_name,signature_data,signed_at,notes,created_by,updated_by)
        values (${formId}::uuid,${id}::uuid,${familyId}::uuid,${personId}::uuid,${visitId}::uuid,
        ${primary.full_name},${primary.family_code},${date}::date,${time}::time,
        'Visita realizada','completed',${tx.json(answers)},${tx.json([])},${signer},${sig},
        ${sig?new Date().toISOString():null}::timestamptz,${notes},${actor.user_id}::uuid,${actor.user_id}::uuid)`;
      await tx`update public.acs_visit_group_members set visit_form_id=${formId}::uuid
        where group_id=${id}::uuid and person_id=${personId}::uuid`;
      if(agenda)await tx`update public.acs_agenda_items set status='concluida',completed_at=now(),updated_at=now()
        where id=${agenda}::uuid`;
      return {ok:true,group_id:id,form_id:formId,visit_id:visitId,official:false,participants:ids.length};
    });
    const http=(response as any).status||200;
    return reply(response,http,origin);
  }catch(e){
    console.error("Erro interno ao registrar visita familiar");
    return reply({error:"Erro de gravação. Nenhum registro parcial deve ser confirmado; confira o histórico."},500,origin);
  }
});