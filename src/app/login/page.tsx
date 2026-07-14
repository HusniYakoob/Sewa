"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signInWithGoogle, type AuthState } from "@/app/(auth)/actions";
import { GoogleButton, AuthDivider } from "@/app/(auth)/parts";
import { Icon } from "@/components/ui/icon";
import { IconInput } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <Link
        href="/welcome"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <div className="mt-5 flex-1 px-1">
        <h1 className="text-[27px] font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Use your email and password to sign in to Sewa.
        </p>

        <form action={action} className="mt-5 flex flex-col gap-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              Email
            </label>
            <IconInput icon="mail" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              Password
            </label>
            <PasswordInput name="password" autoComplete="current-password" required />
          </div>
          <Link
            href="/forgot-password"
            className="-mt-1.5 self-end text-[13px] font-extrabold text-brand-text"
          >
            Forgot password?
          </Link>

          {state.error ? (
            <p className="flex items-center gap-1.5 text-sm text-danger">
              <Icon name="error" className="text-base" />
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] transition active:scale-[.98] disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <AuthDivider />
        <form action={signInWithGoogle}>
          <GoogleButton>Continue with Google</GoogleButton>
        </form>

        <Link
          href="/phone"
          className="mt-2.5 flex items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface py-[15px] text-[14.5px] font-extrabold"
        >
          <Icon name="call" className="text-lg" />
          Continue with phone
        </Link>

        <p className="mt-4.5 text-center text-[13.5px] text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-extrabold text-brand-text">
            Sign up
          </Link>
        </p>
        <p className="mt-4.5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          By continuing you agree to Sewa&rsquo;s
          <br />
          <b className="text-foreground underline">Terms of Service</b> &amp;{" "}
          <b className="text-foreground underline">Privacy Policy</b>
        </p>
      </div>
    </div>
  );
}
