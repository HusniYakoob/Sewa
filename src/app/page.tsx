import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-bold leading-tight tracking-tight">
        Trusted local services, across Sri Lanka.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Book vetted providers and pay securely. Every job is covered by the Sewa
        Guarantee.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/signup" className={buttonVariants({ block: true })}>
          Get started
        </Link>
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary", block: true })}
        >
          Sign in
        </Link>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Icon name="verified_user" className="text-lg" />
        Every provider is NIC verified
      </p>

      <div className="mt-10 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/style-guide" className="underline underline-offset-4">
          Design system
        </Link>
        <Link href="/settings" className="underline underline-offset-4">
          Settings
        </Link>
      </div>
    </main>
  );
}
