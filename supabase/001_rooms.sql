-- Supabase SQL editor에서 실행. 여러 번 실행해도 안전(idempotent).
-- Run in the Supabase SQL editor. No secret key is required in the browser.
create table if not exists public.fan_rooms (
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,40}$'),
 started_at timestamptz not null default now(),
 rain integer not null default 0, sun integer not null default 0, flowers integer not null default 0
);
alter table public.fan_rooms enable row level security;
drop policy if exists "Public demo rooms are readable" on public.fan_rooms;
create policy "Public demo rooms are readable" on public.fan_rooms for select to anon,authenticated using(true);
grant select on public.fan_rooms to anon, authenticated;
-- 쓰기는 아래 RPC(security definer)로만. 테이블 직접 쓰기 차단
revoke insert, update, delete, truncate on public.fan_rooms from anon, authenticated;
create or replace function public.join_fan_room(room_id text) returns public.fan_rooms language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 insert into public.fan_rooms(id) values(room_id) on conflict(id) do nothing;
 select * into r from public.fan_rooms where id=room_id; return r;
end; $$;
create or replace function public.act_in_fan_room(room_id text,action_name text) returns void language plpgsql security definer set search_path = public as $$
begin
 if action_name in ('rain','sun') then
 update public.fan_rooms set rain=rain+case when action_name='rain' then 1 else 0 end,sun=sun+case when action_name='sun' then 1 else 0 end where id=room_id and now()<started_at+interval '100 seconds';
 elsif action_name='flowers' then
 update public.fan_rooms set flowers=flowers+1 where id=room_id and now()>=started_at+interval '180 seconds';
 else raise exception 'Invalid action'; end if;
end; $$;
revoke all on function public.join_fan_room(text) from public;
revoke all on function public.act_in_fan_room(text,text) from public;
grant execute on function public.join_fan_room(text),public.act_in_fan_room(text,text) to anon,authenticated;
do $$ begin alter publication supabase_realtime add table public.fan_rooms; exception when duplicate_object then null; end $$;
-- PostgREST 스키마 캐시 갱신 (PGRST202 방지)
notify pgrst, 'reload schema';
