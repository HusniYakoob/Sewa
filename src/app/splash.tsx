"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Plays the logo reveal, then hands off to /login once it settles. */
export function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/welcome"), 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(165deg,#834dfb,#6b2fe0)] text-white">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -right-16 top-28 h-60 w-60 rounded-full bg-white/[.08]" />
      <div className="pointer-events-none absolute -left-10 bottom-40 h-44 w-44 rounded-full bg-black/[.08]" />
      <div className="pointer-events-none absolute bottom-52 right-10 h-14 w-14 rotate-[20deg] rounded-[16px] bg-accent" />

      {/* Logo badge + wordmark */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3.5">
        <div className="splash-word relative flex h-[88px] w-[88px] items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/35" />
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <span className="text-[34px] font-black tracking-[-1px] text-brand">S</span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-2.5">
          <div className="splash-word text-[64px] font-black leading-none tracking-[-2.5px]">
            sewa<span className="splash-dot text-accent">.</span>
          </div>
          <div className="splash-tag text-base font-semibold tracking-wide text-[#E4D9FB]">
            Book it. Done.
          </div>
        </div>
      </div>

      <p className="splash-actions relative pb-10 text-center text-[11px] font-semibold tracking-[1.5px] text-white/55">
        HALF MOTION LTD · COLOMBO
      </p>
    </main>
  );
}
