-- ============================================================================
-- Gig marketplace expansion: subcategories, tiered gig packages, real seller
-- plans (Starter/Pro/Business), the Buying<->Selling account toggle, chat,
-- moderation (blocks/reports), and reschedule support.
--
-- Commission economics stay on our locked model (10% commission + 2.5%
-- gateway on Starter, 5% buyer fee, unchanged) — plans only lower the
-- commission portion. See src/lib/pricing.ts for the source of truth.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- subcategories
-- ---------------------------------------------------------------------------
create table subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  icon        text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (category_id, slug)
);
create index idx_subcategories_category on subcategories(category_id);

alter table services add column if not exists subcategory_id uuid references subcategories(id);

-- ---------------------------------------------------------------------------
-- service_packages — Basic / Standard / Premium tiers per gig ad
-- ---------------------------------------------------------------------------
create table service_packages (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references services(id) on delete cascade,
  tier          text not null check (tier in ('basic', 'standard', 'premium')),
  name          text not null,
  description   text not null default '',
  price         numeric(12,2) not null check (price >= 0),
  price_unit    text not null default 'job',
  delivery_days integer,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (service_id, tier)
);
create index idx_service_packages_service on service_packages(service_id);
create trigger trg_service_packages_updated before update on service_packages
  for each row execute function set_updated_at();

alter table bookings add column if not exists package_id uuid references service_packages(id);

-- ---------------------------------------------------------------------------
-- plans — Starter (free) / Pro / Business
-- ---------------------------------------------------------------------------
create table plans (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique check (key in ('starter', 'pro', 'business')),
  name            text not null,
  price_lkr       numeric(12,2) not null default 0,
  commission_rate numeric(4,3) not null,
  ad_limit        integer not null,
  sort_order      integer not null default 0
);

insert into plans (key, name, price_lkr, commission_rate, ad_limit, sort_order) values
  ('starter',  'Starter',  0,    0.100, 3,  1),
  ('pro',      'Pro',      1490, 0.080, 10, 2),
  ('business', 'Business', 3990, 0.060, 30, 3)
on conflict (key) do nothing;

alter table seller_profiles add column if not exists plan_id uuid references plans(id);
alter table seller_profiles add column if not exists plan_renews_at timestamptz;

update seller_profiles sp set plan_id = (select id from plans where key = 'starter')
where plan_id is null;

-- Only the service-role client (plan-purchase webhook / admin action) may
-- change a seller's plan — same self-escalation guard as is_pro (0008).
create or replace function public.guard_seller_plan()
returns trigger language plpgsql as $$
begin
  if new.plan_id is distinct from old.plan_id and auth.role() <> 'service_role' then
    new.plan_id := old.plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_seller_plan on seller_profiles;
create trigger trg_guard_seller_plan
  before update on seller_profiles
  for each row execute function public.guard_seller_plan();

-- ---------------------------------------------------------------------------
-- Buying <-> Selling account context toggle
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists active_context text not null default 'buyer'
  check (active_context in ('buyer', 'seller'));

-- ---------------------------------------------------------------------------
-- Reschedule support (additive columns, no new booking_status value needed)
-- ---------------------------------------------------------------------------
alter table bookings add column if not exists reschedule_proposed_at timestamptz;
alter table bookings add column if not exists reschedule_requested_by actor;
alter table bookings add column if not exists reschedule_note text;

-- ---------------------------------------------------------------------------
-- Chat: one thread per buyer/seller pair
-- ---------------------------------------------------------------------------
create table conversations (
  id                 uuid primary key default gen_random_uuid(),
  buyer_id           uuid not null references profiles(id) on delete cascade,
  seller_id          uuid not null references seller_profiles(id) on delete cascade,
  booking_id         uuid references bookings(id),
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (buyer_id, seller_id)
);
create index idx_conversations_buyer on conversations(buyer_id);
create index idx_conversations_seller on conversations(seller_id);
create trigger trg_conversations_updated before update on conversations
  for each row execute function set_updated_at();

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id),
  type            text not null default 'text' check (type in ('text', 'photo', 'location')),
  body            text,
  photo_url       text,
  location_lat    numeric(9,6),
  location_lng    numeric(9,6),
  location_label  text,
  created_at      timestamptz not null default now()
);
create index idx_messages_conversation on messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Moderation: blocks + reports (shared by m5 job report, h2 general report,
-- m8 report-user-from-chat)
-- ---------------------------------------------------------------------------
create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references profiles(id),
  reported_user_id  uuid references profiles(id),
  booking_id        uuid references bookings(id),
  category          text not null,
  subject           text not null,
  details           text,
  photo_url         text,
  status            text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at        timestamptz not null default now()
);
create index idx_reports_status on reports(status);

-- ---------------------------------------------------------------------------
-- Storage: chat photo attachments (public read, own-folder write — same
-- pattern as the avatars bucket from 0008)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-photos', 'chat-photos', true)
on conflict (id) do nothing;

drop policy if exists "chat photo public read" on storage.objects;
create policy "chat photo public read" on storage.objects
  for select using (bucket_id = 'chat-photos');

drop policy if exists "chat photo upload own" on storage.objects;
create policy "chat photo upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table subcategories     enable row level security;
alter table service_packages  enable row level security;
alter table plans             enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table blocks            enable row level security;
alter table reports           enable row level security;

create policy "subcategories readable" on subcategories
  for select using (true);
create policy "admin writes subcategories" on subcategories
  for all using (is_admin()) with check (is_admin());

create policy "packages readable with active service" on service_packages
  for select using (
    exists (
      select 1 from services s
      where s.id = service_packages.service_id
        and (s.status = 'active' or s.seller_id = current_seller_id() or is_admin())
    )
  );
create policy "seller manages own packages" on service_packages
  for all using (
    exists (select 1 from services s where s.id = service_packages.service_id and s.seller_id = current_seller_id())
    or is_admin()
  )
  with check (
    exists (select 1 from services s where s.id = service_packages.service_id and s.seller_id = current_seller_id())
    or is_admin()
  );

create policy "plans readable" on plans
  for select using (true);

create policy "conversation participants read" on conversations
  for select using (buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin());
create policy "buyer or seller starts conversation" on conversations
  for insert with check (buyer_id = auth.uid() or seller_id = current_seller_id());
create policy "participants update read markers" on conversations
  for update using (buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin())
  with check (buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin());

create policy "message participants read" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = current_seller_id() or is_admin())
    )
  );
create policy "participant sends message" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = current_seller_id())
    )
  );

create policy "own blocks readable" on blocks
  for select using (blocker_id = auth.uid() or is_admin());
create policy "user creates own block" on blocks
  for insert with check (blocker_id = auth.uid());
create policy "user removes own block" on blocks
  for delete using (blocker_id = auth.uid());

create policy "reporter or admin reads reports" on reports
  for select using (reporter_id = auth.uid() or is_admin());
create policy "user files report" on reports
  for insert with check (reporter_id = auth.uid());

-- Enable Realtime on messages for live chat (idempotent — skips if already added).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;
