-- Public client portal per project (tasks + hours)

alter table public.projects
  add column if not exists client_portal_enabled boolean not null default false,
  add column if not exists client_portal_slug text,
  add column if not exists included_hours_monthly numeric(8, 2);

create unique index if not exists projects_client_portal_slug_idx
  on public.projects (client_portal_slug)
  where client_portal_slug is not null;

drop view if exists public.client_profitability;
drop view if exists public.project_profitability;

create view public.project_profitability as
select
  p.id as project_id,
  p.slug,
  p.name,
  p.status as project_status,
  p.client_id,
  c.name as client_name,
  c.slug as client_slug,
  p.contract_value_brl as revenue_brl,
  p.payment_date,
  p.notes,
  p.status_note,
  p.status_note_updated_at,
  p.figma_url,
  p.client_portal_enabled,
  p.client_portal_slug,
  p.included_hours_monthly,
  p.linear_project_id,
  p.linear_url,
  p.lead_developer_id,
  lead_dev.name as lead_developer_name,
  p.product_owner_id,
  po.name as product_owner_name,
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
left join public.clients c on c.id = p.client_id
left join public.developers lead_dev on lead_dev.id = p.lead_developer_id
left join public.product_owners po on po.id = p.product_owner_id
left join public.time_entries te on te.project_id = p.id
left join public.developers d on d.id = te.developer_id
group by
  p.id, p.slug, p.name, p.status, p.client_id, c.name, c.slug,
  p.contract_value_brl, p.payment_date, p.notes,
  p.status_note, p.status_note_updated_at, p.figma_url,
  p.client_portal_enabled, p.client_portal_slug, p.included_hours_monthly,
  p.linear_project_id, p.linear_url,
  p.lead_developer_id, lead_dev.name, p.product_owner_id, po.name, p.linear_synced_at;

grant select on public.project_profitability to anon, authenticated;

create view public.client_profitability as
select
  c.id as client_id,
  c.name as client_name,
  c.slug as client_slug,
  count(pp.project_id) as project_count,
  count(pp.project_id) filter (where pp.project_status = 'active') as active_project_count,
  coalesce(sum(pp.revenue_brl), 0) as total_revenue_brl,
  coalesce(sum(pp.total_hours), 0) as total_hours,
  coalesce(sum(pp.labor_cost_brl), 0) as total_labor_cost_brl,
  coalesce(sum(pp.labor_cost_closing_brl), 0) as total_labor_cost_closing_brl,
  coalesce(sum(pp.margin_brl), 0) as total_margin_brl,
  coalesce(sum(pp.margin_closing_brl), 0) as total_margin_closing_brl,
  case
    when coalesce(sum(pp.revenue_brl), 0) = 0 then null
    else round(coalesce(sum(pp.total_hours), 0) / sum(pp.revenue_brl) * 1000, 2)
  end as hours_per_1000_brl,
  case
    when coalesce(sum(pp.revenue_brl), 0) = 0 then null
    else round(coalesce(sum(pp.margin_brl), 0) / sum(pp.revenue_brl) * 100, 1)
  end as margin_pct
from public.clients c
left join public.project_profitability pp on pp.client_id = c.id
group by c.id, c.name, c.slug
order by c.name;

grant select on public.client_profitability to anon, authenticated;

update public.projects
set
  client_portal_enabled = true,
  client_portal_slug = 'longlife',
  included_hours_monthly = 30
where slug = 'longlife';
