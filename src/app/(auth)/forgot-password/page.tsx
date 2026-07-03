"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.sent) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <Card className="mt-6 flex items-center gap-2 border-success/40">
          <Icon name="mail" className="text-success" />
          <p className="text-sm">
            If an account exists for that email, a reset link is on its way.
          </p>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we will send a reset link.
      </p>
      <form action={action} className="mt-8 flex flex-col gap-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        {state.error ? (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}
        <Button type="submit" block disabled={pending}>
          {pending ? "Sending" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
