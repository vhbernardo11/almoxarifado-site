-- ESF06 NEXT v37
-- RASCUNHO PARA HOMOLOGAÇÃO. NÃO APLICADO EM PRODUÇÃO.
-- A migration definitiva será gerada e testada no ambiente Supabase de desenvolvimento.

-- 1) Encaminhamento longitudinal ------------------------------------------------
create table if not exists public.acs_referrals_v37 (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.acs_people(id),
  family_id uuid references public.acs_families(id),
  legacy_task_id uuid references public.acs_tasks(id),
  referral_type text not null default 'encaminhamento',
  title text not null,
  destination text,
  priority text not null default 'media',
  current_status text not null default 'solicitado'
    check (current_status in ('solicitado','entregue','agendado','realizado','resultado_recebido','retorno_concluido','cancelado')),
  requested_on date,
  delivered_on date,
  appointment_at timestamptz,
  performed_on date,
  result_received_on date,
  closed_on date,
  protocol text,
  notes text,
  source text,
  created_by uuid references public.acs_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists acs_referrals_v37_legacy_task_uidx on public.acs_referrals_v37(legacy_task_id) where legacy_task_id is not null;
create index if not exists acs_referrals_v37_person_idx on public.acs_referrals_v37(person_id,current_status);
create index if not exists acs_referrals_v37_appointment_idx on public.acs_referrals_v37(appointment_at) where current_status not in ('retorno_concluido','cancelado');

create table if not exists public.acs_referral_events_v37 (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.acs_referrals_v37(id) on delete cascade,
  event_type text not null check (event_type in ('solicitado','entregue','agendado','realizado','resultado_recebido','retorno_concluido','cancelado','observacao')),
  event_at timestamptz not null default now(),
  notes text,
  source text,
  created_by uuid references public.acs_profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists acs_referral_events_v37_ref_idx on public.acs_referral_events_v37(referral_id,event_at desc);

-- 2) Vacinação documentada -----------------------------------------------------
create table if not exists public.acs_immunizations_v37 (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.acs_people(id),
  vaccine_key text,
  vaccine_name text not null,
  dose_label text,
  dose_number integer,
  administered_on date,
  lot text,
  facility text,
  municipality text,
  source_type text not null default 'informada'
    check (source_type in ('caderneta','documento','esus','equipe','informada','outro')),
  verification_status text not null default 'documentado'
    check (verification_status in ('documentado','confirmacao_pendente','descartado')),
  source_reference text,
  notes text,
  recorded_by uuid references public.acs_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists acs_immunizations_v37_person_idx on public.acs_immunizations_v37(person_id,administered_on desc);

-- Não existe campo 'atrasada' calculado automaticamente nesta tabela.
-- Pendência vacinal só será criada quando houver fonte/regra validada e ficará separada do registro de dose.
create table if not exists public.acs_vaccine_pending_v37 (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.acs_people(id),
  vaccine_name text not null,
  dose_label text,
  status text not null default 'confirmacao_pendente'
    check (status in ('confirmacao_pendente','busca_ativa','resolvida','descartada')),
  basis text not null,
  due_on date,
  notes text,
  source text,
  created_by uuid references public.acs_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists acs_vaccine_pending_v37_person_idx on public.acs_vaccine_pending_v37(person_id,status);

-- 3) Território / geolocalização ----------------------------------------------
create table if not exists public.acs_family_locations_v37 (
  family_id uuid primary key references public.acs_families(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  location_status text not null default 'nao_confirmada'
    check (location_status in ('nao_confirmada','aproximada','confirmada','nao_localizada')),
  source text,
  reference_text text,
  confirmed_by uuid references public.acs_profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);
create index if not exists acs_family_locations_v37_status_idx on public.acs_family_locations_v37(location_status);

-- 4) Qualidade cadastral: decisões humanas -----------------------------------
-- Os problemas são calculados ao vivo. Esta tabela guarda apenas decisão/auditoria
-- quando o ACS confirma, resolve ou conscientemente ignora um alerta.
create table if not exists public.acs_quality_resolutions_v37 (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('person','family')),
  entity_id uuid not null,
  issue_key text not null,
  status text not null check (status in ('resolvido','ignorado','confirmado_pendente')),
  notes text,
  decided_by uuid references public.acs_profiles(id),
  decided_at timestamptz not null default now(),
  unique(entity_type,entity_id,issue_key)
);

-- 5) Eventos cadastrais --------------------------------------------------------
-- Permite distinguir mudança de endereço, mudança de território, óbito e inativação
-- sem tentar inferir esses eventos apenas a partir do campo active.
create table if not exists public.acs_registry_events_v37 (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.acs_people(id),
  family_id uuid references public.acs_families(id),
  event_type text not null
    check (event_type in ('mudanca_endereco','mudanca_territorio','obito','inativacao','reativacao','mudanca_familia','correcao_cadastral')),
  event_on date not null default current_date,
  details jsonb not null default '{}'::jsonb,
  source text,
  created_by uuid references public.acs_profiles(id),
  created_at timestamptz not null default now(),
  check (person_id is not null or family_id is not null)
);
create index if not exists acs_registry_events_v37_person_idx on public.acs_registry_events_v37(person_id,event_on desc);
create index if not exists acs_registry_events_v37_family_idx on public.acs_registry_events_v37(family_id,event_on desc);

-- 6) Segurança planejada -------------------------------------------------------
-- Ao aplicar no branch de homologação:
--   alter table ... enable row level security;
--   políticas SELECT -> acs_is_active_user()
--   políticas INSERT/UPDATE -> acs_can_write()
--   DELETE físico deve ser evitado para dados longitudinais; preferir status/cancelamento.
-- Rodar Supabase security/performance advisors após o DDL.

-- 7) Offline -------------------------------------------------------------------
-- A fila offline fica NO DISPOSITIVO, não em uma tabela de outbox do servidor.
-- Os IDs de acs_visit_groups e acs_visit_forms já permitem upsert idempotente.
-- Não colocar agenda_add/smart_accept em fila automática: essas operações podem gerar duplicidade
-- ou alterar planejamento sem ação explícita do usuário.
