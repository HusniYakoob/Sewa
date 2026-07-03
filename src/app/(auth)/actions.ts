"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export interface AuthState {
  error?: string;
  sent?: boolean;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sewa-two.vercel.app";

/** Send a password reset email that links back to /reset-password. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { sent: true };
}

/** Set a new password (called with an active recovery session). */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Reset link expired. Request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/home");
}

/** Sign in with email + password, then send the user to their area. */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/home");
}

/**
 * Sign up as a buyer or seller. Role, name and phone are stored in auth
 * metadata; the handle_new_user trigger creates the profile (and a
 * seller_profiles row for sellers).
 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "buyer") as UserRole;

  if (!fullName || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "buyer" && role !== "seller") {
    return { error: "Choose an account type." };
  }

  const supabase = await createClient();

  // One account per phone number (normalized). Friendly check before signup.
  if (phone) {
    const { data: inUse } = await supabase.rpc("phone_in_use", { p: phone });
    if (inUse === true) {
      return { error: "This phone number is already registered." };
    }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, role } },
  });
  if (error) return { error: error.message };

  redirect("/home");
}

/** Sign out and return to the landing page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
