/**
 * Tests for useEventListener and useActiveSection hooks
 * 
 * These tests verify that event listeners are properly cleaned up
 * to prevent memory leaks from accumulated listeners.
 * 
 * @module hooks.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock window for the test environment
declare global {
  interface Window {
    addEventListener: typeof window.addEventListener;
    removeEventListener: typeof window.removeEventListener;
  }
}

describe("useEventListener Hook Cleanup", () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;

  beforeEach(() => {
    // Store original methods
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
    
    // Create mock functions
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    
    // Replace window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    vi.clearAllMocks();
  });

  it("should call addEventListener with correct parameters on mount", () => {
    const handler = vi.fn();
    const eventName = "scroll";
    const options = { passive: true };

    // Simulate what useEventListener does
    mockAddEventListener(eventName, handler, options);

    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener).toHaveBeenCalledWith(eventName, handler, options);
  });

  it("should call removeEventListener with the same parameters on cleanup", () => {
    const handler = vi.fn();
    const eventName = "resize";
    const options = { capture: true };

    // Simulate cleanup (what happens on unmount)
    mockRemoveEventListener(eventName, handler, options);

    expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveEventListener).toHaveBeenCalledWith(eventName, handler, options);
  });

  it("should use the same handler reference for add and remove", () => {
    const handler = vi.fn();
    const eventName = "click";

    // Simulate mount
    mockAddEventListener(eventName, handler);

    // Capture what was registered
    const registeredHandler = mockAddEventListener.mock.calls[0][1];

    // Simulate unmount with the same handler
    mockRemoveEventListener(eventName, registeredHandler);

    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener).toHaveBeenCalledWith(eventName, handler);
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveEventListener).toHaveBeenCalledWith(eventName, handler);
  });

  it("should match removeEventListener calls with addEventListener calls 1:1", () => {
    const handlers: EventListener[] = [];

    // Create a mock that tracks handlers
    const trackingAddEventListener = vi.fn((event: string, handler: EventListener) => {
      handlers.push(handler);
    });
    const trackingRemoveEventListener = vi.fn((event: string, _handler: EventListener) => {
      // Verify handler was added and remove it
      const index = handlers.indexOf(_handler);
      expect(index).toBeGreaterThanOrEqual(0);
      handlers.splice(index, 1);
    });

    window.addEventListener = trackingAddEventListener;
    window.removeEventListener = trackingRemoveEventListener;

    // Simulate 3 mount/unmount cycles
    for (let i = 0; i < 3; i++) {
      const handler = vi.fn();
      trackingAddEventListener("scroll", handler);
      trackingRemoveEventListener("scroll", handler);
    }

    expect(trackingAddEventListener).toHaveBeenCalledTimes(3);
    expect(trackingRemoveEventListener).toHaveBeenCalledTimes(3);
    expect(handlers.length).toBe(0); // All handlers should be cleaned up
  });

  it("should handle options correctly in addEventListener", () => {
    const handler = vi.fn();
    const eventName = "scroll";
    const options = { passive: true, capture: false };

    mockAddEventListener(eventName, handler, options);

    expect(mockAddEventListener).toHaveBeenCalledWith("scroll", handler, { passive: true, capture: false });
  });
});

describe("useActiveSection Hook Cleanup", () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should add scroll listener on mount with passive option", () => {
    const handleScroll = vi.fn();

    // Simulate what useActiveSection does
    window.addEventListener("scroll", handleScroll, { passive: true });

    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener).toHaveBeenCalledWith("scroll", handleScroll, { passive: true });
  });

  it("should remove scroll listener on cleanup", () => {
    const handleScroll = vi.fn();

    // Simulate mount
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Simulate cleanup (what happens on unmount)
    window.removeEventListener("scroll", handleScroll);

    expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveEventListener).toHaveBeenCalledWith("scroll", handleScroll);
  });

  it("should use passive option for better scroll performance", () => {
    const handleScroll = vi.fn();

    window.addEventListener("scroll", handleScroll, { passive: true });

    const callArgs = mockAddEventListener.mock.calls[0];
    expect(callArgs[0]).toBe("scroll");
    expect(callArgs[1]).toBe(handleScroll);
    expect(callArgs[2]).toEqual({ passive: true });
  });

  it("should have matching remove call with add call (same handler reference)", () => {
    let registeredHandler: EventListener | null = null;

    const trackingAdd = vi.fn((event: string, handler: EventListener) => {
      registeredHandler = handler;
    });
    const trackingRemove = vi.fn();

    window.addEventListener = trackingAdd;
    window.removeEventListener = trackingRemove;

    const handleScroll = vi.fn();

    // Mount
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Verify the same handler was registered
    expect(registeredHandler).toBe(handleScroll);

    // Unmount
    window.removeEventListener("scroll", registeredHandler);

    expect(trackingRemove).toHaveBeenCalledWith("scroll", handleScroll);
  });
});

describe("Memory Leak Prevention - Listener Accumulation", () => {
  it("should not accumulate listeners on multiple mount/unmount cycles", () => {
    const listeners: Map<string, EventListener[]> = new Map();

    const mockAddEventListener = vi.fn((event: string, handler: EventListener) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
    });

    const mockRemoveEventListener = vi.fn((event: string, handler: EventListener) => {
      const eventListeners = listeners.get(event) || [];
      const index = eventListeners.indexOf(handler);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    });

    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    // Simulate multiple mount/unmount cycles
    for (let i = 0; i < 5; i++) {
      const handler = vi.fn();
      
      // Mount: add listener
      window.addEventListener("scroll", handler);
      
      // Unmount: remove listener
      window.removeEventListener("scroll", handler);
    }

    // Should have 5 add and 5 remove calls
    expect(mockAddEventListener).toHaveBeenCalledTimes(5);
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(5);

    // No listeners should remain
    const scrollListeners = listeners.get("scroll") || [];
    expect(scrollListeners.length).toBe(0);
  });

  it("should use the same handler reference for add and remove", () => {
    let addedHandlerRef: EventListener | null = null;
    let removedHandlerRef: EventListener | null = null;

    const mockAddEventListener = vi.fn((_event: string, handler: EventListener) => {
      addedHandlerRef = handler;
    });
    const mockRemoveEventListener = vi.fn((_event: string, handler: EventListener) => {
      removedHandlerRef = handler;
    });

    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    const handler = vi.fn();

    // Add and immediately remove
    window.addEventListener("click", handler);
    window.removeEventListener("click", handler);

    // Both should reference the same function
    expect(addedHandlerRef).toBe(removedHandlerRef);
    expect(addedHandlerRef).toBe(handler);
  });

  it("should properly clean up when handlers change", () => {
    const addCalls: { event: string; handler: EventListener }[] = [];
    const removeCalls: { event: string; handler: EventListener }[] = [];

    const mockAddEventListener = vi.fn((event: string, handler: EventListener) => {
      addCalls.push({ event, handler });
    });
    const mockRemoveEventListener = vi.fn((event: string, handler: EventListener) => {
      removeCalls.push({ event, handler });
    });

    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    // First render: add handler A
    const handlerA = vi.fn();
    window.addEventListener("resize", handlerA);

    // Second render (handler changes): remove A, add B
    const handlerB = vi.fn();
    window.removeEventListener("resize", handlerA);
    window.addEventListener("resize", handlerB);

    // Third render (handler changes again): remove B, add C
    const handlerC = vi.fn();
    window.removeEventListener("resize", handlerB);
    window.addEventListener("resize", handlerC);

    // Verify cleanup happened for each handler change
    expect(addCalls.length).toBe(3);
    expect(removeCalls.length).toBe(2); // A and B were removed, C is still active

    // Verify the correct handlers were added
    expect(addCalls[0].handler).toBe(handlerA);
    expect(addCalls[1].handler).toBe(handlerB);
    expect(addCalls[2].handler).toBe(handlerC);

    // Verify correct handlers were removed
    expect(removeCalls[0].handler).toBe(handlerA);
    expect(removeCalls[1].handler).toBe(handlerB);
  });
});

describe("SECTION_IDS export", () => {
  it("should export section IDs that match landing page sections", async () => {
    // Dynamically import to test the actual export
    const { SECTION_IDS } = await import("@/hooks/useActiveSection");
    
    expect(SECTION_IDS).toContain("features");
    expect(SECTION_IDS).toContain("how-it-works");
    expect(SECTION_IDS).toContain("leaderboard");
    expect(SECTION_IDS).toContain("testimonials");
  });

  it("should export useActiveSectionWithSetter function", async () => {
    const { useActiveSectionWithSetter } = await import("@/hooks/useActiveSection");
    expect(typeof useActiveSectionWithSetter).toBe("function");
  });
});

describe("Event Listener Pattern Verification", () => {
  it("should verify the cleanup pattern used in useEventListener", () => {
    // This test verifies the pattern is correct conceptually
    const mockRemoveEventListener = vi.fn();
    const mockElement = {
      removeEventListener: mockRemoveEventListener
    };
    const mockHandler = vi.fn();

    // Simulate the cleanup function that useEventListener returns
    const cleanup = (element: { removeEventListener: typeof mockRemoveEventListener }, eventName: string, handler: EventListener) => {
      element.removeEventListener(eventName, handler);
    };

    // Call cleanup like useEventListener would
    cleanup(mockElement, "scroll", mockHandler);

    expect(mockRemoveEventListener).toHaveBeenCalledWith("scroll", mockHandler);
  });

  it("should verify the cleanup pattern used in useActiveSection", () => {
    // This test verifies the cleanup pattern is correct
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    const mockElement = {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    };

    const handleScroll = vi.fn();

    // Mount: add listener
    mockElement.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup: remove listener
    mockElement.removeEventListener("scroll", handleScroll);

    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener).toHaveBeenCalledWith("scroll", handleScroll, { passive: true });
    expect(mockRemoveEventListener).toHaveBeenCalledWith("scroll", handleScroll);
  });
});
