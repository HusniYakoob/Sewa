"use client";

import { useActionState } from "react";
import { requestPayout, type EarningsState } from "./actions";
import { Icon } from "@/components/ui/icon";

/** Yellow "Withdraw" pill inside the balance card. */
export function PayoutButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<EarningsState, FormData>(
    requestPayout,
    {},
  );
  return (
    <div>
      <form action={action}>
        <button
          type="submit"
          disabled={disabled || pending}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-accent-foreground transition active:scale-95 disabled:opacity-50"
        >
          {pending ? "Requesting…" : "Withdraw"}
        </button>
      </form>
      {state.error ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#FFD9DE]">
          <Icon name="error" className="text-sm" />
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#E4D9FB]">
          <Icon name="check_circle" filled className="text-sm" />
          Requested. An admin will process it.
        </p>
      ) : null}
    </div>
  );
}
