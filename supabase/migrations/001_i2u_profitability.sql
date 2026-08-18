-- i2u profitability dashboard schema

create extension if not exists "pgcrypto";

create table public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hourly_rate_brl numeric(10, 2) not null check (hourly_rate_brl >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  contract_value_brl numeric(12, 2) check (contract_value_brl is null or contract_value_brl >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  developer_id uuid not null references public.developers (id) on delete restrict,
  work_date date not null,
  hours_decimal numeric(8, 4) not null check (hours_decimal > 0),
  task_description text,
  created_at timestamptz not null default now()
);

create index time_entries_project_id_idx on public.time_entries (project_id);
create index time_entries_developer_id_idx on public.time_entries (developer_id);
create index time_entries_work_date_idx on public.time_entries (work_date desc);

create or replace view public.project_profitability as
select
  p.id as project_id,
  p.slug,
  p.name,
  p.contract_value_brl as revenue_brl,
  coalesce(sum(te.hours_decimal), 0) as total_hours,
  coalesce(sum(te.hours_decimal * d.hourly_rate_brl), 0) as labor_cost_brl,
  case
    when p.contract_value_brl is null then null
    else p.contract_value_brl - coalesce(sum(te.hours_decimal * d.hourly_rate_brl), 0)
  end as margin_brl,
  case
    when p.contract_value_brl is null or p.contract_value_brl = 0 then null
    else round(
      (
        (p.contract_value_brl - coalesce(sum(te.hours_decimal * d.hourly_rate_brl), 0))
        / p.contract_value_brl
      ) * 100,
      1
    )
  end as margin_pct,
  case
    when p.contract_value_brl is null then 'sem_valor'
    when p.contract_value_brl - coalesce(sum(te.hours_decimal * d.hourly_rate_brl), 0) >= 0 then 'lucro'
    else 'prejuizo'
  end as status
from public.projects p
left join public.time_entries te on te.project_id = p.id
left join public.developers d on d.id = te.developer_id
group by p.id, p.slug, p.name, p.contract_value_brl;

alter table public.developers enable row level security;
alter table public.projects enable row level security;
alter table public.time_entries enable row level security;

create policy "anon_read_developers" on public.developers
  for select to anon, authenticated using (true);

create policy "anon_read_projects" on public.projects
  for select to anon, authenticated using (true);

create policy "anon_read_time_entries" on public.time_entries
  for select to anon, authenticated using (true);

create policy "anon_write_developers" on public.developers
  for all to anon, authenticated using (true) with check (true);

create policy "anon_write_projects" on public.projects
  for all to anon, authenticated using (true) with check (true);

create policy "anon_write_time_entries" on public.time_entries
  for all to anon, authenticated using (true) with check (true);

grant select on public.project_profitability to anon, authenticated;
grant all on public.developers to anon, authenticated;
grant all on public.projects to anon, authenticated;
grant all on public.time_entries to anon, authenticated;
