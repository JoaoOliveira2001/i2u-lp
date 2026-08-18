-- Suporte a custo fixo mensal (ex: Luiz R$ 700/mês)

alter table public.developers
  alter column hourly_rate_brl drop not null,
  add column if not exists cost_model text not null default 'hourly'
    check (cost_model in ('hourly', 'fixed_monthly')),
  add column if not exists fixed_monthly_cost_brl numeric(10, 2)
    check (fixed_monthly_cost_brl is null or fixed_monthly_cost_brl >= 0);

insert into public.developers (name, cost_model, fixed_monthly_cost_brl, hourly_rate_brl, active)
values ('Luiz', 'fixed_monthly', 700.00, null, true)
on conflict (name) do update set
  cost_model = excluded.cost_model,
  fixed_monthly_cost_brl = excluded.fixed_monthly_cost_brl,
  hourly_rate_brl = excluded.hourly_rate_brl,
  active = excluded.active;
