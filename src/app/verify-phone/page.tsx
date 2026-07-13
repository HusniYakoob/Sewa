"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyPhoneCode, sendPhoneCode, type AuthState } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const LEN = 6;

function VerifyPhoneForm() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [state, action, pending] = useActionState<AuthState, FormData>(
    verifyPhoneCode,
    {},
  );
  const [, resend, resending] = useActionState<AuthState, FormData>(sendPhoneCode, {});

  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(30);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    inputs.current[0]?.focus();
    const t = setTimeout(() => setDetecting(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const code = digits.join("");

  function setDigit(i: number, val: string) {
    const next = [...digits];
    next[i] = val;
    setDigits(next);
  }

  function handleChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, "");
    if (!v) {
      setDigit(i, "");
      return;
    }
    if (v.length > 1) {
      const chars = v.slice(0, LEN - i).split("");
      const next = [...digits];
      chars.forEach((c, k) => (next[i + k] = c));
      setDigits(next);
      inputs.current[Math.min(i + chars.length, LEN - 1)]?.focus();
      return;
    }
    setDigit(i, v);
    setDetecting(false);
    if (i < LEN - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setDigit(i - 1, "");
    }
  }

  return (
    <div className="px-6 pt-3">
      <Link
        href="/phone"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <span className="mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-brand-tint">
        <Icon name="sms" filled className="text-[30px] text-brand-text" />
      </span>

      <h1 className="mt-5 text-[27px] font-extrabold tracking-tight">Enter the code</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        6-digit code sent to <b className="text-foreground">{phone}</b> ·{" "}
        <Link href="/phone" className="font-bold text-brand-text hover:underline">
          Edit
        </Link>
      </p>

      <form action={action} className="mt-6">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="token" value={code} />

        <div className="flex gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LEN}
              aria-label={`Digit ${i + 1}`}
              className={cn(
                "h-[62px] w-full rounded-2xl border-2 bg-surface text-center text-[26px] font-extrabold text-foreground transition-all focus:outline-none",
                d
                  ? "border-brand"
                  : "border-border focus:border-brand focus:shadow-[0_0_0_4px_rgba(131,77,251,.12)]",
              )}
            />
          ))}
        </div>

        {detecting ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-tint px-3.5 py-2.5">
            <Icon name="autorenew" className="animate-spin text-lg text-brand-text" />
            <span className="text-xs font-bold text-brand-text">Detecting code from SMS…</span>
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">Didn&rsquo;t get it?</span>
          {seconds > 0 ? (
            <span className="font-extrabold text-muted-foreground/50">
              Resend in 0:{String(seconds).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="submit"
              formAction={resend}
              disabled={resending}
              className="font-extrabold text-brand-text hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend"}
            </button>
          )}
        </div>

        {state.error ? (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          block
          className="mt-8"
          disabled={pending || code.length < LEN}
        >
          {pending ? "Verifying" : "Verify"}
        </Button>
      </form>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense>
      <VerifyPhoneForm />
    </Suspense>
  );
}
