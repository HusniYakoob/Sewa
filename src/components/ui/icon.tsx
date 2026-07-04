import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Icon — Google Material Symbols (rounded). Use this everywhere; no emojis.
 * `name` is the Material Symbol id, e.g. "search", "verified", "dark_mode".
 * Browse names at https://fonts.google.com/icons.
 *
 * Size follows font-size (default 1.25rem); pass a text-size class to change it,
 * e.g. <Icon name="search" className="text-2xl" />.
 */
export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
  /** Decorative by default; set a label to expose it to screen readers. */
  label?: string;
}

export function Icon({
  name,
  filled,
  label,
  className,
  style,
  ...props
}: IconProps) {
  return (
    <span
      className={cn("material-symbols-rounded text-xl", className)}
      style={
        filled
          ? { fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24', ...style }
          : style
      }
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      {...props}
    >
      {name}
    </span>
  );
}
