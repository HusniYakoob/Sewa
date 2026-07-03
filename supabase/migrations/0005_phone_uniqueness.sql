-- ============================================================================
-- Phone uniqueness (interim, unverified). One account per phone number, with
-- Sri Lankan normalization so 0771234567, +94771234567 and 771234567 all match.
-- The real guarantee is phone OTP verification (needs an SMS provider); this is
-- a guard against accidental/duplicate signups until then.
-- ============================================================================

create or replace function normalized_phone(p text)
returns text language sql immutable as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9);
$$;

create unique index if not exists uniq_profiles_norm_phone
  on public.profiles (normalized_phone(phone))
  where phone is not null and length(regexp_replace(phone, '\D', '', 'g')) >= 9;

-- Callable by the signup flow to show a friendly message before inserting.
create or replace function phone_in_use(p text)
returns boolean language sql security definer set search_path = public stable as $$
  select normalized_phone(p) <> '' and exists (
    select 1 from public.profiles
    where phone is not null and normalized_phone(phone) = normalized_phone(p)
  );
$$;
grant execute on function phone_in_use(text) to anon, authenticated;
