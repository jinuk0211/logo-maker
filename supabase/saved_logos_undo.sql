-- saved_logos.sql 을 잘못된 프로젝트에 실행했을 때 원상복구.
-- saved_logos 테이블 · logos 버킷 · 관련 정책 · cron 잡만 지운다. 다른 테이블(saved_sites 등)은 건드리지 않는다.

-- cron 잡 (pg_cron 없으면 건너뜀)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge_saved_logos');
  end if;
exception when others then null;
end $$;

-- storage 정책
drop policy if exists "logos_own_select" on storage.objects;
drop policy if exists "logos_own_insert" on storage.objects;
drop policy if exists "logos_own_delete" on storage.objects;
-- 버킷 `logos` 는 SQL 로 못 지운다 (storage.protect_delete) —
-- 대시보드 → Storage → logos → ⋯ → Delete bucket 으로 지우거나, 비어 있으니 그냥 둬도 무방.

-- 테이블 (정책·인덱스는 함께 삭제됨)
drop table if exists public.saved_logos;
