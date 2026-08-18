-- Seed data for i2u profitability dashboard

insert into public.developers (name, hourly_rate_brl, cost_model, fixed_monthly_cost_brl) values
  ('Kel', 50.00, 'hourly', null),
  ('Leandro', 20.00, 'hourly', null),
  ('João', 70.00, 'hourly', null),
  ('Pedro', 100.00, 'hourly', null),
  ('Luiz', null, 'fixed_monthly', 700.00)
on conflict (name) do update set
  hourly_rate_brl = excluded.hourly_rate_brl,
  cost_model = excluded.cost_model,
  fixed_monthly_cost_brl = excluded.fixed_monthly_cost_brl;

insert into public.projects (slug, name, contract_value_brl) values
  ('kringe', 'Kringe', 1500.00),
  ('petite', 'Petite', 1200.00),
  ('aqualife', 'Aqualife', 1000.00),
  ('otto', 'Otto', 500.00),
  ('igr', 'IGR', 6000.00),
  ('orlario', 'OrlaRio', 4000.00),
  ('vatech', 'Vatech', 4000.00),
  ('cumbuca', 'Cumbuca', 1250.00),
  ('recargaclub', 'RecargaClub', 1500.00),
  ('uri-santo-angelo', 'URI Santo Angelo', 500.00),
  ('california', 'California', 800.00),
  ('yeva', 'Yeva', 2500.00)
on conflict (slug) do update set
  name = excluded.name,
  contract_value_brl = coalesce(excluded.contract_value_brl, projects.contract_value_brl);

-- Otto e URI Santo Angelo: ex-funcionário, R$ 1.000 total dividido 50/50, finalizados
update public.projects set
  status = 'finalized',
  notes = 'Ex-funcionário — R$ 1.000 total dividido 50/50 com URI Santo Angelo'
where slug = 'otto';

update public.projects set
  status = 'finalized',
  notes = 'Ex-funcionário — R$ 1.000 total dividido 50/50 com Otto'
where slug = 'uri-santo-angelo';

-- Leandro time entries
insert into public.time_entries (project_id, developer_id, work_date, hours_decimal, task_description)
select p.id, d.id, v.work_date::date, v.hours_decimal, v.task_description
from (values
  ('petite', 'Leandro', '2026-05-21', 0.6667, null),
  ('vatech', 'Leandro', '2026-06-03', 2.0000, null),
  ('vatech', 'Leandro', '2026-06-16', 2.0000, null),
  ('vatech', 'Leandro', '2026-06-17', 1.0000, null),
  ('petite', 'Leandro', '2026-06-18', 6.0000, null)
) as v(slug, dev_name, work_date, hours_decimal, task_description)
join public.projects p on p.slug = v.slug
join public.developers d on d.name = v.dev_name
where not exists (
  select 1 from public.time_entries te
  where te.project_id = p.id
    and te.developer_id = d.id
    and te.work_date = v.work_date::date
    and te.hours_decimal = v.hours_decimal
);

-- Kel time entries (maio + junho)
insert into public.time_entries (project_id, developer_id, work_date, hours_decimal, task_description)
select p.id, d.id, v.work_date::date, v.hours_decimal, v.task_description
from (values
  ('cumbuca', 'Kel', '2026-05-13', 4.6667, 'Inatividade / Relatorio'),
  ('cumbuca', 'Kel', '2026-05-15', 2.5000, 'Ajuste IA'),
  ('cumbuca', 'Kel', '2026-05-25', 0.6667, 'Ajuste IA'),
  ('cumbuca', 'Kel', '2026-05-26', 1.6667, 'Ajuste IA'),
  ('cumbuca', 'Kel', '2026-05-30', 2.5000, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-05-15', 2.4167, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-05-25', 0.6667, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-05-27', 1.6667, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-05-28', 2.6667, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-05-29', 3.0000, 'Ajuste IA'),
  ('kringe', 'Kel', '2026-05-15', 1.3333, 'Novo Bot'),
  ('kringe', 'Kel', '2026-05-19', 1.0000, 'Ajustes na IA'),
  ('kringe', 'Kel', '2026-05-20', 0.7833, 'Ajustes na IA'),
  ('cumbuca', 'Kel', '2026-06-09', 1.5000, 'Ajuste IA'),
  ('cumbuca', 'Kel', '2026-06-15', 2.6667, 'Ajuste IA'),
  ('cumbuca', 'Kel', '2026-06-19', 0.6667, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-06-11', 0.5000, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-06-15', 1.0000, 'Ajuste IA'),
  ('aqualife', 'Kel', '2026-06-18', 0.3333, 'Ajuste IA'),
  ('recargaclub', 'Kel', '2026-06-16', 3.1667, 'Ajuste n8n'),
  ('yeva', 'Kel', '2026-06-18', 1.0000, 'Ajuste n8n'),
  ('kringe', 'João', '2026-06-21', 20.0000, null),
  ('orlario', 'João', '2026-06-21', 2.0000, null),
  ('aqualife', 'João', '2026-06-21', 5.0000, null),
  ('yeva', 'João', '2026-06-21', 35.0000, null)
) as v(slug, dev_name, work_date, hours_decimal, task_description)
join public.projects p on p.slug = v.slug
join public.developers d on d.name = v.dev_name
where not exists (
  select 1 from public.time_entries te
  where te.project_id = p.id
    and te.developer_id = d.id
    and te.work_date = v.work_date::date
    and te.hours_decimal = v.hours_decimal
);
