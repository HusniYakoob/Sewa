"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, signInWithGoogle, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, IconInput } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { GoogleButton, AuthDivider } from "../parts";
import { cn } from "@/lib/utils";

const roles = [
  {
    value: "buyer",
    label: "Book services",
    hint: "Hire trusted taskers",
    icon: "search",
  },
  {
    value: "seller",
    label: "Offer services",
    hint: "Earn as a tasker",
    icon: "handyman",
  },
] as const;

export default function SignupPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

  return (
    <div>
      <h1 className="text-[30px] font-extrabold tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">
        Join Sewa in a minute.
      </p>

      <form action={signInWithGoogle} className="mt-8">
        <GoogleButton>Sign up with Google</GoogleButton>
      </form>

      <AuthDivider />

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <div>
          <p className="mb-2 text-sm font-bold text-foreground">I want to</p>
          <div className="grid grid-cols-2 gap-2.5">
            {roles.map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg border-[1.5px] p-3.5 text-left transition-all",
                    active
                      ? "border-brand bg-brand-tint shadow-[0_8px_20px_-10px_rgba(131,77,251,.5)]"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      active ? "bg-brand text-brand-foreground" : "bg-surface-muted text-brand-text",
                    )}
                  >
                    <Icon name={r.icon} />
                  </span>
                  <span className="mt-0.5 text-[14.5px] font-bold leading-tight">
                    {r.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Full name" htmlFor="full_name">
          <IconInput
            icon="person"
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        </Field>
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
        <Field label="Phone number" htmlFor="phone" hint="Used to reach you about bookings.">
          <IconInput
            icon="call"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <IconInput
            icon="lock"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
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
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-text underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
