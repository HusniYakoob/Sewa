-- Tracks whether a phone-first signup has completed the "choose role" step
-- (a5). Distinct from phone_verified (which just means the OTP matched) so a
-- returning user who verifies again isn't re-prompted for a role.
alter table profiles add column if not exists onboarding_completed boolean not null default false;

-- Email/password signups already choose a role as part of the signup form,
-- so treat existing rows as onboarded.
update profiles set onboarding_completed = true where onboarding_completed = false;

-- handle_new_user (0001) only ever set role/full_name/phone/email. Redefine
-- it so onboarding_completed is true whenever the signup already supplied a
-- role in auth metadata (email/password signup, which asks up front) and
-- false otherwise (phone OTP or Google, which have no role yet and must go
-- through a5 choose-role once).
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'buyer');
  v_onboarded boolean := (new.raw_user_meta_data ->> 'role') is not null;
begin
  insert into public.profiles (id, role, full_name, phone, email, active_context, onboarding_completed)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    case when v_role = 'seller' then 'seller' else 'buyer' end,
    v_onboarded
  );
  if v_role = 'seller' then
    insert into public.seller_profiles (user_id) values (new.id);
  end if;
  return new;
end;
$$;

-- "Become a seller" (from a5 choose-role, or later from Account) now inserts
-- a seller_profiles row from the client for the first time — the original
-- insert policy (0002) only checked user_id, with no column restrictions.
-- Without this, a user could self-insert with a paid plan_id and skip
-- payment entirely. Restrict self-service inserts to the Starter plan only;
-- upgrades must go through the service-role plan-purchase flow (which
-- bypasses RLS entirely, so this doesn't block it).
drop policy if exists "seller creates own profile" on seller_profiles;
create policy "seller creates own profile" on seller_profiles
  for insert with check (
    user_id = auth.uid()
    and (plan_id is null or plan_id = (select id from plans where key = 'starter'))
  );

-- Defense in depth: force commission_rate to match whatever plan actually
-- got assigned (defaulting to Starter) on insert, regardless of what a
-- client-side insert tries to send, unless it's the service-role client.
create or replace function public.set_seller_commission_on_insert()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    if new.plan_id is null then
      select id into new.plan_id from plans where key = 'starter';
    end if;
    select commission_rate into new.commission_rate from plans where id = new.plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_seller_commission_on_insert on seller_profiles;
create trigger trg_seller_commission_on_insert
  before insert on seller_profiles
  for each row execute function public.set_seller_commission_on_insert();
