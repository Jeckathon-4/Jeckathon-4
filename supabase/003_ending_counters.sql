-- 003: 끝화면별 카운터 분리. Supabase SQL editor에서 실행. 여러 번 실행해도 안전.
-- 패배 추모관 = flowers, 승리 클럽 = dancers, 무승부 대합실 = sighs (모두 경기 종료 180초 후에만 반영)
alter table public.fan_rooms add column if not exists dancers integer not null default 0;
alter table public.fan_rooms add column if not exists sighs integer not null default 0;

create or replace function public.act_in_fan_room(room_id text, action_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
 if action_name in ('rain','sun') then
  update public.fan_rooms set rain=rain+case when action_name='rain' then 1 else 0 end, sun=sun+case when action_name='sun' then 1 else 0 end
   where id=room_id and now() < started_at + interval '100 seconds';
 elsif action_name='flowers' then
  update public.fan_rooms set flowers=flowers+1 where id=room_id and now() >= started_at + interval '180 seconds';
 elsif action_name='dancers' then
  update public.fan_rooms set dancers=dancers+1 where id=room_id and now() >= started_at + interval '180 seconds';
 elsif action_name='sighs' then
  update public.fan_rooms set sighs=sighs+1 where id=room_id and now() >= started_at + interval '180 seconds';
 else raise exception 'Invalid action'; end if;
end; $$;

-- 새 경기 시작 시 끝화면 카운터도 초기화
create or replace function public.join_fan_room(room_id text) returns public.fan_rooms
language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 insert into public.fan_rooms(id) values(room_id) on conflict(id) do nothing;
 update public.fan_rooms set started_at=now(), rain=0, sun=0, flowers=0, dancers=0, sighs=0
  where id=room_id and now() >= started_at + interval '240 seconds';
 select * into r from public.fan_rooms where id=room_id;
 return r;
end; $$;
create or replace function public.restart_fan_room(room_id text) returns public.fan_rooms
language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 update public.fan_rooms set started_at=now(), rain=0, sun=0, flowers=0, dancers=0, sighs=0
  where id=room_id and now() >= started_at + interval '180 seconds';
 select * into r from public.fan_rooms where id=room_id;
 return r;
end; $$;
grant select on public.fan_rooms to anon, authenticated;
revoke insert, update, delete, truncate on public.fan_rooms from anon, authenticated;
notify pgrst, 'reload schema';
