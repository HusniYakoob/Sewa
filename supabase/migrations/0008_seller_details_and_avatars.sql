-- ============================================================================
-- Seller public profile details (description + service areas) and a public
-- avatar bucket for profile photos (buyers and sellers).
--
-- Also locks down `is_pro`: a seller can already update their own
-- seller_profiles row (for description/service_areas), so without this guard
-- they could also flip is_pro on themselves via a raw API call. This trigger
-- silently reverts any change to is_pro that doesn't come from the
-- service-role client (i.e. admin actions), regardless of RLS.
-- ============================================================================

alter table public.seller_profiles add column if not exists description text;
alter table public.seller_profiles add column if not exists service_areas text[] not null default '{}';

create or replace function public.guard_seller_is_pro()
returns trigger language plpgsql as $$
begin
  if new.is_pro is distinct from old.is_pro and auth.role() <> 'service_role' then
    new.is_pro := old.is_pro;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_seller_is_pro on public.seller_profiles;
create trigger trg_guard_seller_is_pro
  before update on public.seller_profiles
  for each row execute function public.guard_seller_is_pro();

-- Public avatar bucket: anyone can view a photo; each user manages only their
-- own folder ({user_id}/...).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar upload own" on storage.objects;
create policy "avatar upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar delete own" on storage.objects;
create policy "avatar delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
