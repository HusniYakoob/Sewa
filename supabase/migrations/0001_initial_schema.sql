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
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
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
