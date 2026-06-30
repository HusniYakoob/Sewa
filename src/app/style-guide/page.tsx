import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Living style guide. Renders every design-system primitive so the brand can be
 * reviewed and tweaked from one place. Visit /style-guide.
 */
export default function StyleGuidePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Sewa</p>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Black and white brand for now. Every colour, radius and font lives in
          one place (globals.css) and recolours from a single token later.
        </p>
      </header>

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Swatch name="brand" className="bg-brand" />
          <Swatch name="foreground" className="bg-foreground" />
          <Swatch name="surface-muted" className="bg-surface-muted border" />
          <Swatch name="border" className="bg-border" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="info" className="bg-info" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Neutrals are the brand. Status colours are functional and stay coloured
          so states remain readable.
        </p>
      </Section>

      <Section title="Icons (Material Symbols)">
        <div className="flex flex-wrap gap-5 text-foreground">
          {[
            "search",
            "home",
            "person",
            "verified_user",
            "calendar_today",
            "payments",
            "pin",
            "star",
            "notifications",
            "settings",
          ].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <Icon name={n} className="text-2xl" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {n}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Book now</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Cancel booking</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
        <Button block className="mt-3">
          Full width (mobile primary)
        </Button>
      </Section>

      <Section title="Inputs">
        <div className="flex flex-col gap-4">
          <Field label="Full name" htmlFor="name">
            <Input id="name" placeholder="Priya Sharma" />
          </Field>
          <Field
            label="Phone number"
            htmlFor="phone"
            hint="We will send a verification code."
          >
            <Input id="phone" type="tel" placeholder="+94 77 123 4567" />
          </Field>
          <Field label="Email" htmlFor="email" error="Enter a valid email.">
            <Input id="email" type="email" placeholder="you@example.com" />
          </Field>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            <Icon name="verified" filled /> NIC Verified
          </Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Failed</Badge>
          <Badge variant="info">In progress</Badge>
          <Badge variant="solid">Pro</Badge>
          <Badge>
            <Icon name="star" filled /> 4.9
          </Badge>
        </div>
      </Section>

      <Section title="Cards">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deep Home Cleaning</CardTitle>
              <Badge variant="success">
                <Icon name="verified" filled /> Verified
              </Badge>
            </div>
            <CardDescription>
              Kumara P. · Colombo 4 · 4.9 rating (32)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-semibold tabular-nums">
                LKR 5,000
              </span>
              <Button size="sm">
                <Icon name="visibility" /> View
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 w-full rounded-lg ${className ?? ""}`} />
      <span className="font-mono text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
