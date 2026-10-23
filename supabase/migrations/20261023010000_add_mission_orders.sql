create table if not exists public.mission_order_counters (
  id bigint generated always as identity primary key,
  signatory_id bigint not null unique references public.signatories(id),
  last_number integer not null default 0 check (last_number >= 0),
  updated_at timestamptz not null default now()
);

insert into public.mission_order_counters (signatory_id, last_number)
select id, 0
from public.signatories
on conflict (signatory_id) do nothing;

create table if not exists public.mission_orders (
  id bigint generated always as identity primary key,
  employee_name text not null check (btrim(employee_name) <> ''),
  mission_subject text not null check (btrim(mission_subject) <> ''),
  issue_date date not null,
  signatory_id bigint not null references public.signatories(id),
  sequence_number integer not null check (sequence_number >= 1),
  reference_number text not null unique,
  created_by_email text,
  updated_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mission_orders_business_key_idx
  on public.mission_orders (
    lower(btrim(employee_name)),
    lower(btrim(mission_subject)),
    issue_date,
    signatory_id
  );

create index if not exists mission_orders_signatory_id_idx
  on public.mission_orders (signatory_id);

drop trigger if exists mission_orders_set_updated_at on public.mission_orders;

create trigger mission_orders_set_updated_at
before update on public.mission_orders
for each row execute function public.set_updated_at();

alter table public.mission_orders enable row level security;
alter table public.mission_order_counters enable row level security;

grant select, insert on public.mission_orders to authenticated;
grant select, insert, update on public.mission_order_counters to authenticated;
grant usage, select on sequence public.mission_orders_id_seq to authenticated;
grant usage, select on sequence public.mission_order_counters_id_seq to authenticated;

drop policy if exists "Authenticated users can read mission orders" on public.mission_orders;
create policy "Authenticated users can read mission orders"
on public.mission_orders for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can create mission orders" on public.mission_orders;
create policy "Authenticated users can create mission orders"
on public.mission_orders for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can read mission counters" on public.mission_order_counters;
create policy "Authenticated users can read mission counters"
on public.mission_order_counters for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can create mission counters" on public.mission_order_counters;
create policy "Authenticated users can create mission counters"
on public.mission_order_counters for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update mission counters" on public.mission_order_counters;
create policy "Authenticated users can update mission counters"
on public.mission_order_counters for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);
