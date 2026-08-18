-- Linear integration: project link, issues cache, user mapping

alter table public.projects
  add column if not exists linear_project_id text unique,
  add column if not exists linear_url text,
  add column if not exists lead_developer_id uuid references public.developers (id) on delete set null,
  add column if not exists linear_synced_at timestamptz,
  add column if not exists linear_archived_at timestamptz;

create index if not exists projects_linear_project_id_idx
  on public.projects (linear_project_id)
  where linear_project_id is not null;

create index if not exists projects_lead_developer_id_idx
  on public.projects (lead_developer_id);

create table if not exists public.linear_user_map (
  id uuid primary key default gen_random_uuid(),
  linear_user_id text not null unique,
  linear_user_name text not null,
  developer_id uuid references public.developers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.linear_issues (
  id uuid primary key default gen_random_uuid(),
  linear_issue_id text not null unique,
  project_id uuid not null references public.projects (id) on delete cascade,
  identifier text,
  title text not null,
  state_name text,
  state_type text,
  assignee_linear_id text,
  assignee_name text,
  priority int,
  url text,
  completed_at timestamptz,
  linear_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists linear_issues_project_id_idx
  on public.linear_issues (project_id);

create index if not exists linear_issues_state_type_idx
  on public.linear_issues (project_id, state_type);

alter table public.linear_user_map enable row level security;
alter table public.linear_issues enable row level security;

create policy "anon_read_linear_user_map" on public.linear_user_map
  for select to anon, authenticated using (true);

create policy "anon_write_linear_user_map" on public.linear_user_map
  for all to anon, authenticated using (true) with check (true);

create policy "anon_read_linear_issues" on public.linear_issues
  for select to anon, authenticated using (true);

create policy "anon_write_linear_issues" on public.linear_issues
  for all to anon, authenticated using (true) with check (true);

grant all on public.linear_user_map to anon, authenticated;
grant all on public.linear_issues to anon, authenticated;

drop view if exists public.project_profitability;

create view public.project_profitability as
select
  p.id as project_id,
  p.slug,
  p.name,
  p.status as project_status,
  p.contract_value_brl as revenue_brl,
  p.payment_date,
  p.notes,
  p.status_note,
  p.status_note_updated_at,
  p.linear_project_id,
  p.linear_url,
  p.lead_developer_id,
  lead_dev.name as lead_developer_name,
  p.linear_synced_at,
  (
    select count(*)::int
    from public.linear_issues li
    where li.project_id = p.id
      and coalesce(li.state_type, '') not in ('completed', 'canceled')
  ) as linear_open_issues,
  coalesce(sum(te.hours_decimal), 0) as total_hours,
  coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0) as labor_cost_brl,
  coalesce(sum(
    case
      when d.name in ('João', 'Pedro') then 0
      else te.hours_decimal * coalesce(d.hourly_rate_brl, 0)
    end
  ), 0) as labor_cost_closing_brl,
  case
    when p.contract_value_brl is null then null
    else p.contract_value_brl - coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0)
  end as margin_brl,
  case
    when p.contract_value_brl is null then null
    else p.contract_value_brl - coalesce(sum(
      case
        when d.name in ('João', 'Pedro') then 0
        else te.hours_decimal * coalesce(d.hourly_rate_brl, 0)
      end
    ), 0)
  end as margin_closing_brl,
  case
    when p.contract_value_brl is null or p.contract_value_brl = 0 then null
    else round(
      (
        (p.contract_value_brl - coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0))
        / p.contract_value_brl
      ) * 100,
      1
    )
  end as margin_pct,
  case
    when p.contract_value_brl is null or p.contract_value_brl = 0 then null
    else round(
      (
        (p.contract_value_brl - coalesce(sum(
          case
            when d.name in ('João', 'Pedro') then 0
            else te.hours_decimal * coalesce(d.hourly_rate_brl, 0)
          end
        ), 0))
        / p.contract_value_brl
      ) * 100,
      1
    )
  end as margin_closing_pct,
  case
    when p.contract_value_brl is null then 'sem_valor'
    when p.contract_value_brl - coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0) >= 0
      then 'lucro'
    else 'prejuizo'
  end as status,
  case
    when p.contract_value_brl is null then 'sem_valor'
    when p.contract_value_brl - coalesce(sum(
      case
        when d.name in ('João', 'Pedro') then 0
        else te.hours_decimal * coalesce(d.hourly_rate_brl, 0)
      end
    ), 0) >= 0 then 'lucro'
    else 'prejuizo'
  end as status_closing
from public.projects p
left join public.developers lead_dev on lead_dev.id = p.lead_developer_id
left join public.time_entries te on te.project_id = p.id
left join public.developers d on d.id = te.developer_id
group by
  p.id, p.slug, p.name, p.status, p.contract_value_brl, p.payment_date, p.notes,
  p.status_note, p.status_note_updated_at, p.linear_project_id, p.linear_url,
  p.lead_developer_id, lead_dev.name, p.linear_synced_at;

grant select on public.project_profitability to anon, authenticated;
