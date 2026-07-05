"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { uploadAvatar } from "@/app/(app)/profile/actions";

/**
 * AvatarUpload — the profile-photo circle with a camera badge overlay.
 * The file is posted to a Server Action, which validates it and does the
 * Supabase Storage upload, so this component never talks to Supabase
 * directly.
 */
export function AvatarUpload({
  name,
  avatarUrl,
}: {
  name: string | null;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setPreview(result.url ?? null);
    });
  }

  return (
    <div className="relative inline-flex">
      <Avatar avatarUrl={preview} name={name} size="lg" />
      <button
        type="button"
        onClick={handlePick}
        disabled={pending}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-brand text-brand-foreground shadow-sm disabled:opacity-60"
      >
        <Icon name={pending ? "hourglass_empty" : "photo_camera"} className="text-[14px]" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {error ? (
        <p className="absolute top-full mt-1 w-40 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
