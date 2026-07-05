"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmailCode, sendEmailCode, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const LEN = 6;

function OtpForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [state, action, pending] = useActionState<AuthState, FormData>(
    verifyEmailCode,
    {},
  );
  const [, resend, resending] = useActionState<AuthState, FormData>(
    sendEmailCode,
    {},
  );

  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    inputs.current[0]?.focus();
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
      // Pasted / typed multiple — fill forward from here.
      const chars = v.slice(0, LEN - i).split("");
      const next = [...digits];
      chars.forEach((c, k) => (next[i + k] = c));
      setDigits(next);
      inputs.current[Math.min(i + chars.length, LEN - 1)]?.focus();
      return;
    }
    setDigit(i, v);
    if (i < LEN - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      setDigit(i - 1, "");
    }
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-border bg-surface text-foreground transition-colors hover:bg-surface-muted"
        aria-label="Back"
      >
        <Icon name="arrow_back" />
      </Link>

      <h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
      <p className="mt-2.5 text-[14.5px] text-muted-foreground">
        {email ? (
          <>
            Sent to <b className="text-foreground">{email}</b> ·{" "}
          </>
        ) : (
          "Enter the 6-digit code we emailed you. "
        )}
        <Link href="/login" className="font-bold text-brand-text hover:underline">
          Edit
        </Link>
      </p>

      <form action={action} className="mt-7">
        <input type="hidden" name="email" value={email} />
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
                "h-[64px] w-full rounded-xl border-[1.5px] bg-surface text-center text-[26px] font-extrabold text-foreground transition-all focus:outline-none",
                d
                  ? "border-brand"
                  : "border-border focus:border-brand focus:shadow-[0_0_0_4px_rgba(131,77,251,.12)]",
              )}
            />
          ))}
        </div>

        <div className="mt-4 text-[13px] text-muted-foreground">
          {seconds > 0 ? (
            <>
              Resend code in{" "}
              <b className="tabular-nums text-foreground">0:{String(seconds).padStart(2, "0")}</b>
            </>
          ) : (
            <button
              type="submit"
              formAction={resend}
              disabled={resending}
              className="font-bold text-brand-text hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
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
          {pending ? "Verifying" : "Verify & continue"}
        </Button>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
