"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/icon";
import { IconInput } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <Link
        href="/welcome"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <form action={action} className="mt-5 flex flex-1 flex-col px-1">
        <h1 className="text-[28px] font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Takes less than a minute. You can add more details later.
        </p>

        <div className="mt-6 flex flex-col gap-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              Full name
            </label>
            <IconInput icon="person" name="full_name" autoComplete="name" placeholder="Your name" required />
          </div>
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
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              minLength={8}
              required
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              At least 8 characters, with a number
            </p>
          </div>
        </div>

        <label className="mt-4.5 flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-none rounded-md border-border accent-brand"
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            I agree to Sewa&rsquo;s <b className="text-foreground underline">Terms of Service</b> and{" "}
            <b className="text-foreground underline">Privacy Policy</b>.
          </span>
        </label>

        {state.error ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}

        <div className="flex-1" />
        <button
          type="submit"
          disabled={pending || !agreed}
          className={cn(
            "mt-6 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] transition active:scale-[.98]",
            (pending || !agreed) && "opacity-60",
          )}
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="mb-4 mt-4.5 text-center text-[13.5px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-extrabold text-brand-text">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
