import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — status pills (paid / pending / failed) and labels (NIC Verified).
 * Status variants stay colour-coded on purpose; always include a label or icon
 * so meaning never relies on colour alone (accessibility).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold [&_.material-symbols-rounded]:text-[0.95rem]",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-muted-foreground",
        solid: "bg-brand text-brand-foreground",
        brand: "bg-brand-tint text-brand-text",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        info: "bg-brand-tint text-brand-text",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
