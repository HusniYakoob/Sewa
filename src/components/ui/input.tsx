import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Input — text/number/email field. 48px tall to match buttons and stay
 * thumb-friendly on mobile.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-md border-[1.5px] border-border bg-surface px-4 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * IconInput — Input with a leading Material Symbol icon. Used across every
 * onboarding form so the fields look uniform (mail / lock / person / call).
 */
export interface IconInputProps extends InputProps {
  icon: string;
}

export function IconInput({ icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon
        name={icon}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.3rem] text-muted-foreground"
      />
      <Input className={cn("pl-11", className)} {...props} />
    </div>
  );
}

/** Field — label + input + optional hint/error, with consistent spacing. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
