"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, sendPhotoMessage } from "./actions";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  sender_id: string;
  type: "text" | "photo" | "location";
  body: string | null;
  photo_url: string | null;
  location_label: string | null;
  created_at: string;
}

const QUICK_REPLIES = ["On my way", "Running 10 min late", "Thanks!"];

export function ChatThread({
  conversationId,
  currentUserId,
  otherName,
  bookingContext,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  bookingContext: { id: string; title: string; scheduled_at: string } | null;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as Msg;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  function submitText(text: string) {
    if (!text.trim()) return;
    const optimistic: Msg = {
      id: `local-${Date.now()}`,
      sender_id: currentUserId,
      type: "text",
      body: text,
      photo_url: null,
      location_label: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    const fd = new FormData();
    fd.set("conversation_id", conversationId);
    fd.set("body", text);
    startTransition(async () => {
      await sendMessage(fd);
    });
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("conversation_id", conversationId);
    fd.set("file", file);
    startTransition(async () => {
      await sendPhotoMessage(fd);
    });
  }

  let lastDay = "";

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-3">
        <Link
          href="/chats"
          aria-label="Back"
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] text-xs font-extrabold text-white">
          {otherName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold">{otherName}</p>
        </div>
        <Link
          href={`/chats/${conversationId}/options`}
          aria-label="Options"
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="more_vert" />
        </Link>
      </div>

      {bookingContext ? (
        <Link
          href={`/booking/${bookingContext.id}`}
          className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-3.5 py-2.5 shadow-[0_4px_14px_-10px_rgba(131,77,251,.4)]"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-tint">
            <Icon name="cleaning_services" className="text-base text-brand-text" />
          </span>
          <span className="flex-1 text-xs font-extrabold">
            {bookingContext.title} ·{" "}
            {new Date(bookingContext.scheduled_at).toLocaleString("en-LK", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <Icon name="chevron_right" className="text-muted-foreground" />
        </Link>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 pb-3 pt-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Say hello to start the conversation.
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          const day = new Date(m.created_at).toDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay ? (
                <p className="my-2.5 text-center text-[11px] font-bold text-muted-foreground/60">
                  {new Date(m.created_at).toLocaleDateString("en-LK", { dateStyle: "medium" })}
                </p>
              ) : null}
              <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {m.type === "photo" && m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt="Shared photo"
                    className="max-w-[70%] rounded-2xl object-cover"
                  />
                ) : m.type === "location" ? (
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-3.5 py-2.5 shadow-sm">
                    <Icon name="location_on" className="text-base text-brand-text" />
                    <span className="text-xs">{m.location_label ?? "Location shared"}</span>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[78%] px-3.5 py-2.5 text-[13.5px] leading-snug",
                      mine
                        ? "rounded-[16px_16px_4px_16px] bg-brand text-white"
                        : "rounded-[16px_16px_16px_4px] bg-surface shadow-sm",
                    )}
                  >
                    {m.body}
                  </div>
                )}
                <span className="mt-1 px-1 text-[10.5px] text-muted-foreground/60">
                  {new Date(m.created_at).toLocaleTimeString("en-LK", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 overflow-x-auto px-4">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => submitText(q)}
            className="flex-none rounded-full border-[1.5px] border-border bg-surface px-3.5 py-1.5 text-xs font-bold"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="add" className="text-muted-foreground" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitText(draft);
          }}
          placeholder={`Message ${otherName.split(" ")[0]}…`}
          className="h-[42px] flex-1 rounded-full border border-border bg-surface px-4 text-[13.5px] focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={() => submitText(draft)}
          disabled={pending || !draft.trim()}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_rgba(131,77,251,.3)] disabled:opacity-50"
        >
          <Icon name="send" className="text-lg" />
        </button>
      </div>
    </div>
  );
}
