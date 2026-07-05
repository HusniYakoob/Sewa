import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Splash } from "./splash";

export default async function Home() {
  // Logged-in users skip the splash.
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/home");

  return <Splash />;
}
