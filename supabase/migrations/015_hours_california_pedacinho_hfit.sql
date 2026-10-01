-- Make Califórnia, Pedacinho do Céu, and HFIT selectable in /horas.
--
-- Califórnia already exists as slug california (Linear SM2 project
-- https://linear.app/sm2/project/california-55fe6d028a04) but status
-- finalized hid it from the dropdown. Reopen that same row.
-- Pedacinho do Céu and HFIT were not in Linear's synced projects or in
-- public.projects. Insert them as active hours projects with stable slugs.
-- No Linear URL is invented for those two.
--
-- Ids, contract values, and time_entries stay attached. Ongoing updates live
-- in src/lib/longlifeHoursProjects.js (npm run linear:ensure-hours-projects).

insert into public.projects (slug, name, status, linear_url, notes)
values
  (
    'california',
    'Califórnia',
    'active',
    'https://linear.app/sm2/project/california-55fe6d028a04',
    'Projeto vinculado ao Linear. Disponível para lançamento de horas.'
  ),
  (
    'pedacinho-do-ceu',
    'Pedacinho do Céu',
    'active',
    null,
    'Disponível para lançamento de horas. Sem projeto correspondente no Linear ainda.'
  ),
  (
    'hfit',
    'HFIT',
    'active',
    null,
    'Disponível para lançamento de horas. Sem projeto correspondente no Linear ainda.'
  )
on conflict (slug) do update set
  name = excluded.name,
  status = 'active',
  linear_url = coalesce(public.projects.linear_url, excluded.linear_url),
  notes = coalesce(public.projects.notes, excluded.notes);
