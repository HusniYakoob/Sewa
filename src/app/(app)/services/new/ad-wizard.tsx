"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createService, type ServiceFormState } from "../actions";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Subcategory = { id: string; name: string; category_id: string };
type Category = { id: string; name: string; subcategories: Subcategory[] };

const STEPS = ["Basics", "Photos", "Pricing", "Review"];
const TIERS = ["basic", "standard", "premium"] as const;

export function AdWizard({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [prices, setPrices] = useState<Record<(typeof TIERS)[number], string>>({
    basic: "",
    standard: "",
    premium: "",
  });
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    createService,
    {},
  );

  const subcategories = useMemo(
    () => categories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [categories, categoryId],
  );

  const canNext = [
    Boolean(title && categoryId),
    true,
    TIERS.every((t) => Number(prices[t]) > 0),
    true,
  ][step];

  return (
    <form action={action} className="flex min-h-dvh flex-col px-[22px] pb-24 pt-3">
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="subcategory_id" value={subcategoryId} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="location_area" value={locationArea} />
      {TIERS.map((t) => (
        <input key={t} type="hidden" name={`${t}_price`} value={prices[t]} />
      ))}
      <input type="hidden" name="basic_name" value="Basic" />
      <input type="hidden" name="standard_name" value="Standard" />
      <input type="hidden" name="premium_name" value="Premium" />
      <input type="hidden" name="publish" value="on" />

      <div className="flex items-center gap-3">
        <Link
          href="/services"
          aria-label="Back"
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="flex-1 text-[17px] font-extrabold">Create ad — {STEPS[step]}</p>
        <span className="text-xs font-extrabold text-brand-text">{step + 1} / 4</span>
      </div>
      <div className="mt-3.5 flex gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-border")}
          />
        ))}
      </div>

      <div className="flex-1 py-5">
        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <Field label="Ad title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deep home cleaning, 2-3 bed apartments"
                className="h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
                className="h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold focus-visible:border-brand focus-visible:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {subcategories.length > 0 ? (
              <Field label="Subcategory">
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold focus-visible:border-brand focus-visible:outline-none"
                >
                  <option value="">General</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Area you serve">
              <input
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                placeholder="Nugegoda"
                className="h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What's included, your experience, what makes you reliable."
                className="w-full rounded-xl border-[1.5px] border-border bg-surface p-4 text-sm placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint">
              <Icon name="photo_camera" className="text-2xl text-brand-text" />
            </span>
            <p className="text-[15px] font-extrabold">Photo uploads are coming soon</p>
            <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
              For now your ad shows a themed cover so buyers can still tell your
              services apart at a glance — real photos will be addable here soon.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier}
                className="rounded-2xl border-[1.5px] border-border bg-surface p-4"
              >
                <p className="text-[14.5px] font-extrabold capitalize">{tier}</p>
                <label className="mt-2 block text-xs font-bold text-muted-foreground">
                  Price (LKR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={prices[tier]}
                  onChange={(e) => setPrices((p) => ({ ...p, [tier]: e.target.value }))}
                  placeholder="5000"
                  className="mt-1.5 h-11 w-full rounded-lg border-[1.5px] border-border bg-background px-3.5 text-sm font-semibold focus-visible:border-brand focus-visible:outline-none"
                />
              </div>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-2xl border-[1.5px] border-border bg-surface p-4">
            <div className="h-[100px] rounded-xl bg-[linear-gradient(135deg,#834dfb,#6b2fe0)]" />
            <p className="mt-3 text-[15px] font-extrabold">{title || "Your ad title"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {categories.find((c) => c.id === categoryId)?.name}
              {locationArea ? ` · ${locationArea}` : ""}
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {TIERS.map((t) => (
                <div key={t} className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{t}</span>
                  <span className="font-bold">
                    {prices[t] ? formatLKR(Number(prices[t])) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {state.error ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex gap-3 py-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border-[1.5px] border-border py-4 text-[15px] font-extrabold"
          >
            Back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold">{label}</label>
      {children}
    </div>
  );
}
