import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "./chat-thread";
import { markConversationRead } from "./actions";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/welcome");

  const supabase = await createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, seller_id, booking_id, buyer:profiles(id, full_name, avatar_url), seller:seller_profiles(id, profile:profiles(full_name, avatar_url))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!convo) notFound();

  const isBuyer = convo.buyer_id === profile.id;
  const otherName = isBuyer
    ? (convo.seller as unknown as { profile: { full_name: string } | null })?.profile?.full_name
    : (convo.buyer as unknown as { full_name: string })?.full_name;

  const { data: msgData } = await supabase
    .from("messages")
    .select("id, sender_id, type, body, photo_url, location_label, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  let bookingContext: { id: string; title: string; scheduled_at: string } | null = null;
  if (convo.booking_id) {
    const { data: bk } = await supabase
      .from("bookings")
      .select("id, scheduled_at, service:services(title)")
      .eq("id", convo.booking_id)
      .maybeSingle();
    if (bk) {
      bookingContext = {
        id: bk.id,
        title: (bk.service as unknown as { title: string } | null)?.title ?? "Booking",
        scheduled_at: bk.scheduled_at,
      };
    }
  }

  await markConversationRead(id);

  return (
    <ChatThread
      conversationId={id}
      currentUserId={profile.id}
      otherName={otherName ?? "Sewa user"}
      bookingContext={bookingContext}
      initialMessages={(msgData ?? []) as unknown as {
        id: string;
        sender_id: string;
        type: "text" | "photo" | "location";
        body: string | null;
        photo_url: string | null;
        location_label: string | null;
        created_at: string;
      }[]}
    />
  );
}
