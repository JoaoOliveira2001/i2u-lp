-- Operational status notes with history log

alter table public.projects
  add column if not exists status_note text,
  add column if not exists status_note_updated_at timestamptz;

create table if not exists public.project_status_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  note text not null,
  source text not null default 'manual' check (source in ('manual', 'assistant')),
  created_at timestamptz not null default now()
);

create index if not exists project_status_logs_project_id_idx
  on public.project_status_logs (project_id, created_at desc);

alter table public.project_status_logs enable row level security;

create policy "anon_read_status_logs" on public.project_status_logs
  for select to anon, authenticated using (true);

create policy "anon_write_status_logs" on public.project_status_logs
  for all to anon, authenticated using (true) with check (true);

grant all on public.project_status_logs to anon, authenticated;

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
left join public.time_entries te on te.project_id = p.id
left join public.developers d on d.id = te.developer_id
group by
  p.id, p.slug, p.name, p.status, p.contract_value_brl, p.payment_date, p.notes,
  p.status_note, p.status_note_updated_at;

grant select on public.project_profitability to anon, authenticated;

-- Seed example for OrlaRio
insert into public.project_status_logs (project_id, note, source)
select p.id, 'Falta cliente aprovar escopo', 'manual'
from public.projects p
where p.slug = 'orlario'
  and not exists (
    select 1 from public.project_status_logs l
    where l.project_id = p.id and l.note = 'Falta cliente aprovar escopo'
  );

update public.projects
set
  status_note = 'Falta cliente aprovar escopo',
  status_note_updated_at = now()
where slug = 'orlario' and status_note is null;
