import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { connectToProvider, getAvailableProviders, isBrowser } from "../lib/wallet";
import { encryptData, decryptData } from "../utils/crypto";

// Context value describing wallet and authentication state
export interface WalletContextValue {
  status: "idle" | "loading" | "connected" | "unauthenticated" | "error";
  // True once the client has hydrated and the initial session restore has run.
  // Consumers should show a skeleton/placeholder while this is false to avoid
  // flashing state that depends on browser-only data (localStorage, extensions).
  isHydrated: boolean;
  availableProviders: string[];
  provider?: unknown;
  walletAddress?: string;
  tokens?: { accessToken: string; refreshToken: string };
  error?: Error;
  login: (walletId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  status: "idle",
  isHydrated: false,
  availableProviders: [],
  login: async () => {},
  logout: async () => {},
});

/** Hook to access wallet state */
export const useWallet = () => useContext(WalletContext);

interface ProvidersProps {
  children: ReactNode;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameLenPlus = name.length + 1;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter((cookie) => cookie.substring(0, nameLenPlus) === `${name}=`)
      .map((cookie) => decodeURIComponent(cookie.substring(nameLenPlus)))[0] || null
  );
}

/**
 * Providers component wraps the application, initializes the wallet, and manages
 * session persistence and token refresh lifecycle in an SSR-safe manner.
 */
export function Providers({ children }: ProvidersProps) {
  const [status, setStatus] = useState<WalletContextValue["status"]>("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState<unknown>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [tokens, setTokens] = useState<WalletContextValue["tokens"]>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Tracks whether this component instance is still mounted so async work
  // (session restore, login, refresh) never calls setState on an unmounted
  // instance — the source of the "connection leak" warnings in the ticket.
  const isMountedRef = useRef(false);

  // Helper to connect to provider and update state
  const connectAndSetWallet = async (walletId: string, address: string, signal?: AbortSignal) => {
    try {
      const p = await connectToProvider(walletId, signal);
      if (!isMountedRef.current || signal?.aborted) return;
      setProvider(p);
      setWalletAddress(address);
      setStatus("connected");
    } catch (e) {
      if (!isMountedRef.current || signal?.aborted) return;
      console.warn("Wallet extension connection warning:", e);
      // Even if extension connection fails, stay authenticated on client if tokens are valid
      setProvider(null);
      setWalletAddress(address);
      setStatus("connected");
    }
  };

  // Login handler
  const login = async (walletId: string) => {
    setStatus("loading");
    setError(undefined);
    try {
      let address = "";
      try {
        const p = await connectToProvider(walletId);
        setProvider(p);

        // Retrieve public key from provider if available
        const win = window as any;
        const freighter = win["freighter"] ?? win["freighterApi"] ?? win["freighterClient"];
        if (walletId === "freighter" && freighter && typeof freighter.getPublicKey === "function") {
          address = await freighter.getPublicKey();
        } else {
          address = "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP";
        }
      } catch (connErr) {
        console.warn("Wallet connection failed, falling back to mock address", connErr);
        address = "GABC4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HP";
      }

      // Call API to perform wallet SEP-0010 authentication validation
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature: "mock_signature_from_freighter", walletId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Login failed with status ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error?.message || "Login failed");
      }

      const { accessToken, refreshToken, address: authedAddress } = resData.data;

      // Encrypt and store tokens in localStorage
      const tokensObj = { accessToken, refreshToken };
      const encryptedTokens = await encryptData(JSON.stringify(tokensObj));

      localStorage.setItem("proofstell_session_provider", walletId);
      localStorage.setItem("proofstell_session_wallet", authedAddress);
      localStorage.setItem("proofstell_session_tokens", encryptedTokens);

      if (!isMountedRef.current) return;
      setTokens(tokensObj);
      setWalletAddress(authedAddress);
      setStatus("connected");
    } catch (err: any) {
      if (!isMountedRef.current) throw err;
      setError(err);
      setStatus("error");
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    if (isMountedRef.current) setStatus("loading");
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch((e) => console.error("Logout API failed", e));
    } finally {
      localStorage.removeItem("proofstell_session_provider");
      localStorage.removeItem("proofstell_session_wallet");
      localStorage.removeItem("proofstell_session_tokens");

      if (isMountedRef.current) {
        setProvider(null);
        setWalletAddress(undefined);
        setTokens(undefined);
        setStatus("unauthenticated");
      }
    }
  };

  // Token refresh helper
  const refreshSession = async (currTokens: { accessToken: string; refreshToken: string }) => {
    try {
      const csrfToken = getCookie("csrf_token");
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        body: JSON.stringify({ refreshToken: currTokens.refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh request failed");
      }

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error?.message || "Refresh rejected");
      }

      const newTokens = resData.data;
      const encryptedTokens = await encryptData(JSON.stringify(newTokens));
      localStorage.setItem("proofstell_session_tokens", encryptedTokens);

      if (isMountedRef.current) setTokens(newTokens);
      return newTokens;
    } catch (e) {
      console.error("Token refresh failed, logging out:", e);
      await logout();
      throw e;
    }
  };

  // Marks this instance as mounted for the lifetime of the component. Runs
  // before the effects below so their async continuations can safely check
  // it. React (Strict Mode in dev) may mount -> cleanup -> mount an instance
  // twice; without this, a stale first-pass restore could still land after
  // the second mount and clobber fresh state — the exact SSR/hydration race
  // this fix addresses.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Session restoration — deferred until this runs, i.e. after client
  // hydration has completed (effects never run during SSR or hydration
  // itself). An AbortController scopes every async step so a re-run or
  // unmount discards stale work instead of applying it.
  useEffect(() => {
    if (!isBrowser()) return;

    const controller = new AbortController();
    const { signal } = controller;

    setAvailableProviders(getAvailableProviders());

    const restoreSession = async () => {
      try {
        const storedProvider = localStorage.getItem("proofstell_session_provider");
        const storedWallet = localStorage.getItem("proofstell_session_wallet");
        const storedTokensEnc = localStorage.getItem("proofstell_session_tokens");

        if (!storedProvider || !storedWallet || !storedTokensEnc) {
          if (isMountedRef.current && !signal.aborted) setStatus("unauthenticated");
          return;
        }

        const decryptedTokensStr = await decryptData(storedTokensEnc);
        if (signal.aborted) return;
        if (!decryptedTokensStr) {
          throw new Error("Failed to decrypt tokens");
        }

        const restoredTokens = JSON.parse(decryptedTokensStr) as { accessToken: string; refreshToken: string };
        if (isMountedRef.current) setTokens(restoredTokens);

        const payload = parseJwt(restoredTokens.accessToken);
        if (!payload || !payload.exp) {
          throw new Error("Invalid access token format");
        }

        const timeRemainingMs = payload.exp * 1000 - Date.now();

        // Refresh tokens if expiring soon
        if (timeRemainingMs < 2 * 60 * 1000) {
          await refreshSession(restoredTokens);
        }
        if (signal.aborted) return;

        await connectAndSetWallet(storedProvider, storedWallet, signal);
      } catch (err) {
        if (signal.aborted || !isMountedRef.current) return;
        console.error("Session restoration failed:", err);
        localStorage.removeItem("proofstell_session_provider");
        localStorage.removeItem("proofstell_session_wallet");
        localStorage.removeItem("proofstell_session_tokens");
        setStatus("unauthenticated");
      } finally {
        if (isMountedRef.current && !signal.aborted) setIsHydrated(true);
      }
    };

    restoreSession();

    // Cancel any in-flight restore work if the effect re-runs or unmounts,
    // e.g. under Strict Mode's mount/cleanup/mount cycle in development.
    return () => controller.abort();
  }, []);

  // Background token refresh interval
  useEffect(() => {
    if (status !== "connected" || !tokens) return;

    const checkAndRefresh = async () => {
      if (!isMountedRef.current) return;
      const payload = parseJwt(tokens.accessToken);
      if (!payload || !payload.exp) return;

      const timeRemainingMs = payload.exp * 1000 - Date.now();
      if (timeRemainingMs < 2 * 60 * 1000) {
        try {
          await refreshSession(tokens);
        } catch (err) {
          if (isMountedRef.current) console.error("Interval auto-refresh failed", err);
        }
      }
    };

    const interval = setInterval(checkAndRefresh, 30 * 1000);
    return () => clearInterval(interval);
  }, [status, tokens]);

  return (
    <WalletContext.Provider
      value={{
        status,
        isHydrated,
        availableProviders,
        provider,
        walletAddress,
        tokens,
        error,
        login,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

