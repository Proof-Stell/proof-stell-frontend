import { env } from "../config/environment";

export type WalletProviderName = string;

/** Returns the list of wallet provider names from env config. Safe on server. */
export function getConfiguredProviders(): WalletProviderName[] {
  const raw = (env.NEXT_PUBLIC_WALLET_PROVIDERS as string | undefined) ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

type BrowserWindow = Window & typeof globalThis & Record<string, unknown>;

interface FreighterProvider {
  connect?: () => Promise<unknown>;
  [key: string]: unknown;
}

/** True only once we're actually executing in a browser tab (never during SSR). */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Synchronously checks whether a provider's extension has injected itself into window. */
function detectProvider(name: WalletProviderName): boolean {
  if (!isBrowser()) return false;
  const win = window as BrowserWindow;
  if (name === "freighter") {
    return Boolean(win["freighter"] ?? win["freighterApi"] ?? win["freighterClient"]);
  }
  const key = name.replace(/[^a-z0-9]/gi, "");
  return Boolean(win[key]);
}

/**
 * Returns configured providers that are actually detected in the current browser.
 * Always returns [] on the server so callers can render a consistent fallback
 * state until hydration confirms what's really installed on the client.
 */
export function getAvailableProviders(): WalletProviderName[] {
  if (!isBrowser()) return [];
  return getConfiguredProviders().filter(detectProvider);
}

/**
 * Attempts to connect to the named wallet provider.
 * Always safe to import on the server — the browser guard throws a clear error
 * if called in a non-browser context (which should never happen because all
 * callers are inside useEffect).
 *
 * Accepts an optional AbortSignal so callers (e.g. a React effect that gets
 * cancelled on unmount or re-run) can discard an in-flight connection attempt
 * instead of applying a stale result — this is what prevents connection leaks.
 */
export async function connectToProvider(
  name: WalletProviderName,
  signal?: AbortSignal,
): Promise<unknown> {
  if (!isBrowser()) {
    throw new Error("Wallet connections are only available in the browser.");
  }
  if (signal?.aborted) {
    throw new DOMException("Wallet connection attempt was aborted.", "AbortError");
  }

  const win = window as BrowserWindow;
  let result: unknown;

  // Freighter: injected as window.freighter or window.freighterApi
  if (name === "freighter") {
    const freighter =
      (win["freighter"] ?? win["freighterApi"] ?? win["freighterClient"] ?? null) as FreighterProvider | null;
    if (!freighter) {
      throw new Error(
        "Freighter wallet extension not detected. Please install Freighter and refresh.",
      );
    }
    result = typeof freighter.connect === "function" ? await freighter.connect() : freighter;
  } else {
    // Generic: look up window[providerName]
    const key = name.replace(/[^a-z0-9]/gi, "");
    const provider = win[key];
    if (!provider) {
      throw new Error(
        `Wallet provider "${name}" is not available. Make sure the extension is installed.`,
      );
    }
    result = provider;
  }

  // Re-check after the await: the caller may have aborted while we were connecting.
  if (signal?.aborted) {
    throw new DOMException("Wallet connection attempt was aborted.", "AbortError");
  }
  return result;
}
