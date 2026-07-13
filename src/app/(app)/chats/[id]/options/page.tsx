import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { blockOtherParticipant } from "../actions";

export default async function ChatOptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, booking_id")
    .eq("id", id)
    .maybeSingle();
  if (!convo) notFound();

  async function block() {
    "use server";
    await blockOtherParticipant(id);
    redirect("/chats");
  }

  return (
    <div className="px-[22px] pt-3 pb-24">
      <Link
        href={`/chats/${id}`}
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>
      <h1 className="mt-4 text-[19px] font-extrabold tracking-tight">Conversation options</h1>

      <div className="mt-5 overflow-hidden rounded-2xl border-[1.5px] border-border bg-surface">
        {convo.booking_id ? (
          <Link
            href={`/booking/${convo.booking_id}`}
            className="flex items-center gap-3.5 border-b border-border p-4 last:border-b-0"
          >
            <Icon name="event" className="text-brand-text" />
            <span className="flex-1 text-sm font-bold">View booking</span>
            <Icon name="chevron_right" className="text-muted-foreground/40" />
          </Link>
        ) : null}
        <Link
          href={`/help/report?booking=${convo.booking_id ?? ""}`}
          className="flex items-center gap-3.5 border-b border-border p-4 last:border-b-0"
        >
          <Icon name="flag" className="text-danger" />
          <span className="flex-1 text-sm font-bold text-danger">Report user</span>
          <Icon name="chevron_right" className="text-muted-foreground/40" />
        </Link>
        <form action={block}>
          <button
            type="submit"
            className="flex w-full items-center gap-3.5 p-4 text-left"
          >
            <Icon name="block" className="text-danger" />
            <span className="flex-1 text-sm font-bold text-danger">Block user</span>
          </button>
        </form>
      </div>
      <p className="mt-3 px-1 text-xs text-muted-foreground">
        Blocking stops both of you from sending new messages in this conversation.
      </p>
    </div>
  );
}
