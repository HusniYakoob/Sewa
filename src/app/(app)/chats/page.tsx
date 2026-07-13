import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";

type ConversationRow = {
  id: string;
  buyer_id: string;
  updated_at: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  buyer: { full_name: string; avatar_url: string | null } | null;
  seller: { profile: { full_name: string; avatar_url: string | null } | null } | null;
};

export default async function ChatsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, updated_at, buyer_last_read_at, seller_last_read_at, buyer:profiles(full_name, avatar_url), seller:seller_profiles(profile:profiles(full_name, avatar_url))",
    )
    .order("updated_at", { ascending: false });

  const conversations = (data ?? []) as unknown as ConversationRow[];
  const isBuyer = (c: ConversationRow) => c.buyer_id === profile?.id;

  const withLastMessage = await Promise.all(
    conversations.map(async (c) => {
      const { data: last } = await supabase
        .from("messages")
        .select("body, type, created_at, sender_id")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...c, last };
    }),
  );

  return (
    <div>
      <h1 className="px-[22px] pt-3 text-[28px] font-extrabold tracking-tight">Chats</h1>
      <div className="px-[22px] pt-3.5">
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3">
          <Icon name="search" className="text-muted-foreground" />
          <span className="text-[13.5px] text-muted-foreground">Search chats</span>
        </div>
      </div>

      <div className="flex flex-col px-[22px] pb-24 pt-3">
        {withLastMessage.length === 0 ? (
          <EmptyState icon="chat_bubble" title="No conversations yet" />
        ) : (
          withLastMessage.map((c) => {
            const buyerSide = isBuyer(c);
            const otherName = buyerSide
              ? c.seller?.profile?.full_name
              : c.buyer?.full_name;
            const unread = buyerSide
              ? !c.buyer_last_read_at || new Date(c.buyer_last_read_at) < new Date(c.updated_at)
              : !c.seller_last_read_at || new Date(c.seller_last_read_at) < new Date(c.updated_at);
            const preview =
              c.last?.type === "photo"
                ? "📷 Photo"
                : c.last?.type === "location"
                  ? "📍 Location shared"
                  : c.last?.body ?? "Say hello";

            return (
              <Link
                key={c.id}
                href={`/chats/${c.id}`}
                className="flex items-center gap-3 border-b border-border py-3.5"
              >
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] text-sm font-extrabold text-white">
                  {(otherName ?? "?")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-extrabold">{otherName}</p>
                  <p
                    className={
                      unread
                        ? "truncate text-xs font-bold text-foreground"
                        : "truncate text-xs text-muted-foreground"
                    }
                  >
                    {preview}
                  </p>
                </div>
                {unread ? <span className="h-2.5 w-2.5 flex-none rounded-full bg-brand" /> : null}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
