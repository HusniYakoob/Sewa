"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface EditProfileState {
  error?: string;
}

export interface AvatarUploadState {
  error?: string;
  url?: string;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/**
 * Upload a new profile photo to the avatars bucket and save it onto the
 * profile row. Runs server-side (not a direct browser->Supabase call) so it
 * works the same regardless of the client's network path, and so the file
 * is validated before it ever reaches storage.
 */
export async function uploadAvatar(formData: FormData): Promise<AvatarUploadState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Please choose an image file." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
  if (upErr) return { error: upErr.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/home");
  return { url };
}

export async function updateProfile(
  _prev: EditProfileState,
  formData: FormData,
): Promise<EditProfileState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!fullName) return { error: "Enter your name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, email: email || null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/account");
}
