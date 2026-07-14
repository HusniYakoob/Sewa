"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/icon";
import { IconInput } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <Link
        href="/login"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <form action={action} className="flex flex-1 flex-col px-1">
        <div className="mt-6 flex-1">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-brand-tint">
            <Icon name="lock_reset" filled className="text-3xl text-brand-text" />
          </span>
          <h1 className="mt-5 text-[27px] font-extrabold tracking-tight">Forgot password?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter the email on your account and we&rsquo;ll send you a link to reset it.
          </p>

          <div className="mt-5">
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              Email
            </label>
            <IconInput icon="mail" name="email" type="email" autoComplete="email" required />
          </div>

          {state.error ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
              <Icon name="error" className="text-base" />
              {state.error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mb-[30px] w-full rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
