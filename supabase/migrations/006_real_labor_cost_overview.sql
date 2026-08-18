-- Overview uses real labor cost (all devs). Monthly closing excludes João/Pedro.

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
group by p.id, p.slug, p.name, p.status, p.contract_value_brl, p.payment_date, p.notes;

grant select on public.project_profitability to anon, authenticated;
