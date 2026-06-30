import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names safely, letting later Tailwind utilities win over earlier
 * ones (e.g. `cn("px-4", condition && "px-6")` resolves to `px-6`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
