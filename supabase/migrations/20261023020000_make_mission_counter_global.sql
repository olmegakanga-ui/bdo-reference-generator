create table if not exists public.mission_order_counter (
  singleton_key boolean primary key default true check (singleton_key),
  last_number integer not null default 0 check (last_number >= 0),
  updated_at timestamptz not null default now()
);

insert into public.mission_order_counter (singleton_key, last_number)
select
  true,
  greatest(
    coalesce((select max(sequence_number) from public.mission_orders), 0),
    coalesce((select max(last_number) from public.mission_order_counters), 0)
  )
on conflict (singleton_key) do update
set last_number = greatest(
  public.mission_order_counter.last_number,
  excluded.last_number
);

alter table public.mission_order_counter enable row level security;

grant select, update on public.mission_order_counter to authenticated;

drop policy if exists "Authenticated users can read the mission counter"
  on public.mission_order_counter;
create policy "Authenticated users can read the mission counter"
on public.mission_order_counter for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update the mission counter"
  on public.mission_order_counter;
create policy "Authenticated users can update the mission counter"
on public.mission_order_counter for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

alter table public.mission_orders
  drop constraint if exists mission_orders_sequence_number_key;

alter table public.mission_orders
  add constraint mission_orders_sequence_number_key unique (sequence_number);

create or replace function public.next_mission_order_number()
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.mission_order_counter
  set
    last_number = last_number + 1,
    updated_at = now()
  where singleton_key = true
  returning last_number;
$$;

revoke all on function public.next_mission_order_number() from public;
revoke all on function public.next_mission_order_number() from anon;
grant execute on function public.next_mission_order_number() to authenticated;

drop table public.mission_order_counters;
