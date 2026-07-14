"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Wraps page content so navigating between screens gets a quick fade + rise
 * instead of a hard cut. Animates only transform/opacity (compositor-only
 * properties) so it stays smooth under WebView JS-thread pressure — the
 * same reason this app's CSS keyframes (splash, buttons) avoid layout
 * properties too. No exit animation on purpose: the new page mounts and
 * animates in immediately rather than waiting on the old one to fade out,
 * so navigation never *feels* delayed.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
