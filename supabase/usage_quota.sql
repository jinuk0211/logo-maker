-- usage_counts : 계정별 AI 호출 횟수 (무료 이용 한도용)
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣고 Run. (여러 번 실행해도 안전)
--
--  · 사용자는 자기 행을 읽을 수만 있다. 쓰기 정책이 없어서 직접 고칠 수 없고,
--    증가는 아래 consume_quota() 를 통해서만 일어난다.
--  · kind: generate(로고 후보 1장) | edit(AI 수정) | brandbook
--  · 한도 값은 서버 환경변수(FREE_LOGO_GENERATIONS 등)가 정한다 — server/quota.js

create table if not exists public.usage_counts (
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,
  used        integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.usage_counts enable row level security;
drop policy if exists "own_select" on public.usage_counts;
create policy "own_select" on public.usage_counts for select to authenticated using (auth.uid() = user_id);

-- 한 번 차감하고 true, 이미 한도에 닿았으면 아무것도 바꾸지 않고 false.
-- 한 문장으로 처리해서 동시에 여러 요청이 와도 한도를 넘지 않는다.
create or replace function public.consume_quota(p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  if auth.uid() is null or p_limit is null or p_limit < 1 then
    return false;
  end if;

  insert into public.usage_counts as u (user_id, kind, used)
  values (auth.uid(), p_kind, 1)
  on conflict (user_id, kind) do update
    set used = u.used + 1, updated_at = now()
    where u.used < p_limit
  returning u.used into v_used;

  return v_used is not null;
end;
$$;

revoke all on function public.consume_quota(text, integer) from public, anon;
grant execute on function public.consume_quota(text, integer) to authenticated;

-- 특정 계정의 횟수를 되돌릴 때:
--   delete from public.usage_counts where user_id = '<uuid>';
