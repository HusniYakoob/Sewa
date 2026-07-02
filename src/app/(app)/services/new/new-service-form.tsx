"use client";

import { useActionState } from "react";
import { createService, type ServiceFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

type Category = { id: string; name: string };

export function NewServiceForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    createService,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      <Field label="Service title" htmlFor="title">
        <Input id="title" name="title" placeholder="Deep home cleaning" required />
      </Field>

      <Field label="Category" htmlFor="category_id">
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue=""
          className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Choose a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (LKR)" htmlFor="price">
          <Input id="price" name="price" type="number" min="1" step="1" placeholder="5000" required />
        </Field>
        <Field label="Per" htmlFor="price_unit">
          <select
            id="price_unit"
            name="price_unit"
            defaultValue="hour"
            className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="hour">Hour</option>
            <option value="job">Job</option>
          </select>
        </Field>
      </div>

      <Field label="Area" htmlFor="location_area" hint="Where you work, e.g. Colombo 04.">
        <Input id="location_area" name="location_area" placeholder="Colombo 04" />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What is included, how long it takes, what you bring."
          className="w-full rounded-lg border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" className="h-4 w-4 accent-brand" />
        Publish now (otherwise saved as draft)
      </label>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending}>
        {pending ? "Saving" : "Save service"}
      </Button>
    </form>
  );
}
