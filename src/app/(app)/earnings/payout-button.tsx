"use client";

import { useActionState } from "react";
import { requestPayout, type EarningsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function PayoutButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<EarningsState, FormData>(
    requestPayout,
    {},
  );
  return (
    <form action={action}>
      <Button type="submit" block disabled={disabled || pending}>
        <Icon name="account_balance" />{" "}
        {pending ? "Requesting" : "Request payout"}
      </Button>
      {state.error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-success">
          <Icon name="check_circle" filled className="text-base" />
          Payout requested. An admin will process it.
        </p>
      ) : null}
    </form>
  );
}
