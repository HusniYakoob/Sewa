"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/** Posts the signed params to PayHere's hosted checkout (sandbox or live). */
export function PayForm({
  checkoutUrl,
  fields,
}: {
  checkoutUrl: string;
  fields: Record<string, string>;
}) {
  return (
    <form action={checkoutUrl} method="post">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" block>
        <Icon name="lock" /> Pay with PayHere
      </Button>
    </form>
  );
}
