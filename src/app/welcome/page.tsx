import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { GoogleButton, AuthDivider } from "@/app/(auth)/parts";

export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      {/* Gradient hero */}
      <div className="relative overflow-hidden rounded-b-[34px] bg-[linear-gradient(160deg,#834dfb,#6b2fe0)] pb-11 dark:bg-[linear-gradient(160deg,#834dfb,#5b27c9)]">
        <div className="pointer-events-none absolute -right-12 -top-2 h-48 w-48 rounded-full bg-white/[.09]" />
        <div className="pointer-events-none absolute -left-10 bottom-5 h-32 w-32 rounded-full bg-white/[.06]" />
        <div className="pointer-events-none absolute right-10 top-[150px] h-[34px] w-[34px] rotate-[16deg] rounded-[9px] bg-accent/95" />
        <div className="relative flex flex-col items-center px-6 pt-11 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-[0_12px_30px_rgba(0,0,0,.18)]">
            <Icon name="home_repair_service" filled className="text-[34px] text-brand" />
          </span>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/[.16] px-3 py-1.5">
            <span className="text-xs font-bold text-white">සේවා</span>
            <span className="h-[3px] w-[3px] rounded-full bg-white/60" />
            <span className="text-[10px] font-extrabold tracking-wider text-[#E4D9FB]">
              SERVICES, SORTED
            </span>
          </span>
          <h1 className="mt-4 text-[56px] font-black leading-none tracking-[-2px] text-white">
            Sewa
          </h1>
          <p className="mt-2.5 max-w-[250px] text-[15.5px] leading-snug text-[#E4D9FB]">
            Cleaners, repairs, movers &amp; more — booked in minutes, backed by escrow.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            <div className="flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#7a43e8] bg-accent text-[11px] font-extrabold text-[#6b2fe0]">
                K
              </span>
              <span className="-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#7a43e8] bg-[#3ddc84] text-[11px] font-extrabold text-[#0b5535]">
                N
              </span>
              <span className="-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#7a43e8] bg-[#ff9bb3] text-[11px] font-extrabold text-[#7a1436]">
                A
              </span>
            </div>
            <span className="text-xs font-semibold text-[#E4D9FB]">
              4,200+ pros across Colombo
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
        <div className="flex-1" />
        <Link
          href="/login"
          className="flex items-center justify-center rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_12px_28px_rgba(131,77,251,.3)] transition active:scale-[.98]"
        >
          Continue with Email
        </Link>
        <AuthDivider />
        <form action={signInWithGoogle}>
          <GoogleButton>Continue with Google</GoogleButton>
        </form>
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          By continuing you agree to Sewa&rsquo;s
          <br />
          <b className="text-foreground underline">Terms of Service</b> and{" "}
          <b className="text-foreground underline">Privacy Policy</b>.
        </p>
      </div>
    </main>
  );
}
