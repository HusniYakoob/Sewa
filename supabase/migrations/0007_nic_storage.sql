-- ============================================================================
-- NIC verification storage: a selfie column and a private bucket for NIC docs
-- and selfies. Files live under a per-user folder ({user_id}/...); only the
-- owner or an admin may read them.
-- ============================================================================

alter table public.nic_verifications add column if not exists selfie_url text;

insert into storage.buckets (id, name, public)
values ('nic-documents', 'nic-documents', false)
on conflict (id) do nothing;

drop policy if exists "nic upload own" on storage.objects;
create policy "nic upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'nic-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "nic read own or admin" on storage.objects;
create policy "nic read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'nic-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
