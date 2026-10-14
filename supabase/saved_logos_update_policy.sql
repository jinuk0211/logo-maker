-- saved_logos 에 update 정책 추가 (이미 saved_logos.sql 을 돌린 프로젝트용). 여러 번 실행해도 안전.
drop policy if exists "own_update" on public.saved_logos;
create policy "own_update" on public.saved_logos for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
