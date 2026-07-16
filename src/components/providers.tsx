import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getConfiguredProviders, connectToProvider } from "../lib/wallet";

// Context value describing wallet state
export interface WalletContextValue {
  status: "idle" | "loading" | "connected" | "error";
  provider?: any;
  error?: Error;
}

const WalletContext = createContext<WalletContextValue>({ status: "idle" });

/** Hook to access wallet state */
export const useWallet = () => useContext(WalletContext);

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers component wraps the application and initializes the wallet provider in a
 * SSR‑safe manner. All window‑dependent code runs inside a `useEffect` which only
 * executes on the client. The component exposes a context so any descendant can
 * read the connection status, the provider instance, or any error.
 */
export function Providers({ children }: ProvidersProps) {
  const [status, setStatus] = useState<WalletContextValue["status"]>("idle");
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Bail out during server‑side rendering
    if (typeof window === "undefined") return;

    const configured = getConfiguredProviders();
    if (!configured.length) {
      setError(new Error("No wallet providers configured"));
      setStatus("error");
      return;
    }
    const first = configured[0];
    setStatus("loading");
    connectToProvider(first)
      .then((p) => {
        setProvider(p);
        setStatus("connected");
      })
      .catch((e) => {
        setError(e as Error);
        setStatus("error");
      });
  }, []);

  return (
    <WalletContext.Provider value={{ status, provider, error }}>
      {children}
    </WalletContext.Provider>
  );
}



