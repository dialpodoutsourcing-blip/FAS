begin;

alter table public.artifacts
  add column if not exists export_theme text;

update public.artifacts
set export_theme = 'editorial-strategy'
where export_theme is null
   or export_theme not in ('editorial-strategy', 'luxury-editorial', 'boardroom-consultancy');

alter table public.artifacts
  alter column export_theme set default 'editorial-strategy',
  alter column export_theme set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.artifacts'::regclass
      and conname = 'artifacts_export_theme_check'
  ) then
    alter table public.artifacts
      add constraint artifacts_export_theme_check
      check (export_theme in ('editorial-strategy', 'luxury-editorial', 'boardroom-consultancy'));
  end if;
end;
$$;

commit;
