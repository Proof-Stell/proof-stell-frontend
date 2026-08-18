import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Providers } from "@/components/providers";
import { WalletInitSkeleton } from "@/components/wallet-init-skeleton";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      {/* Client-only; shows nothing during SSR/hydration, only after mount */}
      <WalletInitSkeleton />
      <Component {...pageProps} />
    </Providers>
  );
}
