"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendPhoneCode, type AuthState } from "../(auth)/actions";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PhonePage() {
  const [digits, setDigits] = useState("");
  const [state, action, pending] = useActionState<AuthState, FormData>(sendPhoneCode, {});

  const formatted = digits.replace(/(\d{2})(\d{0,3})(\d{0,4})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(" "),
  );
  const isValid = digits.length === 9 && digits[0] === "7";

  function press(key: string) {
    if (key === "") return;
    if (key === "back") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    setDigits((d) => (d.length < 9 ? d + key : d));
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="px-[22px] pt-3">
        <Link
          href="/login"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
      </div>

      <div className="px-6 pt-5">
        <h1 className="text-[27px] font-extrabold tracking-tight">What&rsquo;s your number?</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&rsquo;ll text you a 6-digit code to verify it. No spam, ever.
        </p>

        <div className="mt-6 flex items-center gap-3 border-b-2 border-brand pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-[22px] w-[30px] flex-none rounded-[5px] bg-[linear-gradient(#8d1b3d_0_60%,#f0e100_60%_100%)]" />
            <span className="text-[17px] font-extrabold">+94</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-1 items-center text-[22px] font-extrabold tracking-wide">
            {formatted || <span className="text-muted-foreground/40">71 234 5678</span>}
            <span className="ml-0.5 h-6 w-0.5 animate-pulse bg-brand" />
          </div>
        </div>
        {isValid ? (
          <p className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Icon name="check_circle" filled className="text-base text-success" />
            Looks like a valid Sri Lanka mobile
          </p>
        ) : null}

        {state.error ? (
          <p className="mt-3.5 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="grid grid-cols-3 gap-2.5 px-5">
        {KEYS.map((k, i) =>
          k === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              className="flex h-14 items-center justify-center rounded-2xl border border-border bg-surface text-[23px] font-bold transition active:scale-[.94] active:bg-surface-muted"
            >
              {k === "back" ? <Icon name="backspace" className="text-2xl" /> : k}
            </button>
          ),
        )}
      </div>

      <form action={action} className="px-6 pb-8 pt-4">
        <input type="hidden" name="phone" value={`+94${digits}`} />
        <button
          type="submit"
          disabled={!isValid || pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] transition active:scale-[.98] disabled:opacity-40"
        >
          {pending ? "Sending" : "Send code"}
          <Icon name="arrow_forward" className="text-xl" />
        </button>
      </form>
    </main>
  );
}
