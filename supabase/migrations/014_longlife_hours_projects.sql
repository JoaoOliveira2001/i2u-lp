-- Bootstrap the current Linear Longlife workspace projects into public.projects.
-- /horas lists non-finalized, non-archived rows from this table.
--
-- Ongoing pairing lives in src/lib/longlifeHoursProjects.js:
--   npm run linear:sync                  (needs LINEAR_API_KEY for Longlife)
--   npm run linear:ensure-hours-projects (catalog fallback, no API key)
--
-- On conflict we only fill a missing linear_url. Ids, names, status, and
-- contract values stay put so existing time_entries are not orphaned.

insert into public.projects (slug, name, status, linear_url, notes)
values
  (
    'longlife',
    'Longlife',
    'active',
    'https://linear.app/longlife/project/longlife-8fdb5a8d09aa',
    'Projeto Linear Longlife (P-LON-1, Backlog).'
  ),
  (
    'sm2-integracoes',
    'SM2 — Integrações',
    'active',
    'https://linear.app/longlife/project/sm2-integracoes-af25d4453cd5',
    'Projeto Linear Longlife (P-LON-2, In Progress).'
  )
on conflict (slug) do update set
  linear_url = coalesce(public.projects.linear_url, excluded.linear_url)
where public.projects.linear_url is null;
