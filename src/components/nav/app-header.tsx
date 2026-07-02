import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/**
 * App screen header. Optional back link and a single trailing action to keep
 * one clear focus per screen.
 */
export function AppHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: { href: string; icon: string; label: string };
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-muted"
        >
          <Icon name="arrow_back" />
        </Link>
      ) : null}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
      {action ? (
        <Link
          href={action.href}
          aria-label={action.label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-muted"
        >
          <Icon name={action.icon} />
        </Link>
      ) : null}
    </header>
  );
}
