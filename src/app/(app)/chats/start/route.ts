import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Find-or-create the conversation with a seller, then redirect to the thread. */
export async function GET(req: Request) {
  const sellerId = new URL(req.url).searchParams.get("seller");
  if (!sellerId) return NextResponse.redirect(new URL("/chats", req.url));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/welcome", req.url));

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(new URL(`/chats/${existing.id}`, req.url));
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (error || !created) return NextResponse.redirect(new URL("/chats", req.url));
  return NextResponse.redirect(new URL(`/chats/${created.id}`, req.url));
}
