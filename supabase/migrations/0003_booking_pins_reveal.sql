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
