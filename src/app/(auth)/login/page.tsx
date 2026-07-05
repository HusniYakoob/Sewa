"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signInWithGoogle, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, IconInput } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";
import { GoogleButton, AuthDivider } from "../parts";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <div>
      <Link
        href="/"
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-border bg-surface text-foreground transition-colors hover:bg-surface-muted"
        aria-label="Back"
      >
        <Icon name="arrow_back" />
      </Link>

      <h1 className="text-[30px] font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">
        Sign in to your Sewa account.
      </p>

      <form action={signInWithGoogle} className="mt-8">
        <GoogleButton>Continue with Google</GoogleButton>
      </form>

      <AuthDivider />

      <form action={action} className="flex flex-col gap-4">
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
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </Field>
        <Link
          href="/forgot-password"
          className="-mt-2 self-end text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>

        {state.error ? (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Sewa?{" "}
        <Link href="/signup" className="font-bold text-brand-text underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
