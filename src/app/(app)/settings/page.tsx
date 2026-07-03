import { AppHeader } from "@/components/nav/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <AppHeader title="Settings" backHref="/profile" />
      <div className="p-4">
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
      </div>
    </div>
  );
}
