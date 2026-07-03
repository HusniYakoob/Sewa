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
