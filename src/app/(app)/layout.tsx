import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { BottomNav } from "@/components/nav/bottom-nav";
import { PageTransition } from "@/components/nav/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/welcome");
  if (profile.role === "admin") redirect("/admin");
  if (!profile.onboarding_completed) redirect("/choose-role");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-md flex-1 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav context={profile.active_context} />
    </div>
  );
}
