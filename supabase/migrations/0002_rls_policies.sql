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
