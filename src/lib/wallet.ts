import { env } from "../config/environment";

export type WalletProviderName = string;

/** Returns the list of wallet provider names from env config. Safe on server. */
export function getConfiguredProviders(): WalletProviderName[] {
  const raw = (env.NEXT_PUBLIC_WALLET_PROVIDERS as string | undefined) ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Attempts to connect to the named wallet provider.
 * Always safe to import on the server — the browser guard throws a clear error
 * if called in a non-browser context (which should never happen because all
 * callers are inside useEffect).
 */
export async function connectToProvider(name: WalletProviderName): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connections are only available in the browser.");
  }

  const win = window as any;

  // Freighter: injected as window.freighter or window.freighterApi
  if (name === "freighter") {
    const freighter =
      win.freighter ?? win.freighterApi ?? win.freighterClient ?? null;
    if (!freighter) {
      throw new Error(
        "Freighter wallet extension not detected. Please install Freighter and refresh.",
      );
    }
    if (typeof freighter.connect === "function") return freighter.connect();
    return freighter;
  }

  // Generic: look up window[providerName]
  const key = name.replace(/[^a-z0-9]/gi, "");
  const provider = win[key];
  if (provider) return provider;

  throw new Error(
    `Wallet provider "${name}" is not available. Make sure the extension is installed.`,
  );
}
