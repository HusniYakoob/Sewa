import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME cleanup endpoint. Deletes the throwaway QA test accounts created
// while verifying the avatar/seller-profile/service-limit features (emails
// matching qa-*@example.com). Cascades remove their profiles, seller
// profiles and test services. Removed right after running.
const TOKEN = "b41f9a2c7e6d0851f3a4c9e2d7b6018f5a3c9e2d7b6018f5";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const targets = data.users.filter((u) => /^qa-.*@example\.com$/.test(u.email ?? ""));
  const deleted: string[] = [];
  for (const u of targets) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (!delErr) deleted.push(u.email ?? u.id);
  }

  return NextResponse.json({ deleted_count: deleted.length, deleted });
}
