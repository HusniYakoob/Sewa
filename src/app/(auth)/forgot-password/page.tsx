"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, IconInput } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.sent) {
    return (
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-text">
          <Icon name="mark_email_read" className="text-3xl" filled />
        </div>
        <h1 className="text-[30px] font-extrabold tracking-tight">Check your email</h1>
        <p className="mt-2.5 text-[14.5px] text-muted-foreground">
          If an account exists for that email, a password reset link is on its way.
          Follow it to set a new password.
        </p>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", block: true, className: "mt-8" })}
        >
          Back to sign in
        </Link>
      </div>
    );
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

      <h1 className="text-[30px] font-extrabold tracking-tight">Reset your password</h1>
      <p className="mt-2.5 text-[14.5px] text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form action={action} className="mt-8 flex flex-col gap-4">
        <Field label="Email" htmlFor="email">
          <IconInput
            icon="mail"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        {state.error ? (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? "Sending" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-bold text-brand-text underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
