"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MessageState {
  error?: string;
}

async function requireParticipant(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: convo } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, seller:seller_profiles(user_id)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return null;

  const sellerUserId = (convo.seller as unknown as { user_id: string } | null)?.user_id ?? null;
  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isBuyer = convo.buyer_id === user.id;
  const isSeller = sellerProfile?.id === convo.seller_id;
  if (!isBuyer && !isSeller) return null;

  const otherUserId = isBuyer ? sellerUserId : convo.buyer_id;
  if (otherUserId) {
    const { data: block } = await supabase
      .from("blocks")
      .select("blocker_id")
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
      .maybeSingle();
    if (block) return null;
  }

  return { userId: user.id, isBuyer, otherUserId };
}

/** Send a text message. Photo/location messages are inserted client-side after upload. */
export async function sendMessage(formData: FormData): Promise<MessageState> {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!conversationId || !body) return { error: "Type a message." };

  const supabase = await createClient();
  const ctx = await requireParticipant(supabase, conversationId);
  if (!ctx) return { error: "Not allowed." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: ctx.userId,
    type: "text",
    body,
  });
  if (error) return { error: error.message };

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/chats/${conversationId}`);
  revalidatePath("/chats");
  return {};
}

/** Block the other participant in this conversation. Blocking stops both sides from messaging. */
export async function blockOtherParticipant(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: convo } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id, seller:seller_profiles(user_id)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return;

  const sellerUserId = (convo.seller as unknown as { user_id: string } | null)?.user_id ?? null;
  const otherUserId = convo.buyer_id === user.id ? sellerUserId : convo.buyer_id;
  if (!otherUserId) return;

  await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: otherUserId });
  revalidatePath(`/chats/${conversationId}`);
  revalidatePath("/chats");
}

/** Mark the thread as read for the current side (buyer or seller). */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const ctx = await requireParticipant(supabase, conversationId);
  if (!ctx) return;

  const now = new Date().toISOString();
  await supabase
    .from("conversations")
    .update(ctx.isBuyer ? { buyer_last_read_at: now } : { seller_last_read_at: now })
    .eq("id", conversationId);
}

/**
 * Upload a chat photo server-side (same pattern as avatar upload — no
 * client-to-Supabase network dependency) and post it as a photo message.
 */
export async function sendPhotoMessage(formData: FormData): Promise<MessageState> {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const file = formData.get("file");
  if (!conversationId || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo." };
  }

  const supabase = await createClient();
  const ctx = await requireParticipant(supabase, conversationId);
  if (!ctx) return { error: "Not allowed." };

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${ctx.userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("chat-photos")
    .upload(path, file, { contentType: file.type });
  if (upErr) return { error: upErr.message };

  const { data } = admin.storage.from("chat-photos").getPublicUrl(path);

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: ctx.userId,
    type: "photo",
    photo_url: data.publicUrl,
  });
  if (error) return { error: error.message };

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/chats/${conversationId}`);
  return {};
}
