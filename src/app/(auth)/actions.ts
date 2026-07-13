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
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const role = String(formData.get("role") ?? "buyer") as UserRole;

  if (!fullName || !email || !phone || !password) {
    return { error: "Name, email, phone and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
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

/** Start Google OAuth. Requires the Google provider enabled in Supabase Auth. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE}/auth/callback?next=/home` },
  });
  if (error || !data?.url) {
    redirect("/login?error=google");
  }
  redirect(data.url);
}

/** Email a one-time code, then go to the OTP screen. */
export async function sendEmailCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) return { error: error.message };
  redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
}

/** Verify the 6-digit email code and sign in. */
export async function verifyEmailCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (token.length < 6) return { error: "Enter the 6-digit code." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: error.message };
  redirect("/home");
}

/**
 * Text a one-time code to a Sri Lankan mobile number, then go to the phone
 * OTP screen. Requires an SMS provider (e.g. Twilio) enabled in Supabase
 * Auth — until then this errors gracefully with Supabase's own message.
 */
export async function sendPhoneCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!/^\+94\d{9}$/.test(phone)) {
    return { error: "Enter a valid Sri Lankan mobile number." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: error.message };
  redirect(`/verify-phone?phone=${encodeURIComponent(phone)}`);
}

/**
 * Verify the phone OTP and sign in. First-time accounts (onboarding not yet
 * completed) go to /choose-role; returning users go straight to /home.
 */
export async function verifyPhoneCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (token.length < 6) return { error: "Enter the 6-digit code." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Something went wrong. Try again." };

  await supabase.from("profiles").update({ phone_verified: true }).eq("id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile?.onboarding_completed ? "/home" : "/choose-role");
}

/**
 * a5 — finish onboarding by picking buyer or seller. Creates a
 * seller_profiles row (Starter plan) the first time someone chooses seller;
 * safe to call again later from Account's "Become a Seller" banner.
 */
export async function completeRoleChoice(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "") as UserRole;
  if (role !== "buyer" && role !== "seller") redirect("/choose-role");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  await supabase
    .from("profiles")
    .update({ role, active_context: role, onboarding_completed: true })
    .eq("id", user.id);

  if (role === "seller") {
    const { data: existing } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) {
      const { data: starterPlan } = await supabase
        .from("plans")
        .select("id, commission_rate")
        .eq("key", "starter")
        .maybeSingle();
      await supabase.from("seller_profiles").insert({
        user_id: user.id,
        plan_id: starterPlan?.id,
        commission_rate: starterPlan?.commission_rate ?? 0.1,
      });
    }
  }

  redirect("/notifications-permission");
}
