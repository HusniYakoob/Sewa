-- Sewa full setup: run once in the Supabase SQL Editor.
-- Migrations 0001-0007 + seed, in order.

-- ==================== 0001_initial_schema ====================
-- ============================================================================
-- Sewa — initial schema
-- Service marketplace for Sri Lanka. Encodes the locked business decisions:
--   Fees:        buyer +5%, seller -12.5% (10% commission + 2.5% gateway)
--   Escrow:      payment captured at booking, released after a hold window
--   Hold window: seller earnings are not withdrawable until the dispute
--                window closes (prevents refund-after-payout loss)
--   PINs:        start/end PIN verification (hashed, attempt-limited)
--   Trust:       NIC verification, two-way reviews, Sewa Guarantee reserve
--   Money out:   refunds (with claw-back) and seller payouts
--   Cancellation: timing-based fee; full platform cut once seller "arrived"
-- Money is numeric(12,2) in LKR. Times are timestamptz (UTC).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role        as enum ('buyer', 'seller', 'admin');
create type service_status   as enum ('draft', 'active', 'paused');
create type booking_status   as enum (
  'pending',      -- buyer requested, awaiting seller
  'accepted',     -- seller accepted, payment captured
  'declined',     -- seller declined
  'arrived',      -- seller marked on-site (cancellation now costs full cut)
  'in_progress',  -- start PIN verified
  'completed',    -- end PIN verified, funds enter hold window
  'cancelled',
  'disputed'
);
create type payment_status   as enum (
  'pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'
);
create type escrow_status    as enum ('held', 'released', 'refunded');
create type nic_status       as enum ('pending', 'approved', 'rejected');
create type refund_status    as enum ('pending', 'approved', 'rejected', 'processing', 'completed');
create type refund_reason    as enum ('quality', 'incomplete', 'no_show', 'other');
create type payout_status    as enum ('pending', 'approved', 'processing', 'completed', 'failed');
create type wallet_entry_type as enum (
  'earning', 'payout', 'refund_clawback', 'guarantee_reserve', 'adjustment'
);
create type wallet_entry_status as enum ('pending', 'available', 'withdrawn', 'reversed');
create type actor             as enum ('buyer', 'seller', 'admin', 'system');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users, all three roles
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role   not null default 'buyer',
  full_name     text        not null default '',
  phone         text,
  phone_verified boolean     not null default false,
  email         text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Create a profile automatically when a new auth user is created.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'buyer');
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  -- Sellers get a seller_profiles row automatically so they can list services.
  if v_role = 'seller' then
    insert into public.seller_profiles (user_id) values (new.id);
  end if;
  return new;
end;
$$;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- seller_profiles — seller-specific data, payout details, trust signals
-- ---------------------------------------------------------------------------
create table seller_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references profiles(id) on delete cascade,
  rating          numeric(3,2) not null default 0,      -- 0.00–5.00
  total_reviews   integer not null default 0,
  total_bookings  integer not null default 0,
  nic_verified    boolean not null default false,
  nic_verified_at timestamptz,
  -- Commission rate is per-seller so Pro/loyalty tiers are a config change.
  commission_rate numeric(4,3) not null default 0.100,  -- 10% base
  is_pro          boolean not null default false,
  -- Availability JSON, e.g. {"mon":[["08:00","17:00"]], ...}
  availability    jsonb not null default '{}'::jsonb,
  strikes         integer not null default 0,            -- cancellation/abuse strikes
  suspended       boolean not null default false,
  -- Payout bank details; name must match the verified NIC before payout.
  bank_account_name   text,
  bank_account_number text,
  bank_name           text,
  bank_branch         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_seller_profiles_updated before update on seller_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,                 -- Material Symbol name
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- services — listings created by sellers
-- ---------------------------------------------------------------------------
create table services (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references seller_profiles(id) on delete cascade,
  category_id    uuid not null references categories(id),
  title          text not null,
  description    text not null default '',
  price          numeric(12,2) not null check (price >= 0),
  price_unit     text not null default 'hour',  -- 'hour' | 'job'
  location_area  text,                          -- e.g. "Colombo 04"
  status         service_status not null default 'draft',
  rating         numeric(3,2) not null default 0,
  total_bookings integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_services_seller   on services(seller_id);
create index idx_services_category on services(category_id);
create index idx_services_status   on services(status);
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings — the central record, with the full fee breakdown frozen at booking
-- ---------------------------------------------------------------------------
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references profiles(id),
  seller_id       uuid not null references seller_profiles(id),
  service_id      uuid not null references services(id),
  status          booking_status not null default 'pending',

  scheduled_at    timestamptz not null,
  duration_hours  numeric(4,1) not null default 1,
  location        text,
  notes           text,

  -- Fee breakdown (computed once, stored for audit). LKR.
  service_amount    numeric(12,2) not null,                 -- listing price * qty
  buyer_fee         numeric(12,2) not null default 0,       -- 5% of service_amount
  total_charged     numeric(12,2) not null,                 -- service_amount + buyer_fee
  seller_commission numeric(12,2) not null default 0,       -- 12.5% of service_amount
  guarantee_reserve numeric(12,2) not null default 0,       -- ~2% set aside
  seller_net        numeric(12,2) not null default 0,       -- service_amount - commission
  platform_net      numeric(12,2) not null default 0,       -- fees kept, less reserve

  -- Lifecycle timestamps
  accepted_at   timestamptz,
  arrived_at    timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,

  -- Cancellation
  cancelled_at    timestamptz,
  cancelled_by    actor,
  cancel_reason   text,
  cancellation_fee numeric(12,2) not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_bookings_buyer   on bookings(buyer_id);
create index idx_bookings_seller  on bookings(seller_id);
create index idx_bookings_service on bookings(service_id);
create index idx_bookings_status  on bookings(status);
-- Pair-detection helper: repeated cancellations between the same two parties.
create index idx_bookings_pair    on bookings(buyer_id, seller_id);
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- booking_pins — start/end PINs (hashed by the app), attempt-limited
-- ---------------------------------------------------------------------------
create table booking_pins (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid not null unique references bookings(id) on delete cascade,
  start_pin_hash         text not null,
  end_pin_hash           text not null,
  start_pin_verified_at  timestamptz,
  end_pin_verified_at    timestamptz,
  start_pin_attempts     integer not null default 0,
  end_pin_attempts       integer not null default 0,
  start_pin_locked_until timestamptz,
  end_pin_locked_until   timestamptz,
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- payments — PayHere capture + escrow + the release hold window
-- ---------------------------------------------------------------------------
create table payments (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references bookings(id) on delete cascade,
  buyer_id             uuid not null references profiles(id),
  seller_id            uuid not null references seller_profiles(id),
  amount               numeric(12,2) not null,          -- total_charged
  currency             text not null default 'LKR',
  status               payment_status not null default 'pending',
  escrow_status        escrow_status not null default 'held',
  payhere_order_id     text,
  payhere_payment_id   text,
  payment_method       text,
  -- Funds release to the seller's withdrawable balance only after this time.
  hold_until           timestamptz,
  released_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index idx_payments_booking on payments(booking_id);
create index idx_payments_status  on payments(status);
create trigger trg_payments_updated before update on payments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- wallet_entries — seller ledger. Available balance = sum(amount) where
-- status = 'available'. Earnings sit 'pending' until the hold window passes.
-- ---------------------------------------------------------------------------
create table wallet_entries (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references seller_profiles(id) on delete cascade,
  booking_id   uuid references bookings(id),
  type         wallet_entry_type not null,
  amount       numeric(12,2) not null,           -- signed: earnings +, payouts/clawback -
  status       wallet_entry_status not null default 'pending',
  available_at timestamptz,                       -- when a 'pending' earning unlocks
  note         text,
  created_at   timestamptz not null default now()
);
create index idx_wallet_seller on wallet_entries(seller_id);
create index idx_wallet_status on wallet_entries(status);

-- ---------------------------------------------------------------------------
-- nic_verifications — government ID for seller trust + payout eligibility
-- ---------------------------------------------------------------------------
create table nic_verifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references profiles(id) on delete cascade,
  nic_number_enc   text,                 -- encrypted NIC number (app-side)
  nic_masked       text,                 -- e.g. "****-****-**56"
  full_name        text,
  date_of_birth    date,
  document_url     text,                 -- Supabase Storage path
  status           nic_status not null default 'pending',
  reviewed_by      uuid references profiles(id),
  reviewed_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_nic_updated before update on nic_verifications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- reviews — two-way (buyer rates seller). One per booking.
-- ---------------------------------------------------------------------------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references bookings(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  seller_id   uuid not null references seller_profiles(id),
  service_id  uuid not null references services(id),
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
create index idx_reviews_seller on reviews(seller_id);

-- ---------------------------------------------------------------------------
-- refunds — buyer-initiated, admin-reviewed, with claw-back from wallet
-- ---------------------------------------------------------------------------
create table refunds (
  id               uuid primary key default gen_random_uuid(),
  payment_id       uuid not null references payments(id),
  booking_id       uuid not null references bookings(id),
  requester_id     uuid not null references profiles(id),
  amount           numeric(12,2) not null,
  reason           refund_reason not null,
  explanation      text,
  status           refund_status not null default 'pending',
  refund_method    text not null default 'credit',   -- 'credit' | 'original'
  approved_by      uuid references profiles(id),
  approved_at      timestamptz,
  approval_notes   text,
  payhere_refund_id text,
  processed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_refunds_status on refunds(status);
create trigger trg_refunds_updated before update on refunds
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- payouts — seller withdrawals, admin-approved, paid via PayHere/bank
-- ---------------------------------------------------------------------------
create table payouts (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references seller_profiles(id),
  amount              numeric(12,2) not null check (amount >= 1000), -- min LKR 1,000
  status              payout_status not null default 'pending',
  bank_account_name   text,
  bank_account_number text,
  bank_name           text,
  payhere_payout_id   text,
  requested_at        timestamptz not null default now(),
  approved_by         uuid references profiles(id),
  approved_at         timestamptz,
  processed_at        timestamptz,
  failure_reason      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_payouts_seller on payouts(seller_id);
create index idx_payouts_status on payouts(status);
create trigger trg_payouts_updated before update on payouts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_logs — append-only payment state history
-- ---------------------------------------------------------------------------
create table payment_logs (
  id              uuid primary key default gen_random_uuid(),
  payment_id      uuid references payments(id) on delete cascade,
  event_type      text not null,
  previous_status text,
  new_status      text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index idx_payment_logs_payment on payment_logs(payment_id);

-- ---------------------------------------------------------------------------
-- audit_logs — admin actions (refund approvals, payouts, NIC reviews, ...)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references profiles(id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  changes     jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_admin on audit_logs(admin_id);

-- ==================== 0002_rls_policies ====================
-- ============================================================================
-- Row Level Security
-- Money-critical writes (payment capture, escrow release, wallet entries,
-- payout/refund processing, PIN verification) run on the server with the
-- service role, which BYPASSES RLS. These policies cover what a logged-in
-- client may read and the few writes it may initiate directly.
-- ============================================================================

-- Helpers -------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.current_seller_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from seller_profiles where user_id = auth.uid();
$$;

-- Enable RLS ----------------------------------------------------------------
alter table profiles          enable row level security;
alter table seller_profiles   enable row level security;
alter table categories        enable row level security;
alter table services          enable row level security;
alter table bookings          enable row level security;
alter table booking_pins      enable row level security;
alter table payments          enable row level security;
alter table wallet_entries    enable row level security;
alter table nic_verifications enable row level security;
alter table reviews           enable row level security;
alter table refunds           enable row level security;
alter table payouts           enable row level security;
alter table payment_logs      enable row level security;
alter table audit_logs        enable row level security;

-- profiles ------------------------------------------------------------------
create policy "read own or admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- seller_profiles (public browse; owner manages; admin all) ------------------
create policy "seller profiles readable" on seller_profiles
  for select using (true);
create policy "seller manages own profile" on seller_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "seller creates own profile" on seller_profiles
  for insert with check (user_id = auth.uid());

-- categories (public read; admin write) -------------------------------------
create policy "categories readable" on categories
  for select using (true);
create policy "admin writes categories" on categories
  for all using (is_admin()) with check (is_admin());

-- services (public read active; seller manages own; admin all) ---------------
create policy "active services readable" on services
  for select using (status = 'active' or seller_id = current_seller_id() or is_admin());
create policy "seller manages own services" on services
  for all using (seller_id = current_seller_id() or is_admin())
  with check (seller_id = current_seller_id() or is_admin());

-- bookings (parties + admin) ------------------------------------------------
create policy "booking parties read" on bookings
  for select using (
    buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin()
  );
create policy "buyer creates booking" on bookings
  for insert with check (buyer_id = auth.uid());
-- Status transitions are validated server-side; clients may not update directly.

-- booking_pins (no client access; server/admin only) ------------------------
create policy "admin reads pins" on booking_pins
  for select using (is_admin());

-- payments (parties read; no client writes) ---------------------------------
create policy "payment parties read" on payments
  for select using (
    buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin()
  );

-- wallet_entries (seller owner + admin) -------------------------------------
create policy "seller reads own wallet" on wallet_entries
  for select using (seller_id = current_seller_id() or is_admin());

-- nic_verifications (owner + admin) -----------------------------------------
create policy "owner reads own nic" on nic_verifications
  for select using (user_id = auth.uid() or is_admin());
create policy "owner submits own nic" on nic_verifications
  for insert with check (user_id = auth.uid());

-- reviews (public read; reviewer creates) -----------------------------------
create policy "reviews readable" on reviews
  for select using (true);
create policy "reviewer creates review" on reviews
  for insert with check (reviewer_id = auth.uid());

-- refunds (requester + admin) -----------------------------------------------
create policy "refund requester reads" on refunds
  for select using (requester_id = auth.uid() or is_admin());
create policy "buyer requests refund" on refunds
  for insert with check (requester_id = auth.uid());

-- payouts (seller owner + admin) --------------------------------------------
create policy "seller reads own payouts" on payouts
  for select using (seller_id = current_seller_id() or is_admin());
create policy "seller requests payout" on payouts
  for insert with check (seller_id = current_seller_id());

-- logs (admin only) ----------------------------------------------------------
create policy "admin reads payment logs" on payment_logs
  for select using (is_admin());
create policy "admin reads audit logs" on audit_logs
  for select using (is_admin());

-- ==================== 0003_booking_pins_reveal ====================
-- ============================================================================
-- booking_pins: store the START/END PINs so the BUYER can reveal them and read
-- them out to the provider (Uber style). PINs are low-value, single-use, and
-- per-booking. They are protected by RLS: only the booking's buyer (and admin)
-- can read them. The provider never reads them; they type what the buyer says,
-- and the server verifies it.
-- Safe to run: booking_pins is empty at this point.
-- ============================================================================

alter table booking_pins drop column if exists start_pin_hash;
alter table booking_pins drop column if exists end_pin_hash;
alter table booking_pins add column if not exists start_pin text not null default '';
alter table booking_pins add column if not exists end_pin text not null default '';

-- Let the booking's buyer read its PINs.
drop policy if exists "buyer reads own booking pins" on booking_pins;
create policy "buyer reads own booking pins" on booking_pins
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_pins.booking_id and b.buyer_id = auth.uid()
    )
  );

-- ==================== 0004_reviews ====================
-- ============================================================================
-- Reviews: keep seller and service ratings in sync automatically, and harden
-- who may post a review (only the booking's buyer, only after completion).
-- ============================================================================

-- Recompute aggregates whenever a review is added.
create or replace function on_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update seller_profiles sp set
    total_reviews = (select count(*) from reviews r where r.seller_id = new.seller_id),
    rating = coalesce(
      (select round(avg(r.rating)::numeric, 2) from reviews r where r.seller_id = new.seller_id),
      0
    )
  where sp.id = new.seller_id;

  update services s set
    rating = coalesce(
      (select round(avg(r.rating)::numeric, 2) from reviews r where r.service_id = new.service_id),
      0
    )
  where s.id = new.service_id;

  return new;
end;
$$;

drop trigger if exists trg_review_insert on reviews;
create trigger trg_review_insert
  after insert on reviews
  for each row execute function on_review_change();

-- Only the buyer of a completed booking may review it.
drop policy if exists "reviewer creates review" on reviews;
create policy "reviewer creates review" on reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.buyer_id = auth.uid()
        and b.status = 'completed'
    )
  );

-- ==================== 0005_phone_uniqueness ====================
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

-- ==================== 0006_security_hardening ====================
-- ============================================================================
-- Minor security hardening (from the Supabase advisor after DDL changes).
-- Pin the phone helper's search_path, and stop trigger-only functions from
-- being reachable through the REST RPC surface.
-- ============================================================================

alter function public.normalized_phone(text) set search_path = pg_catalog;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.on_review_change() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;

-- ==================== 0007_nic_storage ====================
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

-- ============================ SEED ============================
-- Seed categories. Icons are Material Symbol names.
-- Launch focus is one category in one suburb; the rest are listed but can be
-- toggled inactive until liquidity exists.
insert into categories (name, slug, description, icon, sort_order, is_active) values
  ('Cleaning',  'cleaning',  'Home and deep cleaning',        'cleaning_services', 1, true),
  ('Repairs',   'repairs',   'Plumbing, electrical, fixes',   'handyman',          2, false),
  ('Moving',    'moving',    'Moving and delivery help',      'local_shipping',    3, false),
  ('Gardening', 'gardening', 'Garden and outdoor work',       'yard',              4, false),
  ('Tutoring',  'tutoring',  'Lessons and tutoring',          'school',            5, false)
on conflict (slug) do nothing;
