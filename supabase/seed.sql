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
