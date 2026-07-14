"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { submitNic } from "./nic-actions";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Continue"}
    </button>
  );
}

function DocCard({
  icon,
  label,
  file,
  onPick,
}: {
  icon: string;
  label: string;
  file: File | null;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left",
        file ? "border-success/40" : "border-border",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          file ? "bg-success/10" : "bg-brand-tint",
        )}
      >
        <Icon
          name={file ? "check" : icon}
          filled={Boolean(file)}
          className={cn("text-[21px]", file ? "text-success" : "text-brand-text")}
        />
      </span>
      <div>
        <p className="text-[13.5px] font-extrabold">{label}</p>
        <p className={cn("mt-0.5 text-[11.5px] font-bold", file ? "text-success" : "text-muted-foreground")}>
          {file ? "Added" : "Tap to add"}
        </p>
      </div>
    </button>
  );
}

export function NicForm({ userId }: { userId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [dob, setDob] = useState("");
  const [nicFile, setNicFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const nicInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  async function handle(formData: FormData) {
    setError(null);

    if (!nicNumber.trim() || !fullName.trim() || !nicFile?.size || !selfieFile?.size) {
      setError("Fill every field and add both photos.");
      return;
    }

    const supabase = createClient();
    const stamp = Date.now();
    const ext = (f: File) => f.name.split(".").pop() || "jpg";
    const nicPath = `${userId}/nic-${stamp}.${ext(nicFile)}`;
    const selfiePath = `${userId}/selfie-${stamp}.${ext(selfieFile)}`;

    const u1 = await supabase.storage
      .from("nic-documents")
      .upload(nicPath, nicFile, { upsert: true });
    if (u1.error) return setError(u1.error.message);
    const u2 = await supabase.storage
      .from("nic-documents")
      .upload(selfiePath, selfieFile, { upsert: true });
    if (u2.error) return setError(u2.error.message);

    const payload = new FormData();
    payload.set("nic_number", nicNumber);
    payload.set("full_name", fullName);
    payload.set("date_of_birth", dob);
    payload.set("document_url", nicPath);
    payload.set("selfie_url", selfiePath);

    const res = await submitNic({}, payload);
    if (res.error) setError(res.error);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="mx-[22px] mt-4 flex items-center gap-3 rounded-2xl border-[1.5px] border-success/30 bg-success/5 p-4">
        <Icon name="check_circle" filled className="text-2xl text-success" />
        <p className="text-sm font-bold">Submitted. An admin will review it shortly.</p>
      </div>
    );
  }

  return (
    <form action={handle} className="px-[22px] pt-5">
      <h1 className="text-[26px] font-extrabold tracking-tight">Verify your identity</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We check every pro against their NIC. It stays encrypted and is never shared.
      </p>

      <label className="mb-1.5 mt-5 block text-[12.5px] font-bold text-muted-foreground">
        Full name (as on NIC)
      </label>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
        className="h-12 w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
        required
      />

      <label className="mb-1.5 mt-3.5 block text-[12.5px] font-bold text-muted-foreground">
        NIC number
      </label>
      <input
        value={nicNumber}
        onChange={(e) => setNicNumber(e.target.value)}
        placeholder="200012345678"
        className="h-12 w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold tracking-wide placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
        required
      />

      <label className="mb-1.5 mt-3.5 block text-[12.5px] font-bold text-muted-foreground">
        Date of birth
      </label>
      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="h-12 w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold focus-visible:border-brand focus-visible:outline-none"
      />

      <p className="mb-2.5 mt-5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
        DOCUMENTS
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <DocCard icon="badge" label="NIC photo" file={nicFile} onPick={() => nicInputRef.current?.click()} />
        <DocCard icon="face" label="Selfie with NIC" file={selfieFile} onPick={() => selfieInputRef.current?.click()} />
      </div>
      <input
        ref={nicInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setNicFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
      />

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-tint p-3.5">
        <Icon name="shield" filled className="mt-0.5 text-lg text-brand-text" />
        <span className="text-xs leading-relaxed">
          Documents are encrypted end-to-end and used only for verification.{" "}
          <b>Sewa Guarantee</b> backs every booking.
        </span>
      </div>

      {error ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {error}
        </p>
      ) : null}

      <div className="pb-8 pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
