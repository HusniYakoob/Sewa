"use client";

import { Icon } from "@/components/ui/icon";

/** Posts the signed params to PayHere's hosted checkout (sandbox or live). */
export function PayForm({
  checkoutUrl,
  fields,
  label,
}: {
  checkoutUrl: string;
  fields: Record<string, string>;
  label: string;
}) {
  return (
    <form action={checkoutUrl} method="post">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-brand-foreground shadow-[0_12px_26px_-8px_rgba(131,77,251,.5)] transition active:scale-[.98]"
      >
        <Icon name="lock" className="text-lg" /> {label}
      </button>
    </form>
  );
}
