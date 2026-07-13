"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateProfile, type EditProfileState } from "./actions";
import { Icon } from "@/components/ui/icon";
import { IconInput } from "@/components/ui/input";
import { AvatarUpload } from "@/components/avatar-upload";

export function EditProfileForm({
  fullName,
  phone,
  email,
  avatarUrl,
}: {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState<EditProfileState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={action} className="px-[22px] pt-3">
      <Link
        href="/account"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <h1 className="mt-4 text-[22px] font-extrabold tracking-tight">Edit profile</h1>

      <div className="mt-5 flex justify-center">
        <AvatarUpload name={fullName} avatarUrl={avatarUrl} />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-bold">Full name</label>
          <IconInput icon="person" name="full_name" defaultValue={fullName} required />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-bold">Phone</label>
          <IconInput icon="call" defaultValue={phone} disabled />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Verified phone numbers can&rsquo;t be changed here.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-bold">Email</label>
          <IconInput icon="mail" name="email" type="email" defaultValue={email} />
        </div>
      </div>

      {state.error ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
