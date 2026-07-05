import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME seed endpoint. Upserts the launch service categories using the
// service-role client (bypasses RLS). Idempotent and non-destructive.
// Guarded by a fixed token; this route is removed right after seeding.
const TOKEN = "95c2b76f7835a227c9a737e4159a3b43d5350865c99738f6";

const CATEGORIES = [
  ["Cleaning", "cleaning", "Home and deep cleaning", "cleaning_services", 1],
  ["Plumbing", "plumbing", "Leaks, taps and fittings", "plumbing", 2],
  ["Electrical", "electrical", "Wiring, sockets and lights", "electrical_services", 3],
  ["Painting", "painting", "Interior and exterior painting", "format_paint", 4],
  ["Carpentry", "carpentry", "Furniture and woodwork", "carpenter", 5],
  ["Moving", "moving", "Moving and delivery help", "local_shipping", 6],
  ["Gardening", "gardening", "Garden and outdoor work", "yard", 7],
  ["AC Repair", "ac-repair", "AC service and repair", "mode_fan", 8],
  ["Appliance Repair", "appliance-repair", "Fridge, washer, oven fixes", "home_repair_service", 9],
  ["Pest Control", "pest-control", "Pest and termite treatment", "pest_control", 10],
  ["Tutoring", "tutoring", "Lessons and tutoring", "school", 11],
  ["Beauty & Salon", "beauty", "Hair, makeup and grooming", "content_cut", 12],
  ["Cooking", "cooking", "Home chefs and catering", "restaurant", 13],
  ["Laundry", "laundry", "Wash, iron and dry cleaning", "local_laundry_service", 14],
  ["Car Wash", "car-wash", "Vehicle wash and detailing", "local_car_wash", 15],
  ["Photography", "photography", "Photo and video shoots", "photo_camera", 16],
  ["Event Help", "events", "Setup and event staff", "celebration", 17],
  ["Elderly Care", "elderly-care", "Companionship and care", "elderly", 18],
  ["Baby Care", "baby-care", "Babysitting and nannies", "child_care", 19],
  ["Pet Care", "pet-care", "Walking, sitting, grooming", "pets", 20],
  ["Masonry", "masonry", "Tiling, plaster and concrete", "foundation", 21],
  ["Welding", "welding", "Metal and gate work", "construction", 22],
  ["CCTV & Security", "security", "Cameras and alarms", "security", 23],
  ["Internet & Wifi", "internet", "Network and wifi setup", "wifi", 24],
  ["Handyman", "handyman", "Odd jobs and repairs", "handyman", 25],
] as const;

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = CATEGORIES.map(([name, slug, description, icon, sort_order]) => ({
    name,
    slug,
    description,
    icon,
    sort_order,
    is_active: true,
  }));

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .upsert(rows, { onConflict: "slug" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return NextResponse.json({ seeded: rows.length, active_total: count });
}
