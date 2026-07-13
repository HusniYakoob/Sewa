import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationToggles } from "./notification-toggles";

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/account"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[19px] font-extrabold">Settings</p>
      </div>

      <div className="px-[22px] pb-24 pt-5">
        <p className="mb-2.5 text-[11.5px] font-extrabold tracking-wide text-muted-foreground">
          APPEARANCE
        </p>
        <ThemeToggle />

        <p className="mb-2.5 mt-[22px] text-[11.5px] font-extrabold tracking-wide text-muted-foreground">
          NOTIFICATIONS
        </p>
        <NotificationToggles />

        <p className="mb-2.5 mt-[22px] text-[11.5px] font-extrabold tracking-wide text-muted-foreground">
          LANGUAGE
        </p>
        <div className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-border bg-surface p-4 opacity-70">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-muted">
            <Icon name="language" className="text-[19px] text-brand-text" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">English</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              සිංහල · தமிழ் — coming soon
            </p>
          </div>
        </div>

        <p className="mb-2.5 mt-[22px] text-[11.5px] font-extrabold tracking-wide text-muted-foreground">
          DANGER ZONE
        </p>
        <Link
          href="/account/delete"
          className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-danger/30 bg-surface p-4"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-danger/10">
            <Icon name="delete_forever" className="text-[19px] text-danger" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-danger">Delete account</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Permanently erase your data
            </p>
          </div>
          <Icon name="chevron_right" className="text-muted-foreground/40" />
        </Link>
      </div>
    </div>
  );
}
