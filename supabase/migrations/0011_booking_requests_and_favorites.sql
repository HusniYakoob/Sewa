-- ============================================================================
-- Booking request model: the latest design has the buyer "send a booking
-- request" with no charge yet, the seller accept/decline it, and only THEN
-- does the buyer pay. bookings.status already had 'pending'/'declined' from
-- day one (0001) — this was evidently the original intent before an earlier
-- pass short-circuited straight to instant pay + auto-accept. Rather than
-- add a new enum value (bookings.status is a native enum; ALTER TYPE ...
-- ADD VALUE is fine on its own but risky to also *use* in the same
-- migration), reuse 'pending' for both sub-states and add a nullable
-- timestamp: seller_approved_at is null while awaiting the seller's
-- decision, and set once they accept (buyer can then pay). status flips to
-- 'declined' directly if the seller declines, or to 'accepted' once payment
-- actually clears (unchanged, still set by the PayHere webhook).
-- ============================================================================
alter table bookings add column if not exists seller_approved_at timestamptz;

-- ---------------------------------------------------------------------------
-- Saved services (buyer favorites) — b1f in the latest design.
-- ---------------------------------------------------------------------------
create table saved_services (
  buyer_id   uuid not null references profiles(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, service_id)
);
create index idx_saved_services_buyer on saved_services(buyer_id);

alter table saved_services enable row level security;
create policy "buyer reads own saved services" on saved_services
  for select using (buyer_id = auth.uid());
create policy "buyer saves own service" on saved_services
  for insert with check (buyer_id = auth.uid());
create policy "buyer unsaves own service" on saved_services
  for delete using (buyer_id = auth.uid());
