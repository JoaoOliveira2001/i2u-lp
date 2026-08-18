-- Shared integration credentials for internal dashboard (Senhas tab)

create table if not exists public.shared_credentials (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  service text,
  email text,
  username text,
  password text not null,
  url text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_credentials_sort_order_idx
  on public.shared_credentials (sort_order, label);

alter table public.shared_credentials enable row level security;

create policy "anon_read_shared_credentials" on public.shared_credentials
  for select to anon, authenticated using (true);

create policy "anon_write_shared_credentials" on public.shared_credentials
  for all to anon, authenticated using (true) with check (true);

grant all on public.shared_credentials to anon, authenticated;

insert into public.shared_credentials (label, service, email, password, notes, sort_order)
values (
  'Blip da Integration',
  'Blip',
  'integration2u@gmail.com',
  'DEVintegration1@',
  'Conta Blip usada pela Integration2U para bots e integrações.',
  1
)
on conflict (label) do update set
  service = excluded.service,
  email = excluded.email,
  password = excluded.password,
  notes = excluded.notes,
  sort_order = excluded.sort_order,
  updated_at = now();
