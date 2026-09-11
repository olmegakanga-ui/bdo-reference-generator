-- The application has three explicit user categories.
-- Administrators retain access to the Risk dashboard without being downgraded.
alter table public.users
drop constraint if exists users_role_check;

alter table public.users
add constraint users_role_check
check (role in ('user', 'risk', 'admin'));

update public.users
set role = 'risk'
where lower(email) in (
  'sarman.ilunga@bdo-ea.com',
  'brakini.biavanga@bdo-ea.com'
)
and role <> 'admin';
