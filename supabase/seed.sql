-- Seed service categories. Icons are Material Symbol (rounded) names so they
-- render directly in the app's category grid. All active so Home looks full.
insert into categories (name, slug, description, icon, sort_order, is_active) values
  ('Cleaning',          'cleaning',         'Home and deep cleaning',        'cleaning_services',    1,  true),
  ('Plumbing',          'plumbing',         'Leaks, taps and fittings',      'plumbing',             2,  true),
  ('Electrical',        'electrical',       'Wiring, sockets and lights',    'electrical_services',  3,  true),
  ('Painting',          'painting',         'Interior and exterior painting','format_paint',         4,  true),
  ('Carpentry',         'carpentry',        'Furniture and woodwork',        'carpenter',            5,  true),
  ('Moving',            'moving',           'Moving and delivery help',      'local_shipping',       6,  true),
  ('Gardening',         'gardening',        'Garden and outdoor work',       'yard',                 7,  true),
  ('AC Repair',         'ac-repair',        'AC service and repair',         'mode_fan',             8,  true),
  ('Appliance Repair',  'appliance-repair', 'Fridge, washer, oven fixes',    'home_repair_service',  9,  true),
  ('Pest Control',      'pest-control',     'Pest and termite treatment',    'pest_control',         10, true),
  ('Tutoring',          'tutoring',         'Lessons and tutoring',          'school',               11, true),
  ('Beauty & Salon',    'beauty',           'Hair, makeup and grooming',     'content_cut',          12, true),
  ('Cooking',           'cooking',          'Home chefs and catering',       'restaurant',           13, true),
  ('Laundry',           'laundry',          'Wash, iron and dry cleaning',   'local_laundry_service',14, true),
  ('Car Wash',          'car-wash',         'Vehicle wash and detailing',    'local_car_wash',       15, true),
  ('Photography',       'photography',      'Photo and video shoots',        'photo_camera',         16, true),
  ('Event Help',        'events',           'Setup and event staff',         'celebration',          17, true),
  ('Elderly Care',      'elderly-care',     'Companionship and care',        'elderly',              18, true),
  ('Baby Care',         'baby-care',        'Babysitting and nannies',       'child_care',           19, true),
  ('Pet Care',          'pet-care',         'Walking, sitting, grooming',    'pets',                 20, true),
  ('Masonry',           'masonry',          'Tiling, plaster and concrete',  'foundation',           21, true),
  ('Welding',           'welding',          'Metal and gate work',           'construction',         22, true),
  ('CCTV & Security',   'security',         'Cameras and alarms',            'security',             23, true),
  ('Internet & Wifi',   'internet',         'Network and wifi setup',        'wifi',                 24, true),
  ('Handyman',          'handyman',         'Odd jobs and repairs',          'handyman',             25, true)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  sort_order  = excluded.sort_order,
  is_active   = excluded.is_active;
