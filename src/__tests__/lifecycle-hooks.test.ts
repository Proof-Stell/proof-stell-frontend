import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVerificationSimulation } from "@/hooks/useVerificationSimulation";
import { useScrolled } from "@/hooks/useScrolled";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { mockPlayers } from "@/lib/mockData";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("useVerificationSimulation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at step 0 and is not verified by default", () => {
    const { result } = renderHook(() => useVerificationSimulation());

    expect(result.current.activeStep).toBe(0);
    expect(result.current.verified).toBe(false);
  });

  it("advances one step per interval tick", () => {
    const { result } = renderHook(() =>
      useVerificationSimulation({ intervalMs: 900 })
    );

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.activeStep).toBe(1);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.activeStep).toBe(2);
    expect(result.current.verified).toBe(false);
  });

  it("marks verified after all steps and stops advancing", () => {
    const { result } = renderHook(() =>
      useVerificationSimulation({ intervalMs: 900, stepCount: 4 })
    );

    act(() => {
      vi.advanceTimersByTime(900 * 4);
    });
    expect(result.current.activeStep).toBe(3);
    expect(result.current.verified).toBe(true);

    act(() => {
      vi.advanceTimersByTime(900 * 10);
    });
    expect(result.current.activeStep).toBe(3);
    expect(result.current.verified).toBe(true);
  });

  it("does not progress when disabled", () => {
    const { result } = renderHook(() =>
      useVerificationSimulation({ enabled: false })
    );

    act(() => {
      vi.advanceTimersByTime(900 * 20);
    });

    expect(result.current.activeStep).toBe(0);
    expect(result.current.verified).toBe(false);
  });

  it("clears the interval on unmount", () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() => useVerificationSimulation());

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

describe("useScrolled", () => {
  let originalScrollY: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalScrollY) {
      Object.defineProperty(window, "scrollY", originalScrollY);
    } else {
      Reflect.deleteProperty(window, "scrollY");
    }
  });

  it("returns false initially", () => {
    setScrollY(0);
    const { result } = renderHook(() => useScrolled(20));

    expect(result.current).toBe(false);
  });

  it("returns true when scrolled past the threshold", () => {
    setScrollY(100);
    const { result } = renderHook(() => useScrolled(20));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("returns false again when scrolled back above the threshold", () => {
    setScrollY(100);
    const { result } = renderHook(() => useScrolled(20));

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    setScrollY(5);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });

  it("removes the scroll listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrolled(20));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("useLeaderboardData", () => {
  const requiredKeys = [
    "NEXT_PUBLIC_SOROBAN_RPC_URL",
    "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
    "NEXT_PUBLIC_STELLAR_HORIZON_URL",
    "NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID",
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    for (const key of requiredKeys) delete process.env[key];
    delete process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA;
  });

  it("starts in a loading state with no players", () => {
    process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA = "true";
    const { result } = renderHook(() => useLeaderboardData());

    expect(result.current.loading).toBe(true);
    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("populates players after the mock fetch resolves", async () => {
    process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA = "true";
    const { result } = renderHook(() => useLeaderboardData());

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.players).toHaveLength(mockPlayers.length);
    expect(result.current.players[0]?.name).toBe(mockPlayers[0].name);
  });

  it("sets an error state when the API is not implemented", async () => {
    delete process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA;
    const { result } = renderHook(() => useLeaderboardData());

    await act(async () => {});

    expect(result.current.error).toBe("Failed to load leaderboard data");
    expect(result.current.loading).toBe(false);
    expect(result.current.players).toEqual([]);
  });

  it("refetches on the polling interval", async () => {
    process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA = "true";
    const { result } = renderHook(() =>
      useLeaderboardData({ pollIntervalMs: 5000 })
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.loading).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.players).toHaveLength(mockPlayers.length);
  });
});
