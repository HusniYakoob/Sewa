"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a new password for your account.
      </p>
      <form action={action} className="mt-8 flex flex-col gap-4">
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
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
          {pending ? "Saving" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
