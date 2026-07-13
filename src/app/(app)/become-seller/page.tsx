import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const BENEFITS = [
  {
    icon: "schedule",
    title: "Work on your own schedule",
    description: "Set your own hours and service areas — accept jobs that fit your life.",
  },
  {
    icon: "lock",
    title: "Get paid safely, every time",
    description: "Payment is held in escrow and released straight to your wallet.",
  },
  {
    icon: "trending_up",
    title: "Grow with Pro tools",
    description: "Upgrade anytime for more listings, better placement and lower fees.",
  },
];

export default function BecomeSellerPage() {
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
      </div>

      <div className="px-[22px] pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1.5">
          <Icon name="bolt" filled className="text-sm text-brand-text" />
          <span className="text-[11px] font-extrabold tracking-wide text-brand-text">SEWA PRO</span>
        </span>
        <h1 className="mt-4 text-[32px] font-extrabold leading-[1.06] tracking-tight">
          Earn on your
          <br />
          own schedule.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Join 4,200+ pros across Colombo taking home real money for real work.
        </p>

        <div className="relative mt-5 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] p-5.5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-[130px] w-[130px] rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-4.5 right-5.5 h-11 w-11 rotate-[12deg] rounded-xl bg-accent/95" />
          <div className="relative">
            <p className="text-[11px] font-extrabold tracking-wide text-[#D9C9FF]">
              AVG PRO EARNINGS
            </p>
            <p className="mt-1 text-[36px] font-extrabold leading-none tracking-tight text-white">
              {"LKR 45,000"}
              <span className="text-[15px] font-bold text-[#D9C9FF]">/mo</span>
            </p>
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#E4D9FB]">
              <Icon name="trending_up" filled className="text-base text-accent" />
              Top Nugegoda cleaners earn 2× that
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 pb-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5">
              <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-2xl bg-brand-tint">
                <Icon name={b.icon} filled className="text-[23px] text-brand-text" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-extrabold">{b.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-[22px] pb-8">
        <Link
          href="/plans"
          className="flex items-center justify-center rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)]"
        >
          See plans
        </Link>
      </div>
    </div>
  );
}
