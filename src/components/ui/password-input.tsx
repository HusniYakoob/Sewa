"use client";

import { useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * PasswordInput — lock icon + a show/hide eye toggle. Used everywhere a
 * password is entered so users can check what they typed before submitting.
 */
export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Icon
        name="lock"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.3rem] text-muted-foreground"
      />
      <Input
        type={visible ? "text" : "password"}
        className={cn("pl-11 pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} className="text-[1.25rem]" />
      </button>
    </div>
  );
}
