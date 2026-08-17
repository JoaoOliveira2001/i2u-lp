-- Bot monitoring for Blip/n8n integrations (per project)

create table if not exists public.bot_monitors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  label text not null,
  n8n_webhook_url text,
  n8n_api_token text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_events (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid references public.bot_monitors (id) on delete set null,
  project_id uuid not null references public.projects (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'success',
      'error',
      'exception_redirect',
      'conversation_start',
      'conversation_end',
      'other'
    )
  ),
  block_id text,
  block_name text,
  conversation_id text,
  contact_id text,
  error_code text,
  error_message text,
  raw_payload jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bot_events_project_occurred_idx
  on public.bot_events (project_id, occurred_at desc);

create index if not exists bot_events_type_idx
  on public.bot_events (event_type);

create index if not exists bot_events_block_idx
  on public.bot_events (project_id, block_name, block_id);

create index if not exists bot_events_conversation_idx
  on public.bot_events (conversation_id)
  where conversation_id is not null;

create or replace view public.bot_monitor_summary as
select
  p.id as project_id,
  p.slug,
  p.name as project_name,
  bm.id as monitor_id,
  bm.label as monitor_label,
  bm.n8n_webhook_url,
  bm.active as monitor_active,
  count(e.id) filter (where e.event_type in ('success', 'conversation_end')) as success_count,
  count(e.id) filter (where e.event_type = 'error') as error_count,
  count(e.id) filter (where e.event_type = 'exception_redirect') as exception_redirect_count,
  count(e.id) filter (where e.event_type = 'conversation_start') as conversation_start_count,
  count(distinct e.conversation_id) filter (where e.conversation_id is not null) as unique_conversations,
  max(e.occurred_at) as last_event_at
from public.projects p
left join public.bot_monitors bm on bm.project_id = p.id
left join public.bot_events e on e.project_id = p.id
group by p.id, p.slug, p.name, bm.id, bm.label, bm.n8n_webhook_url, bm.active;

create or replace view public.bot_monitor_block_stats as
select
  e.project_id,
  coalesce(nullif(trim(e.block_name), ''), nullif(trim(e.block_id), ''), 'Sem bloco') as block_label,
  e.block_id,
  e.block_name,
  count(*) filter (where e.event_type = 'exception_redirect') as redirect_count,
  count(*) filter (where e.event_type = 'error') as error_count,
  count(*) filter (where e.event_type in ('exception_redirect', 'error')) as total_exception_hits
from public.bot_events e
where e.event_type in ('exception_redirect', 'error')
group by e.project_id, e.block_id, e.block_name;

alter table public.bot_monitors enable row level security;
alter table public.bot_events enable row level security;

create policy "anon_read_bot_monitors" on public.bot_monitors
  for select to anon, authenticated using (true);

create policy "anon_write_bot_monitors" on public.bot_monitors
  for all to anon, authenticated using (true) with check (true);

create policy "anon_read_bot_events" on public.bot_events
  for select to anon, authenticated using (true);

create policy "anon_write_bot_events" on public.bot_events
  for insert to anon, authenticated with check (true);

grant all on public.bot_monitors to anon, authenticated;
grant all on public.bot_events to anon, authenticated;
grant select on public.bot_monitor_summary to anon, authenticated;
grant select on public.bot_monitor_block_stats to anon, authenticated;

-- G2L / GL2 monitor config
insert into public.bot_monitors (project_id, label, n8n_webhook_url, n8n_api_token)
select
  p.id,
  'G2L — escuta Blip',
  'https://n8n.recargaclub.com.br/webhook/escuta-blip',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDkwYzg4Yy1mYTE5LTQ3MzItODY3Yy1hODNjYzIwNGI1ZjEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzg0ODE5NTY5LCJleHAiOjE3ODczNzEyMDB9.HOlsezPRP_QyEN2g1rUI1_LOSP___r26yIlT1X5ECxc'
from public.projects p
where p.slug = 'gl2'
on conflict (project_id) do update set
  label = excluded.label,
  n8n_webhook_url = excluded.n8n_webhook_url,
  n8n_api_token = excluded.n8n_api_token,
  updated_at = now();

insert into public.shared_credentials (label, service, url, password, notes, sort_order)
values (
  'n8n G2L — escuta Blip',
  'n8n',
  'https://n8n.recargaclub.com.br/webhook/escuta-blip',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDkwYzg4Yy1mYTE5LTQ3MzItODY3Yy1hODNjYzIwNGI1ZjEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzg0ODE5NTY5LCJleHAiOjE3ODczNzEyMDB9.HOlsezPRP_QyEN2g1rUI1_LOSP___r26yIlT1X5ECxc',
  'Webhook n8n que escuta eventos do bot Blip G2L. Token JWT para API pública n8n.',
  2
)
on conflict (label) do update set
  service = excluded.service,
  url = excluded.url,
  password = excluded.password,
  notes = excluded.notes,
  sort_order = excluded.sort_order,
  updated_at = now();
