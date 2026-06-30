import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Badge variant="neutral" className="mb-6 w-fit">
        <ShieldCheck /> NIC-verified providers
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight">
        Trusted local services, across Sri Lanka.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Book vetted providers, pay securely, and every job is protected by the
        Sewa Guarantee.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button block>Get started</Button>
        <Button variant="secondary" block>
          Become a provider
        </Button>
      </div>
      <Link
        href="/style-guide"
        className="mt-8 text-center text-xs text-muted-foreground underline underline-offset-4"
      >
        View design system
      </Link>
    </main>
  );
}
