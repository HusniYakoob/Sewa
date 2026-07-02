"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const roles = [
  { value: "buyer", label: "Book services", icon: "search" },
  { value: "seller", label: "Offer services", icon: "handyman" },
] as const;

export default function SignupPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Join Sewa in a minute.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />

        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => {
            const active = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-foreground bg-surface-muted"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <Icon name={r.icon} />
                <span className="text-sm font-medium">{r.label}</span>
              </button>
            );
          })}
        </div>

        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Phone number" htmlFor="phone" hint="Used to reach you about bookings.">
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+94 77 123 4567" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        {state.error ? (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}

        <Button type="submit" block disabled={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
