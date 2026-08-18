-- Figma design link per project

alter table public.projects
  add column if not exists figma_url text;

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
  p.figma_url,
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
  p.status_note, p.status_note_updated_at, p.figma_url, p.linear_project_id, p.linear_url,
  p.lead_developer_id, lead_dev.name, p.linear_synced_at;

grant select on public.project_profitability to anon, authenticated;
