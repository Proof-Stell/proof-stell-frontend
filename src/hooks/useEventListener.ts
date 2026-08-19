import { useEffect, useRef } from "react";

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

/**
 * A safe, generic event listener hook that automatically removes the listener
 * on cleanup, preventing accumulated listeners when components mount/unmount.
 *
 * The hook stores the handler in a ref so that the effect only re-runs when
 * the event target or event name changes, not when the handler itself changes.
 * This prevents listener accumulation during re-renders.
 *
 * @param eventName - The name of the event to listen for (e.g., 'scroll', 'resize').
 * @param handler   - The callback function to invoke when the event fires.
 * @param element   - The target element/object to attach the listener to.
 *                    Defaults to `window` in browser environments.
 * @param options   - Optional `AddEventListenerOptions` such as `{ passive: true }`.
 * @param enabled   - When false, the listener is not attached (and any existing
 *                    one is removed). Lets callers defer attachment — e.g. wallet
 *                    event listeners — until client hydration is confirmed.
 *
 * @example
 * ```tsx
 * // Listen to window scroll events
 * useEventListener("scroll", () => console.log("scrolled"));
 *
 * // Listen to a specific element's resize events
 * const ref = useRef<HTMLDivElement>(null);
 * useEventListener("resize", handler, ref.current);
 * ```
 *
 * @remarks
 * - The handler reference is stored in a ref to avoid re-adding listeners on every render.
 * - The `options` parameter is intentionally omitted from dependency array to prevent
 *   frequent re-attaches. Memoize options if dynamic updates are needed.
 * - Returns early if the element doesn't support `addEventListener`.
 */
export function useEventListener<K extends keyof EventMap>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element: EventTarget = typeof window !== "undefined" ? window : ({} as EventTarget),
  options?: AddEventListenerOptions,
  enabled: boolean = true
): void {
  // Keep the handler in a ref so the effect doesn't re-run when handler changes.
  // This is crucial for preventing listener accumulation.
  const savedHandler = useRef(handler);

  // Always keep the ref current with the latest handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Guard clause: skip if disabled, or element doesn't have addEventListener.
    // `enabled` lets callers wait for hydration confirmation before attaching.
    if (!enabled || !element || typeof element.addEventListener !== "function") return;

    // Create the wrapped listener that calls the current handler
    const listener = (event: Event) =>
      savedHandler.current(event as EventMap[K]);

    // Add the event listener
    element.addEventListener(eventName, listener, options);

    // CLEANUP: Remove the listener when:
    // - The component unmounts
    // - The effect re-runs (when eventName or element changes)
    // This is the critical part that prevents memory leaks
    return () => {
      element.removeEventListener(eventName, listener, options);
    };
    // options is intentionally omitted from deps — changes to it are rare and
    // would require an additional deep-compare; callers should memoize if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, element, enabled]);
}
