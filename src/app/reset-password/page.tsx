"use client";

import { useActionState, useMemo, useState } from "react";
import { updatePassword, type AuthState } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/icon";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score;
}

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const score = useMemo(() => strengthOf(password), [password]);
  const label = ["Too short", "Weak", "Okay", "Strong", "Strong"][score];
  const color = score >= 3 ? "bg-success" : score === 2 ? "bg-warning" : "bg-danger";
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <form action={action} className="flex flex-1 flex-col px-1">
        <div className="mt-6 flex-1">
          <h1 className="text-[26px] font-extrabold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Make it something you don&rsquo;t use anywhere else.
          </p>

          <div className="mt-5">
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              New password
            </label>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {password ? (
            <>
              <div className="mt-2.5 flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-[5px] flex-1 rounded-full",
                      i < score ? color : "bg-border",
                    )}
                  />
                ))}
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[11.5px] font-bold",
                  score >= 3 ? "text-success" : score === 2 ? "text-warning" : "text-danger",
                )}
              >
                {label} password
              </p>
            </>
          ) : null}

          <div className="mt-4">
            <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
              Confirm new password
            </label>
            <PasswordInput
              name="confirm_password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {mismatch ? (
              <p className="mt-1.5 text-xs text-danger">Passwords do not match.</p>
            ) : null}
          </div>

          <div className="mt-4.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Icon
                name="check_circle"
                filled
                className={cn("text-base", hasMinLength ? "text-success" : "text-muted-foreground/40")}
              />
              <span className="text-xs text-muted-foreground">At least 8 characters</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name="check_circle"
                filled
                className={cn("text-base", hasNumberOrSymbol ? "text-success" : "text-muted-foreground/40")}
              />
              <span className="text-xs text-muted-foreground">A number or symbol</span>
            </div>
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
          disabled={pending || mismatch || password.length < 8}
          className="mb-[30px] w-full rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}
