import { useState, useEffect, useRef } from "react";

interface UseVerificationSimulationOptions {
  enabled?: boolean;
  intervalMs?: number;
  stepCount?: number;
}

export function useVerificationSimulation(options: UseVerificationSimulationOptions = {}) {
  const { enabled = true, intervalMs = 900, stepCount = 4 } = options;
  const [activeStep, setActiveStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === stepCount - 1) {
          if (isMounted) setVerified(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, stepCount]);

  return { activeStep, verified };
}
