import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const FAQS = [
  { q: "How does payment protection work?", a: "Your payment is held safely and only released to the provider after your END PIN confirms the job is done." },
  { q: "What if I need to cancel?", a: "Cancel for free up to 24 hours before your booking. Later cancellations carry a fee — see the cancellation policy on your booking." },
  { q: "How do I become a seller?", a: "Go to Account → Become a Seller, choose a plan, and complete NIC verification." },
];

export default function HelpPage() {
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
        <p className="text-[17px] font-extrabold">Help &amp; Support</p>
      </div>

      <div className="px-[22px] pb-24 pt-4">
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3">
          <Icon name="search" className="text-muted-foreground" />
          <span className="text-[13.5px] text-muted-foreground">Search help articles</span>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#25D366]/10 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]">
            <Icon name="chat" filled className="text-xl text-white" />
          </span>
          <div className="flex-1">
            <p className="text-[14.5px] font-extrabold">WhatsApp support</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Coming soon — add your business WhatsApp number to enable this.
            </p>
          </div>
        </div>

        <p className="mb-2.5 mt-6 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          FREQUENTLY ASKED
        </p>
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-border bg-surface">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border p-4 last:border-b-0">
              <p className="text-[13px] font-extrabold">{f.q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>

        <p className="mb-2.5 mt-6 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          STILL NEED HELP?
        </p>
        <div className="flex flex-col gap-2.5">
          <a
            href="mailto:support@sewa.lk"
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-3.5"
          >
            <Icon name="mail" className="text-brand-text" />
            <span className="text-sm font-bold">Email us</span>
          </a>
          <Link
            href="/help/report"
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-danger/30 bg-surface p-3.5"
          >
            <Icon name="flag" className="text-danger" />
            <span className="text-sm font-bold text-danger">Report a problem</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
