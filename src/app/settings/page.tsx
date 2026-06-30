import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-muted"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>

      <section className="mb-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Theme</span>
              <span className="text-sm text-muted-foreground">
                Light by default. Switch to dark any time.
              </span>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
