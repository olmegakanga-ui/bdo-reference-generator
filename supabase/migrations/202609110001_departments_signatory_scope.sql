insert into public.departments (name, engagement_code, correspondence_code)
select 'Ressources Humaines', 'RH', 'RH'
where not exists (
  select 1
  from public.departments
  where lower(name) = lower('Ressources Humaines')
);

insert into public.engagement_counters (department_id, last_number)
select id, 0
from public.departments
where lower(name) = lower('Ressources Humaines')
  and not exists (
    select 1
    from public.engagement_counters
    where department_id = public.departments.id
  );

alter table public.signatories
  add column if not exists document_type text;

update public.signatories
set document_type = 'engagement'
where document_type is null;

alter table public.signatories
  alter column document_type set not null;

alter table public.signatories
  drop constraint if exists signatories_document_type_check;

alter table public.signatories
  add constraint signatories_document_type_check
  check (document_type in ('engagement', 'correspondence'));

create index if not exists signatories_document_type_active_idx
  on public.signatories (document_type, is_active);

comment on column public.signatories.document_type is
  'Module dans lequel le signataire peut être sélectionné: engagement ou correspondence.';
