"use client";

import { useActionState } from "react";
import { updateBankDetails, type EarningsState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export function BankForm({
  defaults,
}: {
  defaults: {
    name: string;
    number: string;
    bank: string;
    branch: string;
  };
}) {
  const [state, action, pending] = useActionState<EarningsState, FormData>(
    updateBankDetails,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      <Field label="Account holder name" htmlFor="bank_account_name">
        <Input id="bank_account_name" name="bank_account_name" defaultValue={defaults.name} required />
      </Field>
      <Field
        label="Account number"
        htmlFor="bank_account_number"
        hint="Must match your NIC name for payouts."
      >
        <Input id="bank_account_number" name="bank_account_number" defaultValue={defaults.number} required />
      </Field>
      <Field label="Bank" htmlFor="bank_name">
        <Input id="bank_name" name="bank_name" placeholder="Commercial Bank" defaultValue={defaults.bank} required />
      </Field>
      <Field label="Branch (optional)" htmlFor="bank_branch">
        <Input id="bank_branch" name="bank_branch" defaultValue={defaults.branch} />
      </Field>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending}>
        {pending ? "Saving" : "Save bank details"}
      </Button>
    </form>
  );
}
