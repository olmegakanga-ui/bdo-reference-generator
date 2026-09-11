insert into public.departments (name, engagement_code, correspondence_code)
select 'Administration', 'ADMIN', 'ADMIN'
where not exists (
  select 1
  from public.departments
  where lower(name) = lower('Administration')
);

insert into public.engagement_counters (department_id, last_number)
select id, 0
from public.departments
where lower(name) = lower('Administration')
  and not exists (
    select 1
    from public.engagement_counters
    where department_id = public.departments.id
  );
