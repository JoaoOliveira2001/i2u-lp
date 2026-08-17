-- Links for bot error investigation (n8n execution + Blip contact)

alter table public.bot_monitors
  add column if not exists blip_app_id text;

alter table public.bot_events
  add column if not exists n8n_execution_url text,
  add column if not exists blip_contact_url text;

comment on column public.bot_monitors.blip_app_id is 'Slug/id do bot no portal Blip para montar links de contato';
comment on column public.bot_events.n8n_execution_url is 'Link direto para a execução do workflow n8n';
comment on column public.bot_events.blip_contact_url is 'Link para o contato/conversa no portal Blip';

update public.bot_monitors
set blip_app_id = coalesce(blip_app_id, 'g2l')
where project_id = (select id from public.projects where slug = 'gl2');
