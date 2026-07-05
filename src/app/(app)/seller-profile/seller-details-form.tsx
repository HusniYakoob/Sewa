"use client";

import { useActionState, useState } from "react";
import { updateSellerDetails, type SellerDetailsState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export function SellerDetailsForm({
  description,
  serviceAreas,
}: {
  description: string;
  serviceAreas: string[];
}) {
  const [state, action, pending] = useActionState<SellerDetailsState, FormData>(
    updateSellerDetails,
    {},
  );
  const [areasInput, setAreasInput] = useState(serviceAreas.join(", "));
  const chips = areasInput
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label="About your services"
        htmlFor="description"
        hint="What you offer, your experience, what makes you reliable."
      >
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={description}
          placeholder="e.g. 8 years doing home cleaning and deep cleans across Colombo. I bring my own supplies and equipment."
          className="w-full rounded-lg border-[1.5px] border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      <Field
        label="Service areas"
        htmlFor="service_areas"
        hint="Separate multiple areas with commas, e.g. Nugegoda, Colombo 04, Dehiwala."
      >
        <input
          id="service_areas"
          name="service_areas"
          type="text"
          value={areasInput}
          onChange={(e) => setAreasInput(e.target.value)}
          placeholder="Nugegoda, Colombo 04, Dehiwala"
          className="h-12 w-full rounded-md border-[1.5px] border-border bg-surface px-4 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </Field>

      {chips.length > 0 ? (
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {chips.map((area) => (
            <span
              key={area}
              className="flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand-text"
            >
              <Icon name="location_on" className="text-sm" />
              {area}
            </span>
          ))}
        </div>
      ) : null}

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Saving" : "Save profile"}
      </Button>
    </form>
  );
}
