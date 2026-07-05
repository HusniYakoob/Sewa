"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Icon } from "@/components/ui/icon";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-text">
        <Icon name="lock_reset" className="text-3xl" filled />
      </div>
      <h1 className="text-[30px] font-extrabold tracking-tight">Set a new password</h1>
      <p className="mt-2.5 text-[14.5px] text-muted-foreground">
        Choose a new password for your Sewa account.
      </p>
      <form action={action} className="mt-8 flex flex-col gap-4">
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
          <PasswordInput
            id="password"
            name="password"
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
          {pending ? "Saving" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
