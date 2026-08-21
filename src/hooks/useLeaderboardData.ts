import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/config/environment";
import { mockPlayers } from "@/lib/mockData";

interface Player {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  level: number;
  points: number;
  avatar: string;
  wallet?: string;
  achievements: Achievement[];
  streak: number;
  gamesPlayed: number;
  winRate: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface UseLeaderboardDataOptions {
  pollIntervalMs?: number;
}

export function useLeaderboardData(options: UseLeaderboardDataOptions = {}) {
  const { pollIntervalMs = 180000 } = options;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (env.NEXT_PUBLIC_ENABLE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setPlayers(mockPlayers as Player[]);
      } else {
        throw new Error("API not implemented yet");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchWithMount = async () => {
      if (!isMounted) return;
      await fetchLeaderboard();
    };

    fetchWithMount();
    const interval = setInterval(fetchWithMount, pollIntervalMs);

    return () => {
      isMounted = false;
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [fetchLeaderboard, pollIntervalMs]);

  return { players, loading, error };
}
