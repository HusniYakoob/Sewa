"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { fileReport, type ReportState } from "./actions";
import { Icon } from "@/components/ui/icon";

const CATEGORIES = [
  { value: "payment", label: "Payment issue", icon: "payments" },
  { value: "quality", label: "Job quality", icon: "cleaning_services" },
  { value: "safety", label: "Safety concern", icon: "shield" },
  { value: "no_show", label: "No-show", icon: "event_busy" },
  { value: "other", label: "Something else", icon: "more_horiz" },
] as const;

export function ReportForm({ bookingId }: { bookingId: string | null }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(fileReport, {});
  const [category, setCategory] = useState<string>("");

  return (
    <form action={action} className="px-[22px] pt-3 pb-24">
      <input type="hidden" name="booking_id" value={bookingId ?? ""} />
      <Link
        href="/help"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <h1 className="mt-4 text-[20px] font-extrabold tracking-tight">Report a problem</h1>
      <p className="mt-1.5 text-[13px] text-muted-foreground">
        {bookingId
          ? "We'll look into what happened with this booking."
          : "Tell us what went wrong — we usually reply within a day."}
      </p>

      <p className="mb-2 mt-5 text-[11.5px] font-extrabold tracking-wide text-muted-foreground">
        CATEGORY
      </p>
      <div className="flex flex-col gap-2">
        {CATEGORIES.map((c) => (
          <label
            key={c.value}
            className={`flex items-center gap-3 rounded-2xl border-[1.5px] p-3.5 ${
              category === c.value ? "border-brand bg-brand-tint" : "border-border bg-surface"
            }`}
          >
            <input
              type="radio"
              name="category"
              value={c.value}
              checked={category === c.value}
              onChange={() => setCategory(c.value)}
              className="sr-only"
            />
            <Icon name={c.icon} className="text-brand-text" />
            <span className="text-sm font-bold">{c.label}</span>
          </label>
        ))}
      </div>

      <label className="mb-1.5 mt-5 block text-[13px] font-bold">Subject</label>
      <input
        name="subject"
        placeholder="Short summary"
        className="w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3.5 text-sm focus:border-brand focus:outline-none"
      />

      <label className="mb-1.5 mt-4 block text-[13px] font-bold">Details (optional)</label>
      <textarea
        name="details"
        rows={4}
        placeholder="Anything else we should know?"
        className="w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3.5 text-sm focus:border-brand focus:outline-none"
      />

      {state.error ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Submit report"}
      </button>
    </form>
  );
}
