create table public.ssc_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) < 24000),
  photo text not null check (photo like 'data:image/jpeg;base64,%' and length(photo) between 32 and 500000)
);
alter table public.ssc_profiles enable row level security;
revoke all on public.ssc_profiles from public, anon, authenticated;
grant select, insert, update on public.ssc_profiles to authenticated;
create policy owner_read on public.ssc_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy owner_insert on public.ssc_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy owner_update on public.ssc_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
