import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function Home() {
  // Logged-in users skip the splash.
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/home");

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(165deg,#834dfb,#6b2fe0)] text-white">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -right-16 top-28 h-60 w-60 rounded-full bg-white/[.08]" />
      <div className="pointer-events-none absolute -left-10 bottom-40 h-44 w-44 rounded-full bg-black/[.08]" />
      <div className="pointer-events-none absolute bottom-52 right-10 h-14 w-14 rotate-[20deg] rounded-[16px] bg-accent" />

      {/* Wordmark */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-2.5">
        <div className="text-[64px] font-black leading-none tracking-[-2.5px]">
          sewa<span className="text-accent">.</span>
        </div>
        <div className="text-base font-semibold tracking-wide text-[#E4D9FB]">
          Book it. Done.
        </div>
      </div>

      {/* Entry actions */}
      <div className="relative flex flex-col gap-3 px-6 pb-8">
        <Link
          href="/signup"
          className="flex h-14 items-center justify-center rounded-2xl bg-white text-[15.5px] font-extrabold text-brand shadow-[0_12px_30px_-10px_rgba(0,0,0,.4)] transition active:scale-[.98]"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="flex h-14 items-center justify-center rounded-2xl border border-white/40 bg-white/10 text-[15.5px] font-extrabold text-white transition active:scale-[.98]"
        >
          I already have an account
        </Link>
        <p className="mt-4 text-center text-[11px] font-semibold tracking-[1.5px] text-white/55">
          HALF MOTION LTD · COLOMBO
        </p>
      </div>
    </main>
  );
}
