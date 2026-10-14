-- saved_logos : 사용자가 저장한 로고 (브리프 + 로고 메타 + 이미지는 Storage)
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣고 Run. (여러 번 실행해도 안전)
--
--  · RLS ON — 로그인 사용자는 자기 행만 읽고/쓰고/지운다.
--  · 이미지(PNG)는 Storage 버킷 `logos` 의 {user_id}/{id}.png 에 저장, 같은 규칙으로 보호.
--  · 보관 기간 60일 — 조회 시 60일 이내만 보여주고, pg_cron 이 있으면 매일 새벽 오래된 행 삭제.

create extension if not exists "pgcrypto";

create table if not exists public.saved_logos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text,
  brief       jsonb not null,
  logo        jsonb not null,          -- 이미지 제외한 로고 스펙(colors, form, mood, provider …)
  image_path  text,                    -- storage: logos/{user_id}/{id}.png (원본, 편집 이어가기용)
  created_at  timestamptz not null default now()
);
create index if not exists saved_logos_user_created_idx on public.saved_logos (user_id, created_at desc);

alter table public.saved_logos enable row level security;
drop policy if exists "own_select" on public.saved_logos;
drop policy if exists "own_insert" on public.saved_logos;
drop policy if exists "own_update" on public.saved_logos;
drop policy if exists "own_delete" on public.saved_logos;
create policy "own_select" on public.saved_logos for select to authenticated using (auth.uid() = user_id);
create policy "own_insert" on public.saved_logos for insert to authenticated with check (auth.uid() = user_id);
create policy "own_update" on public.saved_logos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on public.saved_logos for delete to authenticated using (auth.uid() = user_id);

-- Storage 버킷 (비공개) — 경로 첫 폴더가 본인 uid 일 때만 접근
insert into storage.buckets (id, name, public) values ('logos', 'logos', false)
  on conflict (id) do nothing;
drop policy if exists "logos_own_select" on storage.objects;
drop policy if exists "logos_own_insert" on storage.objects;
drop policy if exists "logos_own_delete" on storage.objects;
create policy "logos_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 60일 지난 행 정리 (pg_cron 확장이 켜져 있을 때만 — Dashboard → Database → Extensions → pg_cron)
-- Storage 파일은 SQL 로 못 지우므로(storage.protect_delete) 앱이 삭제하거나 대시보드에서 정리한다.
-- 앱은 어차피 60일 이내만 조회하므로 남은 파일은 보이지 않는다.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge_saved_logos', '0 4 * * *',
      $cron$ delete from public.saved_logos where created_at < now() - interval '60 days'; $cron$);
  end if;
end $$;
