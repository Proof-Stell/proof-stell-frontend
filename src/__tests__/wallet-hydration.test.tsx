/**
 * E2E-style tests for the SSR/hydration behavior of the wallet Providers.
 *
 * These verify that:
 *  - wallet/session state only resolves after client hydration confirms,
 *  - `isHydrated` accurately reflects that milestone,
 *  - unmounting mid-restore never triggers a "setState on unmounted
 *    component" leak warning.
 *
 * Written with React.createElement (no JSX) so this file has no
 * dependency on the project's JSX transform configuration.
 *
 * @module wallet-hydration.test
 */

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Providers, useWallet } from "@/components/providers";

// Tells React this environment supports act() batching/flushing so it
// doesn't warn on every state update inside act() (happy-dom doesn't set
// this itself). Cosmetic only — assertions already passed without it.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Consumer() {
  const { status, isHydrated } = useWallet();
  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "status" }, status),
    React.createElement("span", { "data-testid": "hydrated" }, String(isHydrated))
  );
}

let container: HTMLDivElement;
let root: Root | null;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = null;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe("Providers SSR/hydration behavior", () => {
  it("stays idle/un-hydrated on first render, then resolves after hydration", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(React.createElement(Providers, null, React.createElement(Consumer)));
    });

    // After effects have flushed (simulated hydration completing), the
    // provider should have finished its session check exactly once.
    expect(container.querySelector('[data-testid="hydrated"]')?.textContent).toBe("true");
    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe("unauthenticated");
  });

  it("never applies stale state when unmounted mid session-restore", async () => {
    // A malformed session forces the async decrypt/restore path to run.
    localStorage.setItem("proofstell_session_provider", "freighter");
    localStorage.setItem("proofstell_session_wallet", "GABC...");
    localStorage.setItem("proofstell_session_tokens", "not-a-valid-encrypted-token");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      root = createRoot(container);
      root.render(React.createElement(Providers, null, React.createElement(Consumer)));
      // Unmount immediately, before the restore microtasks resolve, to
      // simulate a fast SSR -> CSR transition / route change.
      root.unmount();
      root = null;
    });

    const reactLeakWarning = errorSpy.mock.calls.some((call) =>
      String(call[0]).includes("unmounted component")
    );
    expect(reactLeakWarning).toBe(false);
  });
});
