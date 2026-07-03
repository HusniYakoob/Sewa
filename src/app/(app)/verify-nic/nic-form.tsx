"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { submitNic } from "./nic-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block disabled={pending}>
      {pending ? "Submitting" : "Submit for verification"}
    </Button>
  );
}

export function NicForm({ userId }: { userId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handle(formData: FormData) {
    setError(null);
    const nic = String(formData.get("nic_number") ?? "").trim();
    const fullName = String(formData.get("full_name") ?? "").trim();
    const dob = String(formData.get("date_of_birth") ?? "");
    const nicFile = formData.get("nic_image") as File | null;
    const selfieFile = formData.get("selfie_image") as File | null;

    if (!nic || !fullName || !nicFile?.size || !selfieFile?.size) {
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
    payload.set("nic_number", nic);
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
      <Card className="m-4 flex items-center gap-2 border-success/40">
        <Icon name="check_circle" filled className="text-success" />
        <p className="text-sm font-medium">
          Submitted. An admin will review it shortly.
        </p>
      </Card>
    );
  }

  return (
    <form action={handle} className="flex flex-col gap-4 p-4">
      <Field label="Full name (as on NIC)" htmlFor="full_name">
        <Input id="full_name" name="full_name" required />
      </Field>
      <Field label="NIC number" htmlFor="nic_number">
        <Input id="nic_number" name="nic_number" placeholder="200012345678" required />
      </Field>
      <Field label="Date of birth" htmlFor="date_of_birth">
        <Input id="date_of_birth" name="date_of_birth" type="date" />
      </Field>

      <Field label="Photo of your NIC" htmlFor="nic_image">
        <Input id="nic_image" name="nic_image" type="file" accept="image/*" capture="environment" required />
      </Field>
      <Field label="Selfie holding your NIC" htmlFor="selfie_image">
        <Input id="selfie_image" name="selfie_image" type="file" accept="image/*" capture="user" required />
      </Field>

      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {error}
        </p>
      ) : null}

      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        Your documents are private and only seen by our verification team.
      </p>
    </form>
  );
}
