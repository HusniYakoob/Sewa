import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/icon";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/home");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-surface px-4">
        <span className="font-bold tracking-tight">Sewa Admin</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/payouts" className="text-muted-foreground hover:text-foreground">
            Payouts
          </Link>
          <Link href="/admin/nic" className="text-muted-foreground hover:text-foreground">
            NIC
          </Link>
        </nav>
        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-muted"
          >
            <Icon name="logout" />
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </div>
  );
}
