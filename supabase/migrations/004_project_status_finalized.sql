-- Status de projeto: active | finalized (oculto do dashboard)

alter table public.projects
  add column if not exists status text not null default 'active'
    check (status in ('active', 'finalized'));

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
  coalesce(sum(te.hours_decimal), 0) as total_hours,
  coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0) as labor_cost_brl,
  case
    when p.contract_value_brl is null then null
    else p.contract_value_brl - coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0)
  end as margin_brl,
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
    when p.contract_value_brl is null then 'sem_valor'
    when p.contract_value_brl - coalesce(sum(te.hours_decimal * coalesce(d.hourly_rate_brl, 0)), 0) >= 0 then 'lucro'
    else 'prejuizo'
  end as status
from public.projects p
left join public.time_entries te on te.project_id = p.id
left join public.developers d on d.id = te.developer_id
group by p.id, p.slug, p.name, p.status, p.contract_value_brl, p.payment_date, p.notes;

grant select on public.project_profitability to anon, authenticated;
