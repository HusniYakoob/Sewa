/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** Turn a full name into up-to-2 initials, e.g. "Husni Yakoob" -> "HY". */
export function initialsOf(name: string | null | undefined): string {
  return (name || "S")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

/**
 * Avatar — shows the user's photo when set, otherwise a brand-tinted circle
 * with their initials. Used everywhere a person is represented (home header,
 * profile, admin lists) so photo vs. fallback never looks inconsistent.
 */
export function Avatar({
  avatarUrl,
  name,
  size = "md",
  className,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Profile photo"}
        className={cn("flex-none rounded-full object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full bg-brand-tint font-extrabold text-brand-text",
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
