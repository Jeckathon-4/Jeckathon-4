-- 002: 경기별 고정 룸(m1~m5) 재사용. Supabase SQL editor에서 실행. 여러 번 실행해도 안전.
-- 규칙: 20초=1이닝, 100초 기도 마감, 180초 경기 종료·헌화, 240초부터 다음 입장 시 새 경기.

-- 입장: 없으면 생성. 종료 후 60초(시작 240초) 지난 룸에 누가 입장하면 새 경기로 리셋.
create or replace function public.join_fan_room(room_id text) returns public.fan_rooms
language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 insert into public.fan_rooms(id) values(room_id) on conflict(id) do nothing;
 update public.fan_rooms set started_at=now(), rain=0, sun=0, flowers=0
  where id=room_id and now() >= started_at + interval '240 seconds';
 select * into r from public.fan_rooms where id=room_id;
 return r;
end; $$;

-- 새 경기 시작 버튼: 경기 종료(180초) 이후에만 리셋 허용. 진행 중이면 그대로 반환.
create or replace function public.restart_fan_room(room_id text) returns public.fan_rooms
language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 update public.fan_rooms set started_at=now(), rain=0, sun=0, flowers=0
  where id=room_id and now() >= started_at + interval '180 seconds';
 select * into r from public.fan_rooms where id=room_id;
 return r;
end; $$;

revoke all on function public.join_fan_room(text) from public;
revoke all on function public.restart_fan_room(text) from public;
grant execute on function public.join_fan_room(text), public.restart_fan_room(text) to anon, authenticated;
notify pgrst, 'reload schema';

-- 시연용 '경기 종료' 버튼: 진행 중인 경기를 룸 전체에서 즉시 종료(시계를 180초 지점으로). 이미 끝났으면 그대로.
create or replace function public.end_fan_room(room_id text) returns public.fan_rooms
language plpgsql security definer set search_path = public as $$
declare r public.fan_rooms;
begin
 update public.fan_rooms set started_at = now() - interval '180 seconds'
  where id=room_id and now() < started_at + interval '180 seconds';
 select * into r from public.fan_rooms where id=room_id;
 return r;
end; $$;
revoke all on function public.end_fan_room(text) from public;
grant execute on function public.end_fan_room(text) to anon, authenticated;
notify pgrst, 'reload schema';
