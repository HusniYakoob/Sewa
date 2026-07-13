import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME seed endpoint. Verifies migration 0009 landed, seeds subcategories
// under existing categories, and creates 10 fake sellers with real gig ads +
// Basic/Standard/Premium packages so the rebuilt browse/home screens have
// real data. Removed right after running.
const TOKEN = "7f3c9a1e5b6d0284a9c3e7f1b5d0284a9c3e7f1b5d0284a9";

const SUBCATEGORIES: Record<string, { slug: string; name: string }[]> = {
  cleaning: [
    { slug: "deep-cleaning", name: "Deep Home Cleaning" },
    { slug: "office-cleaning", name: "Office Cleaning" },
    { slug: "post-construction-cleaning", name: "Post-Construction Cleaning" },
  ],
  plumbing: [
    { slug: "leak-repair", name: "Leak Repair" },
    { slug: "pipe-installation", name: "Pipe Installation" },
    { slug: "bathroom-fitting", name: "Bathroom Fitting" },
  ],
  electrical: [
    { slug: "wiring", name: "Wiring & Rewiring" },
    { slug: "switchboard-repair", name: "Switchboard Repair" },
    { slug: "inverter-installation", name: "Inverter Installation" },
  ],
  painting: [
    { slug: "interior-painting", name: "Interior Painting" },
    { slug: "exterior-painting", name: "Exterior Painting" },
    { slug: "waterproofing", name: "Waterproofing" },
  ],
  "ac-repair": [
    { slug: "ac-servicing", name: "AC Servicing" },
    { slug: "gas-refill", name: "Gas Refill" },
    { slug: "ac-installation", name: "New AC Installation" },
  ],
  beauty: [
    { slug: "bridal-makeup", name: "Bridal Makeup" },
    { slug: "hair-styling", name: "Hair Styling" },
    { slug: "facial-threading", name: "Facial & Threading" },
  ],
  photography: [
    { slug: "wedding-photography", name: "Wedding Photography" },
    { slug: "event-photography", name: "Event Photography" },
    { slug: "portrait-shoots", name: "Portrait Shoots" },
  ],
  "car-wash": [
    { slug: "mobile-wash", name: "Mobile Car Wash" },
    { slug: "interior-detailing", name: "Interior Detailing" },
    { slug: "ceramic-coating", name: "Ceramic Coating" },
  ],
  tutoring: [
    { slug: "al-maths", name: "A/L Maths" },
    { slug: "ol-science", name: "O/L Science" },
    { slug: "english-classes", name: "English Classes" },
  ],
  handyman: [
    { slug: "furniture-assembly", name: "Furniture Assembly" },
    { slug: "door-window-repair", name: "Door & Window Repair" },
    { slug: "general-fixes", name: "General Fixes" },
  ],
};

type PkgTier = "basic" | "standard" | "premium";
interface SellerSeed {
  name: string;
  email: string;
  phone: string;
  categorySlug: string;
  subcategorySlug: string;
  title: string;
  description: string;
  area: string;
  planKey: "starter" | "pro" | "business";
  nicVerified: boolean;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  packages: { tier: PkgTier; name: string; price: number; description: string }[];
}

const SELLERS: SellerSeed[] = [
  {
    name: "Kasun Perera",
    email: "seller1.kasun@sewa-demo.lk",
    phone: "+94771000001",
    categorySlug: "cleaning",
    subcategorySlug: "deep-cleaning",
    title: "Deep Home Cleaning – Colombo & Suburbs",
    description: "Thorough deep cleaning for homes and apartments. I bring my own eco-friendly supplies and equipment.",
    area: "Nugegoda",
    planKey: "starter",
    nicVerified: true,
    rating: 4.7,
    totalReviews: 58,
    totalBookings: 64,
    packages: [
      { tier: "basic", name: "Quick Clean", price: 3500, description: "2-hour standard clean, 1-2 rooms." },
      { tier: "standard", name: "Deep Clean", price: 6000, description: "4-hour deep clean, whole apartment." },
      { tier: "premium", name: "Full Deep Clean", price: 9500, description: "6-hour deep clean plus windows and balcony." },
    ],
  },
  {
    name: "Nadeesha Fernando",
    email: "seller2.nadeesha@sewa-demo.lk",
    phone: "+94771000002",
    categorySlug: "plumbing",
    subcategorySlug: "leak-repair",
    title: "Leak Repairs & Bathroom Plumbing",
    description: "Fast, reliable fixes for leaks, taps and bathroom fittings across Colombo.",
    area: "Dehiwala",
    planKey: "starter",
    nicVerified: true,
    rating: 4.5,
    totalReviews: 22,
    totalBookings: 25,
    packages: [
      { tier: "basic", name: "Single Fix", price: 2000, description: "One leak or tap repair." },
      { tier: "standard", name: "Multi-Fix Visit", price: 4500, description: "Up to 3 fixtures in one visit." },
      { tier: "premium", name: "Bathroom Overhaul", price: 8000, description: "Full bathroom plumbing check and repair." },
    ],
  },
  {
    name: "Chathura Silva",
    email: "seller3.chathura@sewa-demo.lk",
    phone: "+94771000003",
    categorySlug: "electrical",
    subcategorySlug: "wiring",
    title: "Home Wiring & Electrical Repairs",
    description: "Licensed electrician for wiring, rewiring, switchboards and inverter installs.",
    area: "Colombo 05",
    planKey: "pro",
    nicVerified: true,
    rating: 4.8,
    totalReviews: 91,
    totalBookings: 103,
    packages: [
      { tier: "basic", name: "Quick Repair", price: 2500, description: "Single point or switch repair." },
      { tier: "standard", name: "Room Rewiring", price: 5500, description: "Full rewiring for one room." },
      { tier: "premium", name: "Whole-Home Wiring", price: 10000, description: "Complete home wiring inspection and fix." },
    ],
  },
  {
    name: "Amaya Jayasuriya",
    email: "seller4.amaya@sewa-demo.lk",
    phone: "+94771000004",
    categorySlug: "painting",
    subcategorySlug: "interior-painting",
    title: "Interior House Painting",
    description: "Neat, professional interior painting with quality paints. Free color consultation.",
    area: "Maharagama",
    planKey: "starter",
    nicVerified: false,
    rating: 4.2,
    totalReviews: 9,
    totalBookings: 11,
    packages: [
      { tier: "basic", name: "1 Room", price: 15000, description: "Single room, walls only." },
      { tier: "standard", name: "3 Rooms", price: 35000, description: "Three rooms including ceilings." },
      { tier: "premium", name: "Full House", price: 65000, description: "Whole house interior, 2 coats." },
    ],
  },
  {
    name: "Ruwan Bandara",
    email: "seller5.ruwan@sewa-demo.lk",
    phone: "+94771000005",
    categorySlug: "ac-repair",
    subcategorySlug: "ac-servicing",
    title: "AC Servicing & Gas Refill",
    description: "AC servicing, gas refills and installation for homes and offices.",
    area: "Kotte",
    planKey: "pro",
    nicVerified: true,
    rating: 4.6,
    totalReviews: 47,
    totalBookings: 52,
    packages: [
      { tier: "basic", name: "Standard Service", price: 3000, description: "Clean and check one unit." },
      { tier: "standard", name: "Service + Gas Refill", price: 7500, description: "Full service with gas top-up." },
      { tier: "premium", name: "Full Service + Parts", price: 15000, description: "Deep service, gas, and minor parts." },
    ],
  },
  {
    name: "Dilani Wickramasinghe",
    email: "seller6.dilani@sewa-demo.lk",
    phone: "+94771000006",
    categorySlug: "beauty",
    subcategorySlug: "bridal-makeup",
    title: "Bridal Makeup & Hair Styling",
    description: "Award-winning bridal makeup artist. Trial sessions available.",
    area: "Colombo 07",
    planKey: "business",
    nicVerified: true,
    rating: 4.9,
    totalReviews: 132,
    totalBookings: 140,
    packages: [
      { tier: "basic", name: "Everyday Makeup", price: 8000, description: "Makeup for a single event." },
      { tier: "standard", name: "Bridal Makeup", price: 15000, description: "Full bridal makeup, no hair." },
      { tier: "premium", name: "Bridal Package", price: 25000, description: "Makeup, hair styling and draping." },
    ],
  },
  {
    name: "Sanjeewa Rathnayake",
    email: "seller7.sanjeewa@sewa-demo.lk",
    phone: "+94771000007",
    categorySlug: "photography",
    subcategorySlug: "event-photography",
    title: "Event & Wedding Photography",
    description: "Candid event and wedding photography with same-week previews.",
    area: "Mount Lavinia",
    planKey: "pro",
    nicVerified: true,
    rating: 4.7,
    totalReviews: 64,
    totalBookings: 70,
    packages: [
      { tier: "basic", name: "2-Hour Shoot", price: 12000, description: "2 hours, edited digital gallery." },
      { tier: "standard", name: "Half Day", price: 25000, description: "4 hours, edited gallery + prints." },
      { tier: "premium", name: "Full Day + Album", price: 45000, description: "Full day coverage with printed album." },
    ],
  },
  {
    name: "Ishara Gunawardena",
    email: "seller8.ishara@sewa-demo.lk",
    phone: "+94771000008",
    categorySlug: "car-wash",
    subcategorySlug: "mobile-wash",
    title: "Mobile Car Wash & Detailing",
    description: "We come to you. Exterior wash, interior detailing and ceramic coating.",
    area: "Rajagiriya",
    planKey: "starter",
    nicVerified: true,
    rating: 4.4,
    totalReviews: 18,
    totalBookings: 20,
    packages: [
      { tier: "basic", name: "Exterior Wash", price: 1500, description: "Exterior wash and dry." },
      { tier: "standard", name: "Interior + Exterior", price: 3500, description: "Full wash plus interior vacuum & wipe." },
      { tier: "premium", name: "Ceramic Coating", price: 6500, description: "Full detail with ceramic coat application." },
    ],
  },
  {
    name: "Tharindu Mendis",
    email: "seller9.tharindu@sewa-demo.lk",
    phone: "+94771000009",
    categorySlug: "tutoring",
    subcategorySlug: "al-maths",
    title: "A/L Combined Maths Tuition",
    description: "Individual and small-group A/L Combined Maths classes, in-person.",
    area: "Kandy",
    planKey: "starter",
    nicVerified: false,
    rating: 4.3,
    totalReviews: 12,
    totalBookings: 14,
    packages: [
      { tier: "basic", name: "Single Session", price: 2000, description: "One 1.5-hour session." },
      { tier: "standard", name: "Monthly (4 sessions)", price: 7000, description: "4 sessions across the month." },
      { tier: "premium", name: "Monthly (8 sessions)", price: 12000, description: "8 sessions plus paper marking." },
    ],
  },
  {
    name: "Priyanka Dias",
    email: "seller10.priyanka@sewa-demo.lk",
    phone: "+94771000010",
    categorySlug: "handyman",
    subcategorySlug: "general-fixes",
    title: "General Handyman & Home Repairs",
    description: "Furniture assembly, door/window repairs and general home fixes.",
    area: "Moratuwa",
    planKey: "starter",
    nicVerified: true,
    rating: 4.5,
    totalReviews: 29,
    totalBookings: 33,
    packages: [
      { tier: "basic", name: "Quick Fix", price: 1800, description: "One small repair or assembly." },
      { tier: "standard", name: "Multi-Task Visit", price: 4000, description: "Up to 3 tasks in one visit." },
      { tier: "premium", name: "Full Home Check", price: 7500, description: "Whole-home fix-it list, half day." },
    ],
  },
];

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Confirm migration 0009 landed.
  const { error: plansCheckErr } = await supabase.from("plans").select("id").limit(1);
  if (plansCheckErr) {
    return NextResponse.json(
      { error: "Migration 0009 not applied yet", detail: plansCheckErr.message },
      { status: 412 },
    );
  }

  // 2. Category id lookup.
  const categorySlugs = Object.keys(SUBCATEGORIES);
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", categorySlugs);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id as string]));

  // 3. Seed subcategories.
  const subRows = categorySlugs.flatMap((catSlug) => {
    const catId = categoryIdBySlug.get(catSlug);
    if (!catId) return [];
    return (SUBCATEGORIES[catSlug] ?? []).map((s, i) => ({
      category_id: catId,
      name: s.name,
      slug: s.slug,
      is_active: true,
      sort_order: i + 1,
    }));
  });
  const { error: subErr } = await supabase
    .from("subcategories")
    .upsert(subRows, { onConflict: "category_id,slug" });
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  const { data: subcats, error: subFetchErr } = await supabase
    .from("subcategories")
    .select("id, slug, category_id");
  if (subFetchErr) return NextResponse.json({ error: subFetchErr.message }, { status: 500 });
  const subcatIdBySlug = new Map((subcats ?? []).map((s) => [s.slug, s.id as string]));

  // 4. Plan id lookup.
  const { data: plans, error: planErr } = await supabase.from("plans").select("id, key, commission_rate");
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });
  const planByKey = new Map((plans ?? []).map((p) => [p.key, p]));

  // 5. Create each fake seller.
  const results: { email: string; status: string }[] = [];

  for (const s of SELLERS) {
    let userId: string;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: s.email,
      password: "SewaDemo123!",
      email_confirm: true,
      user_metadata: { full_name: s.name, phone: s.phone, role: "seller" },
    });

    if (createErr || !created?.user) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users.find((u) => u.email === s.email);
      if (!existing) {
        results.push({ email: s.email, status: `failed: ${createErr?.message}` });
        continue;
      }
      userId = existing.id;
    } else {
      userId = created.user.id;
    }

    const plan = planByKey.get(s.planKey);
    const { data: sellerProfile, error: spErr } = await supabase
      .from("seller_profiles")
      .update({
        description: s.description,
        service_areas: [s.area],
        nic_verified: s.nicVerified,
        nic_verified_at: s.nicVerified ? new Date().toISOString() : null,
        rating: s.rating,
        total_reviews: s.totalReviews,
        total_bookings: s.totalBookings,
        plan_id: plan?.id ?? null,
        commission_rate: plan?.commission_rate ?? 0.1,
      })
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (spErr || !sellerProfile) {
      results.push({ email: s.email, status: `seller_profile update failed: ${spErr?.message}` });
      continue;
    }

    const categoryId = categoryIdBySlug.get(s.categorySlug);
    const subcategoryId = subcatIdBySlug.get(s.subcategorySlug);
    const basicPrice = s.packages.find((p) => p.tier === "basic")?.price ?? s.packages[0].price;

    const { data: existingService } = await supabase
      .from("services")
      .select("id")
      .eq("seller_id", sellerProfile.id)
      .eq("title", s.title)
      .maybeSingle();

    let serviceId: string;
    if (existingService) {
      serviceId = existingService.id;
    } else {
      const { data: newService, error: svcErr } = await supabase
        .from("services")
        .insert({
          seller_id: sellerProfile.id,
          category_id: categoryId,
          subcategory_id: subcategoryId ?? null,
          title: s.title,
          description: s.description,
          price: basicPrice,
          price_unit: "job",
          location_area: s.area,
          status: "active",
        })
        .select("id")
        .single();
      if (svcErr || !newService) {
        results.push({ email: s.email, status: `service insert failed: ${svcErr?.message}` });
        continue;
      }
      serviceId = newService.id;
    }

    const pkgRows = s.packages.map((p, i) => ({
      service_id: serviceId,
      tier: p.tier,
      name: p.name,
      description: p.description,
      price: p.price,
      price_unit: "job",
      sort_order: i + 1,
    }));
    const { error: pkgErr } = await supabase
      .from("service_packages")
      .upsert(pkgRows, { onConflict: "service_id,tier" });
    if (pkgErr) {
      results.push({ email: s.email, status: `packages failed: ${pkgErr.message}` });
      continue;
    }

    results.push({ email: s.email, status: "ok" });
  }

  return NextResponse.json({
    subcategories_seeded: subRows.length,
    sellers: results,
  });
}
