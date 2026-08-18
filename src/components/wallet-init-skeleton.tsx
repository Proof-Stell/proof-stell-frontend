"use client";

import { useWallet } from "@/components/providers";

/**
 * Thin top-of-page progress bar shown while the wallet session is being
 * restored on the client. Renders nothing once hydration + the initial
 * session check has finished (isHydrated), so it never affects layout
 * or SSR output — it only ever appears client-side, after mount.
 */
export function WalletInitSkeleton() {
  const { isHydrated } = useWallet();

  if (isHydrated) return null;

  return (
    <div
      role="status"
      aria-label="Restoring wallet session"
      className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-transparent"
    >
      <div className="h-full w-1/3 animate-pulse bg-primary" />
    </div>
  );
}
